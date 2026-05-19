import { USER_AGENT } from "../config";
import type { BriefingEntry } from "../types";

interface LobstersStory {
  short_id: string;
  title: string;
  url: string;
  score: number;
  comment_count: number;
  comments_url: string;
  created_at: string;
  description: string;
  tags: string[];
  submitter_user: { username: string };
}

const PAGE_SIZE = 25;

function toEntry(story: LobstersStory): BriefingEntry {
  return {
    source: "lobsters",
    title: story.title,
    url: story.url || story.comments_url,
    score: story.score,
    commentCount: story.comment_count,
    author: story.submitter_user.username,
    publishedAt: new Date(story.created_at).toISOString(),
    body: story.description || undefined,
    extra: { tags: story.tags, permalink: story.comments_url },
  };
}

export async function fetchLobsters(limit: number): Promise<BriefingEntry[]> {
  const pageCount = Math.max(1, Math.ceil(limit / PAGE_SIZE));
  const stories: LobstersStory[] = [];

  for (let page = 1; page <= pageCount; page++) {
    const url =
      page === 1
        ? "https://lobste.rs/hottest.json"
        : `https://lobste.rs/page/${page}.json`;
    const r = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!r.ok) throw new Error(`Lobsters: ${r.status}`);
    stories.push(...((await r.json()) as LobstersStory[]));
  }

  return stories.slice(0, limit).map(toEntry);
}
