/**
 * All LinkedIn DOM selectors live here. When LinkedIn ships UI changes,
 * this is the only file you should need to touch.
 *
 * Selector accuracy is anchored to debug/urn_li_activity_*.html dumps —
 * keep dumps around so future selector audits stay grounded in real HTML.
 */

export const URLS = {
  feed: "https://www.linkedin.com/feed/",
  login: "https://www.linkedin.com/login",
  me: "https://www.linkedin.com/in/me/",
  postsTab: (handle: string) =>
    `https://www.linkedin.com/in/${handle}/recent-activity/shares/`,
  post: (urn: string) =>
    `https://www.linkedin.com/feed/update/${urn}/`,
} as const;

export const LOGGED_IN_URL_PATTERN = /linkedin\.com\/(feed|in\/)/;

/**
 * Pass 1: feed walking — collect URNs only, no clicks, no extraction.
 * The `:has(.control-menu-container)` filter screens out sponsored/suggested
 * cards by requiring the "···" affordance that only appears on own posts.
 */
export const FEED = {
  postCard:
    '[data-urn^="urn:li:activity:"]:has(.feed-shared-update-v2__control-menu-container)',
  urnAttr: "data-urn",
} as const;

/**
 * Pass 2: per-post detail page (linkedin.com/feed/update/<urn>/).
 * Each tab clicks the expand affordances, then reads these selectors.
 */
export const POST = {
  // The post body sits in this specific commentary variant of update-components-text,
  // distinguishing it from the same class reused inside comments.
  body: ".update-components-update-v2__commentary",

  // Body truncation toggle ("…more").
  seeMoreToggle: ".feed-shared-inline-show-more-text__see-more-less-toggle",

  // Comments-expand button on the social-counts row (filter by text content
  // to pick the comment button, not reactions/reposts).
  socialCountsBtn: ".social-details-social-counts__btn",

  // Counts. LinkedIn ships two coexisting UIs for the social-counts row:
  //   - Old: buttons with aria-label like "4 comments on …'s post".
  //   - New: obfuscated-class spans where the screen-reader text reads
  //     "N reactions" / "N comment" / "N repost" (the visible sibling is
  //     just the number). We try both and take the first hit.
  impressions: ".ca-entry-point__num-views strong",
  reactionsFallbackNumber: ".social-details-social-counts__social-proof-fallback-number",
  commentsButton: 'button[aria-label*="comments on" i]',
  repostsButton: 'button[aria-label*="reposts of" i]',
  // Regex applied to span/p textContent on the post detail page. The screen-
  // reader copy is "N <label>" or "N <label>s" — matching is case-insensitive.
  countLabelPattern: /^\s*([\d,.]+\s*[KMB]?)\s+(reaction|comment|repost)s?\s*$/i,

  // Comment thread.
  topLevelComment:
    "article.comments-comment-entity:not(.comments-comment-entity--reply)",
  replyComment: "article.comments-comment-entity--reply",
  commentAuthor: ".comments-comment-meta__description-title",
  commentBody: ".comments-comment-item__main-content .update-components-text",

  // Load-more-style buttons to click iteratively until the thread is fully expanded.
  loadMorePattern:
    /load more comments|show more comments|previous comments|view more comments|more replies|show more replies|load previous replies/i,
} as const;
