/**
 * One-off: open a specific LinkedIn post, fully expand it (body + comments +
 * "load more" buttons), and dump HTML to disk for offline analysis.
 *
 *   bun run scripts/dump-post.ts urn:li:activity:7434246994841268224
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openBrowser } from "../src/browser.ts";
import { ensureLoggedIn } from "../src/auth.ts";
import { FEED, POST, URLS } from "../src/selectors.ts";

const TARGET_URN = process.argv[2] ?? "urn:li:activity:7434246994841268224";
const LOAD_MORE_PATTERNS =
  /load more comments|show more comments|previous comments|view more comments|more replies|show more replies/i;
const MAX_LOAD_MORE_ITERATIONS = 40;

async function main(): Promise<void> {
  console.log(`▶ Dumping ${TARGET_URN}`);
  const context = await openBrowser();

  try {
    const { page } = await ensureLoggedIn(context);

    const url = URLS.post(TARGET_URN);
    console.log(`  ◇ Navigating to ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const cardSel = `[${FEED.urnAttr}="${TARGET_URN}"]`;
    await page.waitForSelector(cardSel, { timeout: 30_000 });
    await page.waitForTimeout(1500);

    const card = page.locator(cardSel).first();
    await card.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});

    const seeMore = card.locator(POST.seeMoreToggle);
    const seeMoreCount = await seeMore.count();
    console.log(`  ◇ Found ${seeMoreCount} see-more toggle(s)`);
    if (seeMoreCount > 0) {
      await seeMore
        .first()
        .click({ timeout: 2_000 })
        .catch((e) => console.log(`    see-more click failed: ${e.message}`));
      await page.waitForTimeout(500);
    }

    const commentsBtn = page
      .locator(POST.socialCountsBtn)
      .filter({ hasText: /comment/i })
      .first();
    const cbCount = await commentsBtn.count();
    console.log(`  ◇ Found ${cbCount} comments-expand button(s)`);
    if (cbCount > 0) {
      await commentsBtn
        .click({ timeout: 2_000 })
        .catch((e) => console.log(`    comments click failed: ${e.message}`));
      await page.waitForTimeout(2_500);
    }

    for (let i = 0; i < MAX_LOAD_MORE_ITERATIONS; i += 1) {
      const loadMore = page
        .locator("button")
        .filter({ hasText: LOAD_MORE_PATTERNS })
        .first();
      if ((await loadMore.count()) === 0) {
        console.log(`  ◇ No more load-more buttons after ${i} iteration(s)`);
        break;
      }
      const label = (await loadMore.innerText().catch(() => "")).slice(0, 60);
      console.log(`  ◇ load-more iter ${i + 1}: "${label}"`);
      await loadMore.click({ timeout: 3_000 }).catch(() => {});
      await page.waitForTimeout(1_800);
    }

    await page.waitForTimeout(1_500);

    const debugDir = resolve(process.cwd(), "debug");
    await mkdir(debugDir, { recursive: true });
    const safe = TARGET_URN.replace(/:/g, "_");

    const fullHtml = await page.content();
    const fullPath = resolve(debugDir, `${safe}-full.html`);
    await writeFile(fullPath, fullHtml);
    console.log(`  ✓ Full page (${fullHtml.length.toLocaleString()} bytes) → ${fullPath}`);

    const cardHtml = await card.evaluate((el) => el.outerHTML);
    const cardPath = resolve(debugDir, `${safe}-card.html`);
    await writeFile(cardPath, cardHtml);
    console.log(`  ✓ Card subtree (${cardHtml.length.toLocaleString()} bytes) → ${cardPath}`);

    const shotPath = resolve(debugDir, `${safe}.png`);
    await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
    console.log(`  ✓ Screenshot → ${shotPath}`);

    console.log("\n  Browser stays open for 60s — inspect freely. Ctrl-C to exit early.");
    await page.waitForTimeout(60_000);
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
