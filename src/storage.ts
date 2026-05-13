import matter from "gray-matter";
import { mkdir, readFile, readdir, unlink, writeFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { slugify, urnToDate } from "./parse.ts";
import { URLS } from "./selectors.ts";
import type { Post } from "./types.ts";

const POSTS_DIR = resolve(process.cwd(), "posts");

type Frontmatter = {
  urn: string;
  url: string;
  posted_at: string;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  scraped_at: string;
};

type ErrorFrontmatter = {
  urn: string;
  url: string;
  posted_at: string;
  error: string;
  scraped_at: string;
};

/**
 * URNs that have a successful saved file. Error stubs (files with `error:`
 * in frontmatter) are deliberately excluded so they get retried next run.
 */
export async function loadKnownUrns(): Promise<Set<string>> {
  const known = new Set<string>();
  const files = await walkMarkdown(POSTS_DIR);
  for (const file of files) {
    try {
      const raw = await readFile(file, "utf8");
      const fm = matter(raw).data as Partial<Frontmatter & ErrorFrontmatter>;
      if (fm.urn && !fm.error) known.add(fm.urn);
    } catch {
      // ignore malformed files — they just won't dedupe
    }
  }
  return known;
}

/**
 * URNs of previously-failed posts that should be retried. These are stored as
 * error stubs (frontmatter has `error:`); Pass 2 picks them up so the
 * stop-on-first-known feed walk doesn't strand them.
 */
export async function loadFailedUrns(): Promise<string[]> {
  const out: string[] = [];
  const files = await walkMarkdown(POSTS_DIR);
  for (const file of files) {
    try {
      const raw = await readFile(file, "utf8");
      const fm = matter(raw).data as Partial<Frontmatter & ErrorFrontmatter>;
      if (fm.urn && fm.error) out.push(fm.urn);
    } catch {
      // ignore malformed files
    }
  }
  return out;
}

export async function savePost(post: Post): Promise<string> {
  const date = post.postedAt;
  const year = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const slug = slugify(post.content || post.urn);

  const dir = join(POSTS_DIR, year);
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${mm}-${dd}-${slug}.md`);

  const frontmatter: Frontmatter = {
    urn: post.urn,
    url: post.url,
    posted_at: post.postedAt.toISOString(),
    impressions: post.analytics.impressions,
    likes: post.analytics.likes,
    comments: post.analytics.comments,
    shares: post.analytics.shares,
    scraped_at: new Date().toISOString(),
  };

  const body = renderBody(post);
  await writeFile(path, matter.stringify(body, frontmatter));
  await removeErrorStub(post.urn).catch(() => {});
  return path;
}

/**
 * Writes a placeholder file recording that a URN was attempted but failed.
 * Excluded from `loadKnownUrns`, so the next run retries it.
 */
export async function saveErrorStub(urn: string, error: string): Promise<string> {
  const date = safeUrnToDate(urn);
  const year = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  const dir = join(POSTS_DIR, year);
  await mkdir(dir, { recursive: true });
  const path = join(dir, errorFilename(urn, mm, dd));

  const frontmatter: ErrorFrontmatter = {
    urn,
    url: URLS.post(urn),
    posted_at: date.toISOString(),
    error: error.replace(/\s+/g, " ").trim().slice(0, 300),
    scraped_at: new Date().toISOString(),
  };

  await writeFile(path, matter.stringify("", frontmatter));
  return path;
}

async function removeErrorStub(urn: string): Promise<void> {
  const date = safeUrnToDate(urn);
  const year = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const path = join(POSTS_DIR, year, errorFilename(urn, mm, dd));
  await unlink(path).catch(() => {});
}

function errorFilename(urn: string, mm: string, dd: string): string {
  const shortId = urn.split(":").pop() ?? "unknown";
  return `${mm}-${dd}-failed-${shortId}.md`;
}

function safeUrnToDate(urn: string): Date {
  try {
    return urnToDate(urn);
  } catch {
    return new Date();
  }
}

function renderBody(post: Post): string {
  const parts: string[] = [post.content.trim()];
  if (post.comments.length > 0) {
    parts.push("\n---\n\n## Comments\n");
    for (const c of post.comments) {
      const prefix = c.isReply ? "↳ " : "";
      const quote = c.isReply ? ">> " : "> ";
      const indented = c.content
        .split("\n")
        .map((line) => `${quote}${line}`)
        .join("\n");
      parts.push(`${prefix}**${c.author}**\n\n${indented}\n`);
    }
  }
  return parts.join("\n") + "\n";
}

async function walkMarkdown(root: string): Promise<string[]> {
  const out: string[] = [];
  const exists = await stat(root).then(() => true).catch(() => false);
  if (!exists) return out;

  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}
