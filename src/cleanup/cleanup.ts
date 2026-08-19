import { readdir } from "node:fs/promises";
import { join } from "node:path";

export type EntryKind = "file" | "dir";

/**
 * The directories the post cycle fills with dated, regenerable artifacts.
 * `briefings/`, `posts/`, `concepts/`, `retros/` and `wiki/` are durable and
 * never listed here.
 */
export const CLEANUP_DIRS: readonly { dir: string; kind: EntryKind }[] = [
  { dir: "ideas", kind: "file" },
  { dir: "drafts", kind: "file" },
  { dir: "images", kind: "dir" },
];

export type DatedEntry = {
  /** Repo-relative, e.g. `drafts/2026-08-19-some-slug.md`. */
  path: string;
  dir: string;
  name: string;
  date: string;
  kind: EntryKind;
};

export type KeepReason = "recent" | "retro_pending";

export type Kept = DatedEntry & { reason: KeepReason };

export type CleanupPlan = {
  cutoff: string;
  remove: DatedEntry[];
  keep: Kept[];
};

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;

/** The oldest date a run keeps: today plus the `days - 1` days before it. */
export function cutoffDate(today: Date, days: number): string {
  const utc = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  utc.setUTCDate(utc.getUTCDate() - (days - 1));
  return utc.toISOString().slice(0, 10);
}

/** Every dated artifact in the cycle directories. Undated names are ignored. */
export async function collectDatedEntries(root: string): Promise<DatedEntry[]> {
  const out: DatedEntry[] = [];
  for (const { dir, kind } of CLEANUP_DIRS) {
    const entries = await readdir(join(root, dir), {
      withFileTypes: true,
    }).catch(() => []);
    const dated: DatedEntry[] = [];
    for (const entry of entries) {
      if (kind === "dir" ? !entry.isDirectory() : !entry.isFile()) continue;
      if (kind === "file" && !entry.name.endsWith(".md")) continue;
      const date = DATE_PREFIX.exec(entry.name)?.[1];
      if (!date) continue;
      dated.push({
        path: `${dir}/${entry.name}`,
        dir,
        name: entry.name,
        date,
        kind,
      });
    }
    dated.sort((a, b) => a.name.localeCompare(b.name));
    out.push(...dated);
  }
  return out;
}

/**
 * Drafts of published posts that still have no retro. post-cycle's retro sweep
 * reads the draft, so pruning one by age would strand that post's 72h review.
 */
export async function findRetroPendingDrafts(
  root: string,
): Promise<Set<string>> {
  const [drafts, retros] = await Promise.all([
    readdir(join(root, "drafts")).catch(() => [] as string[]),
    readdir(join(root, "retros")).catch(() => [] as string[]),
  ]);
  const written = new Set(retros);
  const pending = new Set<string>();
  for (const name of drafts) {
    if (!name.endsWith(".md") || written.has(name)) continue;
    if (!DATE_PREFIX.test(name)) continue;
    if (await isPublished(root, name.slice(0, -3)))
      pending.add(`drafts/${name}`);
  }
  return pending;
}

/**
 * Archive slugs keep more of the post's first line than the draft slug does,
 * so a published post is matched by prefix, the way post-cycle matches it.
 */
async function isPublished(root: string, base: string): Promise<boolean> {
  const names = await readdir(join(root, "posts", base.slice(0, 4))).catch(
    () => [] as string[],
  );
  const prefix = base.slice(5);
  return names.some((name) => name.startsWith(prefix));
}

export function planCleanup(
  entries: readonly DatedEntry[],
  cutoff: string,
  retroPending: ReadonlySet<string>,
): CleanupPlan {
  const remove: DatedEntry[] = [];
  const keep: Kept[] = [];
  for (const entry of entries) {
    if (entry.date >= cutoff) keep.push({ ...entry, reason: "recent" });
    else if (retroPending.has(entry.path))
      keep.push({ ...entry, reason: "retro_pending" });
    else remove.push(entry);
  }
  return { cutoff, remove, keep };
}
