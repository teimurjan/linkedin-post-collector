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

const [hn, lob, rss] = await Promise.all([
  fetchHackerNews(limit).catch((e: Error) => {
    console.error(`[hn] ${e.message}`);
    return [] as BriefingEntry[];
  }),
  fetchLobsters(limit).catch((e: Error) => {
    console.error(`[lobsters] ${e.message}`);
    return [] as BriefingEntry[];
  }),
  fetchRss(Math.max(3, Math.floor(limit / 5))).catch((e: Error) => {
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

function fmt(e: BriefingEntry): string {
  const meta: string[] = [];
  if (e.score != null) meta.push(`★${e.score}`);
  if (e.commentCount != null) meta.push(`${e.commentCount} comments`);
  if (e.author) meta.push(e.author);
  meta.push(e.publishedAt.slice(0, 10));
  return `- [${e.title}](${e.url}) — ${meta.join(" · ")}`;
}

const today = new Date().toISOString().slice(0, 10);
const md = [
  `# Topics briefing — ${today}`,
  "",
  `## Hacker News (${hn.length})`,
  ...hn.map(fmt),
  "",
  `## Lobsters (${lob.length})`,
  ...lob.map(fmt),
  "",
  `## Newsletters & blogs (${rss.length})`,
  ...rss.map(fmt),
  "",
].join("\n");

if (outPath) {
  await writeFile(outPath, md);
  console.error(
    `Wrote ${outPath} (${hn.length + lob.length + rss.length} items)`,
  );
} else {
  process.stdout.write(md);
}
