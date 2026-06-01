export type Analytics = {
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

export type Comment = {
  author: string;
  content: string;
  isReply: boolean;
};

export type Post = {
  urn: string;
  url: string;
  postedAt: Date;
  content: string;
  analytics: Analytics;
  comments: Comment[];
};

export type SavedPost = Post & {
  scrapedAt: Date;
  filePath: string;
};
