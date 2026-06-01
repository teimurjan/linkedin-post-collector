export type SourceId = "hackernews" | "lobsters" | "rss";

export interface BriefingEntry {
  source: SourceId;
  title: string;
  url: string;
  score?: number;
  commentCount?: number;
  author?: string;
  publishedAt: string;
  body?: string;
  extra?: Record<string, unknown>;
}
