import { USER_AGENT } from "../config";
import type { BriefingEntry } from "../types";

const BASE = "https://hacker-news.firebaseio.com/v0";
const HEADERS = { "User-Agent": USER_AGENT };

interface HNItem {
  id: number;
  type: string;
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  by?: string;
  time?: number;
  descendants?: number;
}

async function fetchItem(id: number): Promise<HNItem | null> {
  const r = await fetch(`${BASE}/item/${id}.json`, { headers: HEADERS });
  return r.ok ? ((await r.json()) as HNItem) : null;
}

async function fetchInBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const results = await Promise.allSettled(batch.map(fn));
    for (const r of results) if (r.status === "fulfilled") out.push(r.value);
  }
  return out;
}

function toEntry(item: HNItem): BriefingEntry {
  const permalink = `https://news.ycombinator.com/item?id=${item.id}`;
  return {
    source: "hackernews",
    title: item.title ?? "",
    url: item.url ?? permalink,
    score: item.score ?? 0,
    commentCount: item.descendants ?? 0,
    author: item.by,
    publishedAt: new Date((item.time ?? 0) * 1000).toISOString(),
    body: item.text,
    extra: { hnId: item.id, permalink },
  };
}

export async function fetchHackerNews(limit: number): Promise<BriefingEntry[]> {
  const r = await fetch(`${BASE}/topstories.json`, { headers: HEADERS });
  if (!r.ok) throw new Error(`HN topstories: ${r.status}`);
  const ids = ((await r.json()) as number[]).slice(0, limit * 2);
  const items = await fetchInBatches(ids, 10, fetchItem);
  return items
    .filter((it): it is HNItem => it !== null && it.type === "story")
    .slice(0, limit)
    .map(toEntry);
}
