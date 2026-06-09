// Counts how many Post Office dashboards are open in cmux, split by whether
// their window is visible on screen. The SSE viewer count can't tell "the owner
// is looking at it" from "it's alive in a hidden/minimized window" — cmux can,
// because each window in `tree --json` carries a `visible` flag. Best-effort: if
// cmux is absent or the query fails, returns null and the UI omits the chip.

export type Presence = { visible: number; hidden: number };

// `cmux tree --all --json` spawns a process; multiple open tabs poll this, so
// coalesce calls within a short window to keep it cheap.
const TTL_MS = 2_000;
let cache: { at: number; value: Presence | null } | null = null;

export async function dashboardPresence(
  port: number,
): Promise<Presence | null> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.value;
  const value = await query(port);
  cache = { at: now, value };
  return value;
}

async function query(port: number): Promise<Presence | null> {
  if (!Bun.which("cmux")) return null;
  try {
    const proc = Bun.spawn(["cmux", "tree", "--all", "--json"], {
      stdout: "pipe",
      stderr: "ignore",
    });
    const out = await new Response(proc.stdout).text();
    if ((await proc.exited) !== 0) return null;
    return count(JSON.parse(out), `http://localhost:${port}`);
  } catch {
    return null;
  }
}

// Walk the surface tree, carrying the nearest enclosing window's visibility down
// to each leaf. An office browser surface counts as hidden only when its window
// is provably not visible; unknown visibility counts as visible (it's at least
// not hidden). cmux nests window→workspace→pane→surface, so we recurse blindly
// over object values and key off the leaf fields (`type`, `url`).
function count(tree: unknown, origin: string): Presence {
  const presence: Presence = { visible: 0, hidden: 0 };
  const walk = (node: unknown, windowVisible: boolean | null): void => {
    if (Array.isArray(node)) {
      for (const child of node) walk(child, windowVisible);
      return;
    }
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    const ref = obj.ref;
    const vis =
      typeof ref === "string" &&
      ref.startsWith("window:") &&
      typeof obj.visible === "boolean"
        ? obj.visible
        : windowVisible;
    if (
      obj.type === "browser" &&
      typeof obj.url === "string" &&
      obj.url.startsWith(origin)
    ) {
      if (vis === false) presence.hidden++;
      else presence.visible++;
    }
    for (const value of Object.values(obj)) walk(value, vis);
  };
  walk(tree, null);
  return presence;
}
