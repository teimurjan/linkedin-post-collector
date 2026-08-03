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
  post: (urn: string) => `https://www.linkedin.com/feed/update/${urn}/`,
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
  // LinkedIn's new detail UI obfuscates classes but keeps this test id.
  // The old commentary class remains as a fallback for accounts on the old UI.
  body: '.update-components-update-v2__commentary, [data-testid="expandable-text-box"]',

  // Body truncation toggle ("…more").
  seeMoreToggle: ".feed-shared-inline-show-more-text__see-more-less-toggle",

  // Comments-expand button on the social-counts row (filter by text content
  // to pick the comment button, not reactions/reposts).
  socialCountsBtn: ".social-details-social-counts__btn",

  // Counts. LinkedIn ships two coexisting UIs for the social-counts row:
  //   - Old: buttons with aria-label like "4 comments on …'s post".
  //   - New: obfuscated classes with stable action aria-labels and screen-reader
  //     text such as "N reactions" / "N comments" / "N impressions".
  impressions: ".ca-entry-point__num-views strong",
  reactionsFallbackNumber:
    ".social-details-social-counts__social-proof-fallback-number",
  commentsButton:
    'button[aria-label*="comments on" i], button[aria-label="Comment" i]',
  repostsButton:
    'button[aria-label*="reposts of" i], button[aria-label="Repost" i]',
  // Regex applied to short element text on the post detail page.
  countLabelPattern:
    /^\s*([\d,.]+\s*[KMB]?)\s+(reaction|comment|repost|impression)s?\s*$/i,

  // Comment thread.
  topLevelComment:
    "article.comments-comment-entity:not(.comments-comment-entity--reply)",
  replyComment: "article.comments-comment-entity--reply",
  commentAuthor: ".comments-comment-meta__description-title",
  commentBody: ".comments-comment-item__main-content .update-components-text",
  commentItemNew: '[id^="replaceableComment_urn:li:comment:"]',
  commentOptionsNew: '[aria-label^="View more options for "]',
  commentBodyNew: '[data-testid="expandable-text-box"]',

  // Load-more-style buttons to click iteratively until the thread is fully expanded.
  loadMorePattern:
    /load more comments|show more comments|previous comments|view more comments|more replies|show more replies|load previous replies/i,
} as const;
