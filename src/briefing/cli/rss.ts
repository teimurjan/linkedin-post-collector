import type { FeedTag } from "../config";
import { fetchRss } from "../sources/rss";

function argValue(name: string): string | undefined {
  const i = Bun.argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = Bun.argv[i + 1];
  return v && !v.startsWith("--") ? v : undefined;
}

const limit = Number(argValue("limit") ?? 5);
const tagRaw = argValue("tag");
const tag: FeedTag | undefined =
  tagRaw === "ai" || tagRaw === "swe" ? tagRaw : undefined;
const sinceDaysRaw = argValue("since-days");
const sinceDays = sinceDaysRaw ? Number(sinceDaysRaw) : undefined;

const items = await fetchRss(limit, tag, sinceDays);
process.stdout.write(JSON.stringify(items, null, 2));
