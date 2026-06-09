// Best-effort dashboard bootstrap for the pipeline skills. Makes sure the office
// server is up and a browser is showing it: a cmux right-split when the owner is
// inside cmux, otherwise the system browser plus a nudge to use cmux. Never
// throws — the dashboard is a convenience, not a dependency of the real work.
//
// "Server up" is NOT "tab visible": the server is spawned detached, so it
// outlives the tab you close and the session that started it. So we don't gate
// on the server being up — we gate on whether a tab is actually showing the
// dashboard. In cmux we can ask that precisely AND scope it to the current
// workspace: a dashboard parked in another workspace must not stop us opening
// one where the owner is working. Outside cmux there's no way to enumerate OS
// browser tabs, so we fall back to the global SSE viewer count. Two locks keep
// concurrent hooks honest: a start lock so we spawn the server at most once, and
// a reveal lock (with a short TTL covering the gap before a fresh tab attaches)
// so we open at most one tab per run.

import { mkdir, open } from "node:fs/promises";
import { resolve } from "node:path";

const SERVER_ENTRY = resolve(import.meta.dir, "../cli.ts");
const LOCK_FILE = resolve(process.cwd(), ".office", "start.lock");
const REVEAL_LOCK_FILE = resolve(process.cwd(), ".office", "reveal.lock");
// A revealed tab needs a moment to attach its SSE stream; until then its viewer
// count reads 0. Hold the reveal lock this long so a quick follow-up call (next
// prompt, the other agent's hook) doesn't open a second tab into that gap.
const REVEAL_GRACE_MS = 8_000;

async function serverUp(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/api/overview`, {
      signal: AbortSignal.timeout(500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// How many browsers currently hold the dashboard open. A failed fetch (server
// down or mid-start) reads as 0 viewers, which correctly routes us to reveal.
async function viewerCount(port: number): Promise<number> {
  try {
    const res = await fetch(`http://localhost:${port}/api/viewers`, {
      signal: AbortSignal.timeout(500),
    });
    if (!res.ok) return 0;
    const body = (await res.json()) as { count?: unknown };
    return typeof body.count === "number" ? body.count : 0;
  } catch {
    return 0;
  }
}

// Atomically claim the right to spawn. `wx` fails if the file already exists, so
// only one starter wins even when Claude's and Codex's hooks fire at the same
// instant — the loser falls through to waiting on the winner's server. Stale
// locks (crashed starter) are reclaimed after a short grace period.
async function acquireStartLock(): Promise<boolean> {
  try {
    const handle = await open(LOCK_FILE, "wx");
    await handle.close();
    return true;
  } catch {
    const age = await Bun.file(LOCK_FILE)
      .stat()
      .then((s) => Date.now() - s.mtimeMs)
      .catch(() => 0);
    if (age > 10_000) {
      await Bun.file(LOCK_FILE)
        .unlink()
        .catch(() => {});
      return acquireStartLock();
    }
    return false;
  }
}

const releaseStartLock = (): Promise<void> =>
  Bun.file(LOCK_FILE)
    .unlink()
    .catch(() => {});

// Claim the right to open a tab. Unlike the start lock this is never released —
// it's left to expire after REVEAL_GRACE_MS, so any caller within that window
// (the other agent's hook, a rapid next prompt) loses and skips, giving the
// just-opened tab time to attach its SSE before we'd consider opening another.
async function acquireRevealLock(): Promise<boolean> {
  try {
    const handle = await open(REVEAL_LOCK_FILE, "wx");
    await handle.close();
    return true;
  } catch {
    const age = await Bun.file(REVEAL_LOCK_FILE)
      .stat()
      .then((s) => Date.now() - s.mtimeMs)
      .catch(() => Number.POSITIVE_INFINITY);
    if (age > REVEAL_GRACE_MS) {
      await Bun.file(REVEAL_LOCK_FILE)
        .unlink()
        .catch(() => {});
      return acquireRevealLock();
    }
    return false;
  }
}

// Detached so the dashboard outlives this short-lived `office open` process.
// Guarded by a lock so two concurrent `office open` calls never double-spawn:
// the loser just waits for the winner's server to answer. Returns true only for
// the call that actually spawned the server, so exactly one caller — and only on
// a genuine cold start — goes on to open a browser tab.
async function startServer(port: number): Promise<boolean> {
  await mkdir(resolve(process.cwd(), ".office"), { recursive: true });
  const won = await acquireStartLock();
  if (!won) {
    for (let i = 0; i < 60; i++) {
      if (await serverUp(port)) return false;
      await Bun.sleep(50);
    }
    return false;
  }
  try {
    // The winner of the lock may still find the port already served (a prior
    // run we couldn't reach in time): if so, it didn't start anything either.
    if (await serverUp(port)) return false;
    const proc = Bun.spawn(
      ["bun", SERVER_ENTRY, "serve", "--port", String(port)],
      {
        stdin: "ignore",
        stdout: "ignore",
        stderr: "ignore",
      },
    );
    proc.unref();
    for (let i = 0; i < 40; i++) {
      if (await serverUp(port)) return true;
      await Bun.sleep(50);
    }
    return false;
  } finally {
    await releaseStartLock();
  }
}

// A reachable cmux socket means the app is running and can host a browser split.
// `cmux` on PATH is the real binary; the worktree shell-function only shadows it
// in interactive zsh, never in a spawned subprocess.
async function cmuxRunning(): Promise<boolean> {
  if (!Bun.which("cmux")) return false;
  try {
    const proc = Bun.spawn(["cmux", "ping"], {
      stdout: "ignore",
      stderr: "ignore",
    });
    return (await proc.exited) === 0;
  } catch {
    return false;
  }
}

async function openInCmux(url: string): Promise<boolean> {
  try {
    const proc = Bun.spawn(
      ["cmux", "browser", "open-split", url, "--focus", "false"],
      { stdout: "ignore", stderr: "ignore" },
    );
    return (await proc.exited) === 0;
  } catch {
    return false;
  }
}

function openInBrowser(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  try {
    Bun.spawn(cmd, { stdout: "ignore", stderr: "ignore" }).unref();
  } catch {
    // No opener available — the printed URL is still actionable.
  }
}

// Depth-first scan of cmux's surface tree for a browser surface already showing
// the dashboard. The tree nests window→workspace→pane→surface; we don't care
// about the shape, only the leaf fields (`type`, `url`, `pane_ref`). Returns the
// pane to focus, or null.
function findOfficeSurface(
  node: unknown,
  origin: string,
): { pane: string } | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findOfficeSurface(child, origin);
      if (hit) return hit;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  const surface = node as Record<string, unknown>;
  if (
    surface.type === "browser" &&
    typeof surface.url === "string" &&
    surface.url.startsWith(origin) &&
    typeof surface.pane_ref === "string"
  ) {
    return { pane: surface.pane_ref };
  }
  for (const value of Object.values(surface)) {
    const hit = findOfficeSurface(value, origin);
    if (hit) return hit;
  }
  return null;
}

// Is the dashboard already open in the CURRENT cmux workspace? `tree --json`
// scoped to $CMUX_WORKSPACE_ID lists every surface with its type and url, so we
// can answer precisely — unlike the global viewer count, which can't tell "open
// here" from "open one workspace over". Returns the pane to focus, or null
// (including when we can't determine the workspace, so callers just open one).
// Best-effort: any missing env / cmux / parse failure reads as "not here".
async function officeSurfaceHere(
  port: number,
): Promise<{ pane: string } | null> {
  const workspace = process.env.CMUX_WORKSPACE_ID;
  if (!workspace) return null;
  try {
    const proc = Bun.spawn(
      ["cmux", "tree", "--workspace", workspace, "--json"],
      { stdout: "pipe", stderr: "ignore" },
    );
    const out = await new Response(proc.stdout).text();
    if ((await proc.exited) !== 0) return null;
    return findOfficeSurface(JSON.parse(out), `http://localhost:${port}`);
  } catch {
    return null;
  }
}

// In cmux we ask the precise, workspace-scoped question: is a browser surface in
// THIS workspace already on the dashboard? If so we're done — don't duplicate,
// and don't steal focus (the hook fires on every prompt; focusing each time
// would yank the owner off their terminal). Otherwise open a split here, even
// when a viewer exists in some other workspace.
async function revealInCmux(url: string, port: number): Promise<boolean> {
  if (await officeSurfaceHere(port)) {
    process.stdout.write(`office already here → ${url}\n`);
    return true;
  }
  if (!(await acquireRevealLock())) {
    process.stdout.write(`office already up → ${url}\n`);
    return true;
  }
  if (await openInCmux(url)) {
    process.stdout.write(`office → ${url} (cmux right split)\n`);
    return true;
  }
  return false; // cmux open failed unexpectedly — let the caller fall back
}

// Open a system browser tab, guarded by the reveal lock so concurrent or
// rapid-fire callers never stack duplicates.
function revealInBrowser(url: string, fromCmuxFallback: boolean): void {
  openInBrowser(url);
  const tip = fromCmuxFallback
    ? ""
    : "\ntip: open this repo in cmux to get the dashboard as a live right-pane split.";
  process.stdout.write(`office → ${url} (system browser)${tip}\n`);
}

export async function openOffice({
  port = 4317,
}: { port?: number } = {}): Promise<void> {
  const url = `http://localhost:${port}`;

  // Ensure the server is up (best-effort; startServer is lock-guarded so we
  // spawn at most one even under concurrent hooks).
  if (!(await serverUp(port))) await startServer(port);

  // cmux path: scope the "already showing?" check to the current workspace.
  if (await cmuxRunning()) {
    if (await revealInCmux(url, port)) return;
    // cmux running but the split failed — fall back to a system browser tab.
    if (await acquireRevealLock()) revealInBrowser(url, true);
    return;
  }

  // Plain-browser path: no way to enumerate OS tabs, so gate on the global
  // viewer count to avoid stacking duplicates. A tab already watching → leave
  // it alone (the common post-cycle case: one dashboard across every stage).
  if ((await viewerCount(port)) > 0) {
    process.stdout.write(`office already up → ${url}\n`);
    return;
  }
  if (!(await acquireRevealLock())) {
    process.stdout.write(`office already up → ${url}\n`);
    return;
  }
  revealInBrowser(url, false);
}
