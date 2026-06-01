export type FeedTag = "ai" | "swe";

export interface NewsletterConfig {
  name: string;
  rssUrl: string;
  tag: FeedTag;
}

export const USER_AGENT =
  "linkedin-topics/1.0 (+https://github.com/teimurjan/linkedin-post-collector; contact: me@teimurjan.dev)";

// Verified RSS feeds for SWE + AI. Web3 intentionally excluded.
// Edit freely — add what you read, drop what you don't.
export const NEWSLETTERS: NewsletterConfig[] = [
  // --- AI: newsletters ---
  {
    name: "The Rundown AI",
    rssUrl: "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml",
    tag: "ai",
  },
  { name: "Ben's Bites", rssUrl: "https://www.bensbites.com/feed", tag: "ai" },
  {
    name: "Import AI",
    rssUrl: "https://importai.substack.com/feed",
    tag: "ai",
  },
  { name: "TLDR AI", rssUrl: "https://tldr.tech/api/rss/ai", tag: "ai" },
  {
    name: "AI Adopters Club",
    rssUrl: "https://aiadopters.club/feed",
    tag: "ai",
  },
  { name: "The Neuron", rssUrl: "https://www.theneuron.ai/feed/", tag: "ai" },

  // --- AI: blogs ---
  {
    name: "OpenAI Blog",
    rssUrl: "https://openai.com/news/rss.xml",
    tag: "ai",
  },
  {
    name: "Hugging Face Blog",
    rssUrl: "https://huggingface.co/blog/feed.xml",
    tag: "ai",
  },
  {
    name: "Simon Willison",
    rssUrl: "https://simonwillison.net/atom/everything",
    tag: "ai",
  },
  {
    name: "ArXivIQ",
    rssUrl: "https://arxiviq.substack.com/feed",
    tag: "ai",
  },
  {
    name: "ComfyUI Blog",
    rssUrl: "https://blog.comfy.org/feed",
    tag: "ai",
  },

  // --- SWE: newsletters ---
  { name: "TLDR Dev", rssUrl: "https://tldr.tech/api/rss/dev", tag: "swe" },
  {
    name: "JavaScript Weekly",
    rssUrl: "https://cprss.s3.amazonaws.com/javascriptweekly.com.xml",
    tag: "swe",
  },
  {
    name: "Node Weekly",
    rssUrl: "https://cprss.s3.amazonaws.com/nodeweekly.com.xml",
    tag: "swe",
  },
  {
    name: "React Status",
    rssUrl: "https://cprss.s3.amazonaws.com/react.statuscode.com.xml",
    tag: "swe",
  },
  {
    name: "Go Weekly",
    rssUrl: "https://cprss.s3.amazonaws.com/golangweekly.com.xml",
    tag: "swe",
  },
  {
    name: "Frontend Focus",
    rssUrl: "https://cprss.s3.amazonaws.com/frontendfoc.us.xml",
    tag: "swe",
  },
  {
    name: "This Week in Rust",
    rssUrl: "https://this-week-in-rust.org/atom.xml",
    tag: "swe",
  },
  {
    name: "Changelog News",
    rssUrl: "https://changelog.com/news/feed",
    tag: "swe",
  },
  {
    name: "The Pragmatic Engineer",
    rssUrl: "https://newsletter.pragmaticengineer.com/feed",
    tag: "swe",
  },
  {
    name: "Engineering Leadership",
    rssUrl: "https://newsletter.eng-leadership.com/feed",
    tag: "swe",
  },
  {
    name: "Last Week in AWS",
    rssUrl: "https://www.lastweekinaws.com/feed/",
    tag: "swe",
  },
  { name: "SRE Weekly", rssUrl: "https://sreweekly.com/feed/", tag: "swe" },
  {
    name: "DevOps Bulletin",
    rssUrl: "https://devopsbulletin.com/feed",
    tag: "swe",
  },
  {
    name: "This Week in React",
    rssUrl: "https://substack.thisweekinreact.com/feed",
    tag: "swe",
  },
];
