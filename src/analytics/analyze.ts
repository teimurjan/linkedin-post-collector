import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import matter from "gray-matter";
import { walkMarkdown } from "../shared/fs.ts";

const POSTS_DIR = resolve(process.cwd(), "posts");

export type PostRecord = {
  urn: string;
  url: string;
  postedAt: Date;
  scrapedAt: Date | null;
  // Impressions are frozen at first scrape and never refreshed, so a post
  // scraped at 72h and one scraped at 6 months are not comparable numbers.
  // Carrying the gap lets the report group by cohort instead of pooling them.
  scrapeAgeHours: number | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  body: string;
  file: string;
  firstLine: string;
  length: number;
};

export type CorpusStats = {
  total: number;
  withImpressions: number;
  medianImpressions: number;
  medianLength: number;
  topQuartileOpeningWords: number[];
};

export async function loadPosts(): Promise<PostRecord[]> {
  const files = await walkMarkdown(POSTS_DIR);
  const out: PostRecord[] = [];
  for (const file of files) {
    if (basename(file).includes("-failed-")) continue;
    const raw = await readFile(file, "utf8");
    const { data, content } = matter(raw);
    if (!data?.urn || (data as { error?: string }).error) continue;
    const body = stripCommentsSection(content).trim();
    const firstLine = body.split("\n").find((l) => l.trim().length > 0) ?? "";
    const postedAt = new Date(String(data.posted_at));
    const scrapedAt = dateOrNull(data.scraped_at);
    out.push({
      urn: String(data.urn),
      url: String(data.url ?? ""),
      postedAt,
      scrapedAt,
      scrapeAgeHours: scrapeAgeHours(postedAt, scrapedAt),
      impressions: numOrNull(data.impressions),
      likes: numOrNull(data.likes),
      comments: numOrNull(data.comments),
      shares: numOrNull(data.shares),
      body,
      file,
      firstLine: firstLine.trim(),
      length: body.length,
    });
  }
  return out;
}

export function topByImpressions(posts: PostRecord[], n = 10): PostRecord[] {
  return posts
    .filter((p) => typeof p.impressions === "number")
    .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
    .slice(0, n);
}

export function bottomByImpressions(posts: PostRecord[], n = 5): PostRecord[] {
  return posts
    .filter((p) => typeof p.impressions === "number")
    .sort((a, b) => (a.impressions ?? 0) - (b.impressions ?? 0))
    .slice(0, n);
}

export function engagementScore(p: PostRecord): number {
  return (p.likes ?? 0) + 3 * (p.comments ?? 0) + 5 * (p.shares ?? 0);
}

export function topByEngagement(posts: PostRecord[], n = 10): PostRecord[] {
  return posts
    .filter((p) => typeof p.impressions === "number")
    .map((p) => ({ p, score: engagementScore(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ p }) => p);
}

export function corpusStats(posts: PostRecord[]): CorpusStats {
  const ranked = posts.filter((p) => typeof p.impressions === "number");
  const impressions = ranked
    .map((p) => p.impressions as number)
    .sort((a, b) => a - b);
  const lengths = posts.map((p) => p.length).sort((a, b) => a - b);
  const topQuartile = topByImpressions(
    ranked,
    Math.max(1, Math.ceil(ranked.length / 4)),
  );
  const openingWords = topQuartile.map(
    (p) => p.firstLine.split(/\s+/).filter(Boolean).length,
  );
  return {
    total: posts.length,
    withImpressions: ranked.length,
    medianImpressions: median(impressions),
    medianLength: median(lengths),
    topQuartileOpeningWords: openingWords,
  };
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function dateOrNull(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v !== "string") return null;
  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function scrapeAgeHours(postedAt: Date, scrapedAt: Date | null): number | null {
  if (!scrapedAt || Number.isNaN(postedAt.getTime())) return null;
  const hours = (scrapedAt.getTime() - postedAt.getTime()) / 3_600_000;
  return hours < 0 ? null : Math.round(hours);
}

function stripCommentsSection(body: string): string {
  const idx = body.indexOf("\n## Comments");
  return idx === -1 ? body : body.slice(0, idx);
}
