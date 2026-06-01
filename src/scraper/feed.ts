import type { Page } from "playwright-core";
import { urnToDate } from "./parse.ts";
import { FEED, URLS } from "./selectors.ts";

const SCROLL_PAUSE_MS = 2500;
const MAX_IDLE_SCROLLS = 6;
const MAX_AGE_YEARS = 3;

/**
 * Pass 1: scroll the user's Posts tab newest→oldest and collect post URNs.
 * No clicks, no DOM extraction beyond URN attributes — the actual scraping
 * happens later in parallel tabs.
 *
 * Stops as soon as either:
 *  - the next URN is already on disk (`known`)
 *  - the next URN is older than the age cutoff
 *  - several scrolls in a row produce no new URNs (end of feed)
 */
export async function collectPostUrns(
  page: Page,
  handle: string,
  known: ReadonlySet<string>,
): Promise<string[]> {
  await page.goto(URLS.postsTab(handle), { waitUntil: "domcontentloaded" });
  await page.waitForSelector(FEED.postCard, { timeout: 30_000 });

  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - MAX_AGE_YEARS);

  const seen = new Set<string>();
  const order: string[] = [];
  let idleScrolls = 0;

  while (true) {
    const urns = await listVisibleUrns(page);
    let progressed = false;
    let stop = false;

    for (const urn of urns) {
      if (seen.has(urn)) continue;
      seen.add(urn);
      progressed = true;

      if (known.has(urn)) {
        console.log(`  ◇ Hit known post ${urn}, stopping collection`);
        stop = true;
        break;
      }

      const postedAt = urnToDate(urn);
      if (postedAt < cutoff) {
        console.log(
          `  ◇ Reached ${MAX_AGE_YEARS}-year cutoff (${postedAt.toISOString().slice(0, 10)}), stopping collection`,
        );
        stop = true;
        break;
      }

      order.push(urn);
    }

    if (stop) break;

    if (!progressed) {
      idleScrolls += 1;
      if (idleScrolls >= MAX_IDLE_SCROLLS) {
        console.log(
          "  ◇ No new posts after multiple scrolls — assuming end of feed",
        );
        break;
      }
    } else {
      idleScrolls = 0;
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(SCROLL_PAUSE_MS);
  }

  return order;
}

function listVisibleUrns(page: Page): Promise<string[]> {
  return page.$$eval(
    FEED.postCard,
    (els, attr) =>
      els.map((el) => el.getAttribute(attr)).filter((v): v is string => !!v),
    FEED.urnAttr,
  );
}
