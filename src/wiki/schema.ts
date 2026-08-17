import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import matter from "gray-matter";
import { walkMarkdown } from "../shared/fs.ts";

export const WIKI_DIR = resolve(process.cwd(), "wiki");
export const POSTS_DIR = resolve(process.cwd(), "posts");

export const PAGE_KINDS = [
  "index",
  "audience",
  "play",
  "hook",
  "family",
  "imagery",
  "voice",
] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low", "anecdote"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

// A claim may not be more confident than its evidence count supports. These
// floors are what stop a single post from becoming a rule.
export const CONFIDENCE_FLOORS: Record<Confidence, number> = {
  high: 8,
  medium: 4,
  low: 2,
  anecdote: 1,
};

// `kind` must agree with where the page sits, so a play cannot masquerade as an
// audience model. Kinds absent here may live anywhere under wiki/.
export const KIND_DIRECTORIES: Partial<Record<PageKind, string>> = {
  play: "plays",
  hook: "hooks",
  family: "families",
};

export type WikiPage = {
  /** Absolute path on disk. */
  file: string;
  /** Path relative to the repo root, e.g. `wiki/audience.md`. */
  repoPath: string;
  /** Path relative to wiki/ without the extension, e.g. `plays/foo`. */
  slug: string;
  frontmatter: Record<string, unknown>;
  body: string;
  /** Post paths this page cites as supporting evidence. */
  evidencePosts: string[];
  /** Post paths this page cites as counter-evidence. */
  counterPosts: string[];
  /** Every `posts/...` path mentioned anywhere in the frontmatter. */
  citedPosts: string[];
};

export async function loadWikiPages(): Promise<WikiPage[]> {
  const files = await walkMarkdown(WIKI_DIR);
  const pages: WikiPage[] = [];
  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const { data, content } = matter(raw);
    const frontmatter = normalizeDates(
      (data ?? {}) as Record<string, unknown>,
    ) as Record<string, unknown>;
    pages.push({
      file,
      repoPath: relative(process.cwd(), file),
      slug: relative(WIKI_DIR, file).replace(/\.md$/, ""),
      frontmatter,
      body: content,
      evidencePosts: collectPostPaths(frontmatter.evidence_posts),
      counterPosts: collectPostPaths(frontmatter.counter_posts),
      citedPosts: collectPostPaths(frontmatter),
    });
  }
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * YAML turns an unquoted `2026-08-17` into a Date, which then stringifies with
 * a timezone and no longer matches the date the author wrote. Flatten every
 * Date back to its ISO day so comparisons stay textual.
 */
function normalizeDates(value: unknown): unknown {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? value
      : value.toISOString().slice(0, 10);
  }
  if (Array.isArray(value)) return value.map(normalizeDates);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeDates(item),
      ]),
    );
  }
  return value;
}

/**
 * Pull every `posts/...md` path out of an arbitrary frontmatter subtree.
 * Evidence is cited as explicit post paths rather than a family query, and
 * those citations show up in several shapes (a bare string, a list of strings,
 * a list of `{post, impressions}` objects, nested tier exemplars), so the walk
 * is structural rather than keyed on one field name.
 */
export function collectPostPaths(value: unknown): string[] {
  const found: string[] = [];
  const visit = (node: unknown): void => {
    if (typeof node === "string") {
      if (/^posts\/.*\.md$/.test(node.trim())) found.push(node.trim());
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (node && typeof node === "object") {
      for (const item of Object.values(node)) visit(item);
    }
  };
  visit(value);
  return [...new Set(found)];
}

export function isPageKind(value: unknown): value is PageKind {
  return (
    typeof value === "string" &&
    (PAGE_KINDS as readonly string[]).includes(value)
  );
}

export function isConfidence(value: unknown): value is Confidence {
  return (
    typeof value === "string" &&
    (CONFIDENCE_LEVELS as readonly string[]).includes(value)
  );
}
