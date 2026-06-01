import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BrowserContext, Page } from "playwright-core";
import { parseCount, urnToDate } from "./parse.ts";
import { POST, URLS } from "./selectors.ts";
import type { Comment, Post } from "./types.ts";

const POST_LOAD_TIMEOUT = 25_000;
const BODY_TEXT_TIMEOUT = 10_000;
const SEE_MORE_WAIT_MS = 300;
const EXPAND_WAIT_MS = 2_000;
const LOAD_MORE_WAIT_MS = 1_500;
const MAX_LOAD_MORE_CLICKS = 30;
const DEBUG_DIR = "debug";

/**
 * Pass 2: open a fresh tab on the post detail page, fully expand body and
 * comments, then read everything in one page.evaluate call.
 *
 * One retry: if the first pass returns empty body text, reload and try again
 * before giving up. Throttled / unhydrated responses recover on retry.
 */
export async function scrapePost(
  context: BrowserContext,
  urn: string,
): Promise<Post> {
  const page = await context.newPage();
  try {
    let raw = await loadAndExtract(page, urn);
    if (!raw.text) {
      raw = await loadAndExtract(page, urn);
    }
    if (!raw.text) {
      await dumpDebugHtml(page, urn).catch(() => {});
    }
    return toPost(urn, raw);
  } finally {
    await page.close().catch(() => {});
  }
}

async function loadAndExtract(page: Page, urn: string): Promise<RawPost> {
  const postUrl = URLS.post(urn);
  await page.goto(postUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(POST.body, { timeout: POST_LOAD_TIMEOUT });
  // The wrapper can mount before React hydrates its text children, leaving
  // innerText empty. Wait for the body to actually contain text so extract()
  // doesn't race against an empty shell. Shorter timeout than the selector
  // wait — if text never lands, we want to fall through and retry/dump.
  await page
    .waitForFunction(
      (sel) =>
        (
          (document.querySelector(sel) as HTMLElement | null)?.innerText || ""
        ).trim().length > 0,
      POST.body,
      { timeout: BODY_TEXT_TIMEOUT },
    )
    .catch(() => {});

  // Pre-click extraction. If a later click navigates the page elsewhere
  // (LinkedIn occasionally throws a Premium interstitial), we keep at least
  // body + counts from this snapshot.
  const initial = await extract(page);

  // Lock the page to this post: any top-level navigation away from the post
  // URL gets aborted. Subresource requests (images, API, JS) pass through.
  const unroute = await installNavigationGuard(page, urn);

  try {
    await expandBody(page);
    await expandComments(page);
    await loadMoreUntilDone(page);
    await clickAllSeeMore(page);
  } finally {
    await unroute().catch(() => {});
  }

  if (!page.url().includes(urn)) return initial;

  const after = await extract(page);
  return mergeRaw(initial, after);
}

async function installNavigationGuard(
  page: Page,
  urn: string,
): Promise<() => Promise<void>> {
  const handler = async (
    route: import("playwright-core").Route,
  ): Promise<void> => {
    const req = route.request();
    if (
      req.isNavigationRequest() &&
      req.frame() === page.mainFrame() &&
      !req.url().includes(urn)
    ) {
      await route.abort();
      return;
    }
    await route.continue();
  };
  await page.route("**/*", handler);
  return () => page.unroute("**/*", handler);
}

function mergeRaw(initial: RawPost, after: RawPost): RawPost {
  return {
    text: after.text || initial.text,
    impressions: after.impressions || initial.impressions,
    reactions: after.reactions || initial.reactions,
    comments: after.comments || initial.comments,
    reposts: after.reposts || initial.reposts,
    commentItems:
      after.commentItems.length > 0 ? after.commentItems : initial.commentItems,
  };
}

async function dumpDebugHtml(page: Page, urn: string): Promise<void> {
  const safe = urn.replace(/[^a-zA-Z0-9._-]/g, "_");
  await mkdir(DEBUG_DIR, { recursive: true });
  const html = await page.content();
  await writeFile(join(DEBUG_DIR, `${safe}.html`), html);
}

// All click scopes are restricted to the post's own fie-impression-container
// so we can't accidentally hit sidebar widgets, recommended-content cards,
// or sponsored Jobs/Premium upsells whose text happens to match our patterns.
const POST_ROOT = ".fie-impression-container";
const COMMENTS_ROOT =
  ".comments-comments-list, .feed-shared-update-v2__comments-container";

async function expandBody(page: Page): Promise<void> {
  const toggle = page.locator(`${POST_ROOT} ${POST.seeMoreToggle}`).first();
  if ((await toggle.count()) === 0) return;
  await toggle.click({ timeout: 2_000 }).catch(() => {});
  await page.waitForTimeout(SEE_MORE_WAIT_MS);
}

async function expandComments(page: Page): Promise<void> {
  // Use the explicit aria-label for the post's comments button rather than a
  // text filter — the text filter "comment" can match unrelated buttons.
  const btn = page.locator(`${POST_ROOT} ${POST.commentsButton}`).first();
  if ((await btn.count()) === 0) return;
  await btn.click({ timeout: 3_000 }).catch(() => {});
  await page.waitForTimeout(EXPAND_WAIT_MS);
}

async function loadMoreUntilDone(page: Page): Promise<void> {
  for (let i = 0; i < MAX_LOAD_MORE_CLICKS; i += 1) {
    const btn = page
      .locator(`:is(${COMMENTS_ROOT}) button`)
      .filter({ hasText: POST.loadMorePattern })
      .first();
    if ((await btn.count()) === 0) return;
    await btn.click({ timeout: 3_000 }).catch(() => {});
    await page.waitForTimeout(LOAD_MORE_WAIT_MS);
  }
}

/**
 * After comments load they may contain their own truncated "…more" toggles.
 * Click them all so comment bodies are fully visible in the DOM. Scoped to
 * the comments tree to avoid catching unrelated truncation toggles elsewhere.
 */
async function clickAllSeeMore(page: Page): Promise<void> {
  for (let i = 0; i < 10; i += 1) {
    const toggle = page
      .locator(`:is(${COMMENTS_ROOT}) ${POST.seeMoreToggle}`)
      .filter({ hasText: /more$/i })
      .first();
    if ((await toggle.count()) === 0) return;
    await toggle.click({ timeout: 1_500 }).catch(() => {});
    await page.waitForTimeout(SEE_MORE_WAIT_MS);
  }
}

type RawPost = {
  text: string;
  impressions: string;
  reactions: string;
  comments: string;
  reposts: string;
  commentItems: { author: string; content: string; isReply: boolean }[];
};

function extract(page: Page): Promise<RawPost> {
  return page.evaluate(
    (sels) => {
      const text = (el: Element | null): string =>
        (el as HTMLElement | null)?.innerText?.trim() ?? "";
      const attr = (el: Element | null, name: string): string =>
        el?.getAttribute(name) ?? "";

      // Find counts in the new UI by scanning short span/p text for the
      // "N <label>" screen-reader pattern. Returns the first match.
      const labelRe = new RegExp(
        sels.countLabelPattern.source,
        sels.countLabelPattern.flags,
      );
      const findCountByLabel = (
        label: "reaction" | "comment" | "repost",
      ): string => {
        const nodes = Array.from(document.querySelectorAll("span, p"));
        for (const n of nodes) {
          const t = (n.textContent || "").trim();
          if (t.length === 0 || t.length > 24) continue;
          const m = t.match(labelRe);
          if (m && m[2]?.toLowerCase() === label) return m[1] ?? "";
        }
        return "";
      };

      const body = text(document.querySelector(sels.body));
      const impressions = text(document.querySelector(sels.impressions));
      const reactions =
        text(document.querySelector(sels.reactionsFallbackNumber)) ||
        findCountByLabel("reaction");
      const comments =
        attr(document.querySelector(sels.commentsButton), "aria-label") ||
        findCountByLabel("comment");
      const reposts =
        attr(document.querySelector(sels.repostsButton), "aria-label") ||
        findCountByLabel("repost");

      const commentItems: {
        author: string;
        content: string;
        isReply: boolean;
      }[] = [];
      const tops = Array.from(document.querySelectorAll(sels.topLevelComment));
      for (const top of tops) {
        const tAuthorBlock = text(top.querySelector(sels.commentAuthor));
        const tContent = text(top.querySelector(sels.commentBody));
        if (tAuthorBlock && tContent) {
          commentItems.push({
            author: cleanAuthor(tAuthorBlock),
            content: tContent,
            isReply: false,
          });
        }
        const replies = Array.from(top.querySelectorAll(sels.replyComment));
        for (const r of replies) {
          const rAuthorBlock = text(r.querySelector(sels.commentAuthor));
          const rContent = text(r.querySelector(sels.commentBody));
          if (rAuthorBlock && rContent) {
            commentItems.push({
              author: cleanAuthor(rAuthorBlock),
              content: rContent,
              isReply: true,
            });
          }
        }
      }

      function cleanAuthor(raw: string): string {
        // The description-title is just the name in this template; future-proof
        // by taking the first line only if LinkedIn ever stuffs headline in here.
        return (raw.split("\n")[0] ?? "").trim() || "Unknown";
      }

      return {
        text: body,
        impressions,
        reactions,
        comments,
        reposts,
        commentItems,
      };
    },
    {
      body: POST.body,
      impressions: POST.impressions,
      reactionsFallbackNumber: POST.reactionsFallbackNumber,
      commentsButton: POST.commentsButton,
      repostsButton: POST.repostsButton,
      countLabelPattern: {
        source: POST.countLabelPattern.source,
        flags: POST.countLabelPattern.flags,
      },
      topLevelComment: POST.topLevelComment,
      replyComment: POST.replyComment,
      commentAuthor: POST.commentAuthor,
      commentBody: POST.commentBody,
    },
  );
}

function toPost(urn: string, raw: RawPost): Post {
  const comments: Comment[] = raw.commentItems.map((c) => ({
    author: c.author,
    content: c.content,
    isReply: c.isReply,
  }));
  return {
    urn,
    url: URLS.post(urn),
    postedAt: urnToDate(urn),
    content: raw.text,
    analytics: {
      impressions: parseCount(raw.impressions),
      likes: parseCount(raw.reactions),
      comments: parseCount(raw.comments),
      shares: parseCount(raw.reposts),
    },
    comments,
  };
}
