// Live pipeline state shared between Claude Code (writer) and the office UI
// (reader). Claude Code's skills shell out to `office emit`, which patches
// `.office/state.json`; the running server fs.watches that file and rebroadcasts
// every change over SSE. The file is the single source of truth — each SSE frame
// carries the whole state, so a browser reconnect is self-healing.

import { watch } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const AGENT_IDS = [
  "analyst",
  "scout",
  "ideator",
  "writer",
  "illustrator",
  "critic",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export type AgentStatus = "idle" | "working" | "done" | "blocked";

export type AgentRuntime = {
  status: AgentStatus;
  startedAt: string | null;
  finishedAt: string | null;
  response: string;
};

export type OfficeState = {
  version: 1;
  runId: string;
  updatedAt: string;
  agents: Record<AgentId, AgentRuntime>;
};

const OFFICE_DIR = resolve(process.cwd(), ".office");
const STATE_FILE = resolve(OFFICE_DIR, "state.json");

const idleAgent = (): AgentRuntime => ({
  status: "idle",
  startedAt: null,
  finishedAt: null,
  response: "",
});

function freshState(runId = newRunId()): OfficeState {
  return {
    version: 1,
    runId,
    updatedAt: new Date().toISOString(),
    agents: Object.fromEntries(
      AGENT_IDS.map((id) => [id, idleAgent()]),
    ) as Record<AgentId, AgentRuntime>,
  };
}

function newRunId(): string {
  return `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isAgentId(value: unknown): value is AgentId {
  return (
    typeof value === "string" &&
    (AGENT_IDS as readonly string[]).includes(value)
  );
}

// ---- read / write (side effects isolated here) --------------------------

export async function readOfficeState(): Promise<OfficeState> {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    return normalize(JSON.parse(raw));
  } catch {
    return freshState();
  }
}

// Atomic write: a partial reader should never observe a half-written file, and
// fs.watch fires reliably on the rename.
async function writeOfficeState(state: OfficeState): Promise<void> {
  await mkdir(OFFICE_DIR, { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await rename(tmp, STATE_FILE);
}

// Coerce arbitrary JSON back into a known-good state (older/partial files).
function normalize(value: unknown): OfficeState {
  const base = freshState();
  if (!value || typeof value !== "object") return base;
  const v = value as Partial<OfficeState>;
  const agents = base.agents;
  if (v.agents && typeof v.agents === "object") {
    for (const id of AGENT_IDS) {
      const a = (v.agents as Record<string, unknown>)[id];
      if (a && typeof a === "object") {
        const r = a as Partial<AgentRuntime>;
        agents[id] = {
          status: isStatus(r.status) ? r.status : "idle",
          startedAt: typeof r.startedAt === "string" ? r.startedAt : null,
          finishedAt: typeof r.finishedAt === "string" ? r.finishedAt : null,
          response: typeof r.response === "string" ? r.response : "",
        };
      }
    }
  }
  return {
    version: 1,
    runId: typeof v.runId === "string" ? v.runId : base.runId,
    updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : base.updatedAt,
    agents,
  };
}

function isStatus(value: unknown): value is AgentStatus {
  return (
    value === "idle" ||
    value === "working" ||
    value === "done" ||
    value === "blocked"
  );
}

// ---- emit API (used by the CLI) -----------------------------------------

async function patchAgent(
  id: AgentId,
  fields: Partial<AgentRuntime>,
): Promise<OfficeState> {
  const state = await readOfficeState();
  const next: OfficeState = {
    ...state,
    updatedAt: new Date().toISOString(),
    agents: { ...state.agents, [id]: { ...state.agents[id], ...fields } },
  };
  await writeOfficeState(next);
  return next;
}

export function emitStageStart(id: AgentId): Promise<OfficeState> {
  return patchAgent(id, {
    status: "working",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    response: "",
  });
}

export function emitStageEnd(id: AgentId, response = ""): Promise<OfficeState> {
  return patchAgent(id, {
    status: "done",
    finishedAt: new Date().toISOString(),
    response,
  });
}

export function emitStageBlocked(id: AgentId): Promise<OfficeState> {
  return patchAgent(id, { status: "blocked" });
}

export async function resetOffice(): Promise<OfficeState> {
  const state = freshState();
  await writeOfficeState(state);
  return state;
}

// ---- watch / subscribe (server side) ------------------------------------

type Listener = (state: OfficeState) => void;

const listeners = new Set<Listener>();
let watching = false;

export function subscribeOfficeState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Watch the directory (not the file) so an atomic rename that replaces the
// inode is still observed. Debounced because a rename can emit twice.
export async function watchOfficeState(): Promise<void> {
  if (watching) return;
  watching = true;
  await mkdir(OFFICE_DIR, { recursive: true });

  let timer: ReturnType<typeof setTimeout> | null = null;
  const onChange = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const state = await readOfficeState();
      for (const listener of listeners) listener(state);
    }, 30);
  };

  watch(OFFICE_DIR, (_event, filename) => {
    if (!filename || filename === "state.json") onChange();
  });
}
