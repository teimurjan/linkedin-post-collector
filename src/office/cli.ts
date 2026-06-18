// CLI for The Post Office.
//   bun run office                 → serve the UI (default)
//   bun run office serve [--port]  → serve the UI
//   bun run office open [--port]   → ensure the UI is up + visible (cmux or browser)
//   bun run office emit --stage <id> --event start|end [--response-file <p>]
//   bun run office emit-hook       → read a hook's stdin JSON, light the matching stage
//   bun run office reset           → clear the board (new run)
//
// The `open`/`emit`/`reset` subcommands are what Claude Code's pipeline skills
// call to drive the office live; `serve` is what the owner runs to watch it.
// `emit-hook` is the deterministic path: a UserPromptSubmit / PreToolUse(Skill)
// hook pipes its payload here, and we light the stage without the model having
// to remember to emit `start` itself.

import { readFile } from "node:fs/promises";
import { openOffice } from "./server/launch.ts";
import { startOfficeServer } from "./server/office.ts";
import {
  type AgentId,
  emitStageEnd,
  emitStageStart,
  isAgentId,
  resetOffice,
} from "./server/state.ts";

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : undefined;
}

// Which pipeline skill drives which office figure. Skills not listed here
// (e.g. post-cycle, which orchestrates the others) light no stage of their own.
const SKILL_STAGE: Record<string, AgentId> = {
  "topics-briefing": "scout",
  "post-ideator": "ideator",
  "post-writer": "writer",
  "post-image": "illustrator",
  "post-carousel": "illustrator",
  "post-flowchart": "illustrator",
  "post-critic": "critic",
  "post-retro": "analyst",
};

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

// Pull the skill name from either hook payload shape:
//   PreToolUse(Skill):  { tool_input: { skill: "post-retro" } }
//   UserPromptSubmit:   { prompt: "/post-retro latest post" }
function skillFromHookPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Record<string, unknown>;

  const toolInput = p.tool_input;
  if (toolInput && typeof toolInput === "object") {
    const skill = (toolInput as Record<string, unknown>).skill;
    if (typeof skill === "string") return skill;
  }

  if (typeof p.prompt === "string") {
    const match = p.prompt.match(/^\s*\/([a-z0-9-]+)/i);
    if (match) return match[1];
  }

  return undefined;
}

// Best-effort: a hook must never block the prompt or the tool call, so any
// parse/IO failure is swallowed and the office simply stays as it was.
async function emitHook(): Promise<void> {
  try {
    const skill = skillFromHookPayload(JSON.parse(await readStdin()));
    const stage = skill ? SKILL_STAGE[skill] : undefined;
    if (stage) await emitStageStart(stage);
  } catch {
    // a broken hook should be invisible to the user
  }
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function emit(argv: string[]): Promise<void> {
  const stage = flag(argv, "stage");
  const event = flag(argv, "event");
  if (!isAgentId(stage)) {
    fail(
      "office emit: --stage must be one of analyst|scout|ideator|writer|illustrator|critic",
    );
  }
  const id = stage as AgentId;

  if (event === "start") {
    await emitStageStart(id);
    return;
  }
  if (event === "end") {
    const file = flag(argv, "response-file");
    const inline = flag(argv, "response");
    const response = file
      ? await readFile(file, "utf8").catch(() => inline ?? "")
      : (inline ?? "");
    await emitStageEnd(id, response.trim());
    return;
  }
  fail("office emit: --event must be start or end");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0] && !argv[0].startsWith("--") ? argv[0] : "serve";

  switch (command) {
    case "serve":
      startOfficeServer({ port: Number(flag(argv, "port")) || undefined });
      return;
    case "open":
      await openOffice({ port: Number(flag(argv, "port")) || undefined });
      return;
    case "emit":
      await emit(argv);
      return;
    case "emit-hook":
      await emitHook();
      return;
    case "reset":
      await resetOffice();
      process.stdout.write("office reset\n");
      return;
    default:
      fail(`office: unknown command "${command}"`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
