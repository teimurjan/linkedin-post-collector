import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import matter from "gray-matter";
import type { Post } from "./types.ts";

const DRAFTS_DIR = resolve(process.cwd(), "drafts");
const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})-/;
const MATCH_THRESHOLD = 0.5;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A draft that already has concept art. `date` is the `YYYY-MM-DD` filename
 * prefix; `body` is the draft text with frontmatter stripped, used to match a
 * scraped post back to the concept that illustrated it.
 */
export type DraftConcept = {
  date: string;
  body: string;
  conceptPath: string;
};

let cache: Promise<DraftConcept[]> | undefined;

/**
 * Drafts under `drafts/` that carry a `concept_path`, memoized for the run so
 * the parallel scrape workers share one disk read. Returns `[]` if `drafts/`
 * is absent (it is gitignored, so a fresh clone simply links nothing).
 */
export async function loadDraftConcepts(): Promise<DraftConcept[]> {
  if (!cache) cache = readDraftConcepts();
  return cache;
}

async function readDraftConcepts(): Promise<DraftConcept[]> {
  const entries = await readdir(DRAFTS_DIR, { withFileTypes: true }).catch(
    () => [],
  );
  const out: DraftConcept[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const date = DATE_PREFIX.exec(entry.name)?.[1];
    if (!date) continue;
    try {
      const parsed = matter(
        await readFile(join(DRAFTS_DIR, entry.name), "utf8"),
      );
      const conceptPath = parsed.data.concept_path;
      if (typeof conceptPath !== "string" || !conceptPath) continue;
      out.push({ date, body: parsed.content, conceptPath });
    } catch {
      // ignore malformed drafts — they just won't link
    }
  }
  return out;
}

/**
 * The `concept_path` of the draft that best matches this post, or `undefined`.
 * Candidates are drafts within ±1 day of the post's publish date (tolerating
 * draft-vs-publish drift); the closest body by word overlap wins, provided it
 * clears the similarity threshold.
 */
export function matchConceptPath(
  post: Post,
  drafts: DraftConcept[],
): string | undefined {
  const postDay = utcMidnight(post.postedAt);
  let best: { conceptPath: string; score: number } | undefined;
  for (const draft of drafts) {
    const draftDay = Date.parse(`${draft.date}T00:00:00.000Z`);
    if (Math.abs(draftDay - postDay) > DAY_MS) continue;
    const score = textSimilarity(post.content, draft.body);
    if (score < MATCH_THRESHOLD) continue;
    if (!best || score > best.score)
      best = { conceptPath: draft.conceptPath, score };
  }
  return best?.conceptPath;
}

/** Jaccard overlap of the two texts' word sets, normalized for case/punctuation. */
export function textSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Write the matched post back into the concept's `prompt.md` so the link is
 * bidirectional. Idempotent; swallows a missing/unwritable concept file.
 */
export async function backlinkConcept(
  conceptPath: string,
  post: Post,
  postPath: string,
): Promise<void> {
  const abs = resolve(process.cwd(), conceptPath);
  const parsed = matter(await readFile(abs, "utf8"));
  const relPostPath = relative(process.cwd(), postPath);
  if (
    parsed.data.post_url === post.url &&
    parsed.data.post_path === relPostPath
  ) {
    return;
  }
  parsed.data.post_url = post.url;
  parsed.data.post_path = relPostPath;
  await writeFile(abs, matter.stringify(parsed.content, parsed.data));
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

function utcMidnight(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
