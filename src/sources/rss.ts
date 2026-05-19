import {
  type FeedTag,
  NEWSLETTERS,
  type NewsletterConfig,
  USER_AGENT,
} from "../config";
import type { BriefingEntry } from "../types";

interface FeedItem {
  title: string;
  link: string;
  content: string;
  pubDate: Date;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  const inner = m[1].trim();
  const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1].trim() : decodeEntities(inner);
}

function extractAtomLink(xml: string): string {
  const alt = xml.match(
    /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/,
  );
  if (alt) return alt[1];
  const any = xml.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/);
  return any ? any[1] : "";
}

function parseDate(s: string): Date {
  if (!s) return new Date();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function parseRssItems(xml: string): FeedItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, block]) => ({
      title: extractTag(block, "title"),
      link: extractTag(block, "link"),
      content:
        extractTag(block, "content:encoded") ||
        extractTag(block, "description"),
      pubDate: parseDate(extractTag(block, "pubDate")),
    }))
    .filter((i) => i.title || i.content);
}

function parseAtomEntries(xml: string): FeedItem[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map(([, block]) => ({
      title: extractTag(block, "title"),
      link: extractAtomLink(block),
      content: extractTag(block, "content") || extractTag(block, "summary"),
      pubDate: parseDate(
        extractTag(block, "updated") || extractTag(block, "published"),
      ),
    }))
    .filter((i) => i.title || i.content);
}

function parseFeed(xml: string): FeedItem[] {
  return xml.includes("<entry>") ? parseAtomEntries(xml) : parseRssItems(xml);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchOne(
  config: NewsletterConfig,
  limit: number,
  minPubDate: Date | null,
): Promise<BriefingEntry[]> {
  const r = await fetch(config.rssUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`${config.name}: ${r.status}`);
  const items = parseFeed(await r.text());
  const fresh = minPubDate
    ? items.filter((i) => i.pubDate >= minPubDate)
    : items;
  return fresh.slice(0, limit).map((item) => ({
    source: "rss",
    title: item.title,
    url: item.link,
    publishedAt: item.pubDate.toISOString(),
    body: item.content ? stripHtml(item.content).slice(0, 500) : undefined,
    author: config.name,
    extra: { feed: config.name, tag: config.tag },
  }));
}

const CONCURRENCY = 4;

export async function fetchRss(
  limitPerFeed: number,
  tag?: FeedTag,
  maxAgeDays?: number,
): Promise<BriefingEntry[]> {
  const configs = tag ? NEWSLETTERS.filter((n) => n.tag === tag) : NEWSLETTERS;
  const minPubDate = maxAgeDays
    ? new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000)
    : null;
  const out: BriefingEntry[] = [];
  let i = 0;

  async function worker() {
    while (i < configs.length) {
      const c = configs[i++];
      if (!c) return;
      try {
        out.push(...(await fetchOne(c, limitPerFeed, minPubDate)));
      } catch {
        // per-feed errors are swallowed; one bad feed shouldn't kill the run
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, configs.length) }, worker),
  );
  return out;
}
