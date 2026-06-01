// Best-effort dashboard bootstrap for the pipeline skills. Makes sure the office
// server is up and a browser is showing it: a cmux right-split when the owner is
// inside cmux, otherwise the system browser plus a nudge to use cmux. Never
// throws — the dashboard is a convenience, not a dependency of the real work.
//
// Idempotent by design: if the server is already up we assume the dashboard is
// already visible and do nothing, so a multi-skill run (post-cycle) opens one
// dashboard, not one per stage.

import { mkdir, open } from "node:fs/promises";
import { resolve } from "node:path";

const SERVER_ENTRY = resolve(import.meta.dir, "../cli.ts");
const LOCK_FILE = resolve(process.cwd(), ".office", "start.lock");

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

export async function openOffice({
  port = 4317,
}: { port?: number } = {}): Promise<void> {
  const url = `http://localhost:${port}`;

  if (await serverUp(port)) {
    process.stdout.write(`office already up → ${url}\n`);
    return;
  }

  // Only the cold-start winner opens a tab; waiters and warm starts never do, so
  // concurrent hooks (Claude + Codex) never stack duplicate tabs or cmux splits.
  if (!(await startServer(port))) {
    process.stdout.write(`office already up → ${url}\n`);
    return;
  }

  if ((await cmuxRunning()) && (await openInCmux(url))) {
    process.stdout.write(`office → ${url} (cmux right split)\n`);
    return;
  }

  openInBrowser(url);
  process.stdout.write(
    `office → ${url} (system browser)\ntip: open this repo in cmux to get the dashboard as a live right-pane split.\n`,
  );
}
