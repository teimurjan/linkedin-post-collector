// CLI for The Post Office.
//   bun run office                 → serve the UI (default)
//   bun run office serve [--port]  → serve the UI
//   bun run office open [--port]   → ensure the UI is up + visible (cmux or browser)
//   bun run office emit --stage <id> --event start|end [--response-file <p>]
//   bun run office reset           → clear the board (new run)
//
// The `open`/`emit`/`reset` subcommands are what Claude Code's pipeline skills
// call to drive the office live; `serve` is what the owner runs to watch it.

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
