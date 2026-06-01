import { writeFile } from "node:fs/promises";
import { fetchHackerNews } from "../sources/hackernews";
import { fetchLobsters } from "../sources/lobsters";
import { fetchRss } from "../sources/rss";
import type { BriefingEntry } from "../types";

function argValue(name: string): string | undefined {
  const i = Bun.argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = Bun.argv[i + 1];
  return v && !v.startsWith("--") ? v : "true";
}

function hasFlag(name: string): boolean {
  return Bun.argv.includes(`--${name}`);
}

const limit = Number(argValue("limit") ?? 20);
const out = argValue("out");
const outPath = out === "true" ? undefined : out;
const asJson = hasFlag("json");

const RSS_PER_FEED = 5;
const MAX_AGE_DAYS = 7;

const [hn, lob, rss] = await Promise.all([
  fetchHackerNews(limit).catch((e: Error) => {
    console.error(`[hn] ${e.message}`);
    return [] as BriefingEntry[];
  }),
  fetchLobsters(limit).catch((e: Error) => {
    console.error(`[lobsters] ${e.message}`);
    return [] as BriefingEntry[];
  }),
  fetchRss(RSS_PER_FEED, undefined, MAX_AGE_DAYS).catch((e: Error) => {
    console.error(`[rss] ${e.message}`);
    return [] as BriefingEntry[];
  }),
]);

if (asJson) {
  const json = JSON.stringify([...hn, ...lob, ...rss], null, 2);
  if (outPath) await writeFile(outPath, json);
  else process.stdout.write(json);
  process.exit(0);
}

const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

type Bucket = "today" | "last3" | "earlier";

function bucketOf(iso: string): Bucket | null {
  const ageMs = now - new Date(iso).getTime();
  if (ageMs < 0) return "today";
  if (ageMs <= 1 * DAY_MS) return "today";
  if (ageMs <= 3 * DAY_MS) return "last3";
  if (ageMs <= 7 * DAY_MS) return "earlier";
  return null;
}

function fmt(e: BriefingEntry): string {
  const meta: string[] = [];
  if (e.score != null) meta.push(`★${e.score}`);
  if (e.commentCount != null) meta.push(`${e.commentCount} comments`);
  if (e.author) meta.push(e.author);
  meta.push(e.publishedAt.slice(0, 10));
  return `- [${e.title}](${e.url}) — ${meta.join(" · ")}`;
}

const BUCKET_LABELS: Record<Bucket, string> = {
  today: "Today",
  last3: "Last 3 days",
  earlier: "Earlier this week",
};

function renderSection(title: string, entries: BriefingEntry[]): string[] {
  const buckets: Record<Bucket, BriefingEntry[]> = {
    today: [],
    last3: [],
    earlier: [],
  };
  let kept = 0;
  for (const e of entries) {
    const b = bucketOf(e.publishedAt);
    if (!b) continue;
    buckets[b].push(e);
    kept++;
  }
  for (const b of Object.keys(buckets) as Bucket[]) {
    buckets[b].sort(
      (a, z) =>
        new Date(z.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }
  const lines: string[] = [`## ${title} (${kept})`];
  for (const b of ["today", "last3", "earlier"] as Bucket[]) {
    const items = buckets[b];
    if (items.length === 0) continue;
    lines.push(
      "",
      `### ${BUCKET_LABELS[b]} (${items.length})`,
      ...items.map(fmt),
    );
  }
  lines.push("");
  return lines;
}

const today = new Date().toISOString().slice(0, 10);
const md = [
  `# Topics briefing — ${today}`,
  "",
  ...renderSection("Hacker News", hn),
  ...renderSection("Lobsters", lob),
  ...renderSection("Newsletters & blogs", rss),
].join("\n");

if (outPath) {
  await writeFile(outPath, md);
  console.error(
    `Wrote ${outPath} (${hn.length + lob.length + rss.length} items fetched, filtered to last ${MAX_AGE_DAYS}d)`,
  );
} else {
  process.stdout.write(md);
}
