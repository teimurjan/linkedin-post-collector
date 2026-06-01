import { ensureLoggedIn } from "./auth.ts";
import { openBrowser } from "./browser.ts";
import { collectPostUrns } from "./feed.ts";
import { scrapePost } from "./post.ts";
import {
  loadFailedUrns,
  loadKnownUrns,
  saveErrorStub,
  savePost,
} from "./storage.ts";

const CONCURRENCY = 5;

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: bun run scrape");
    console.log("");
    console.log(
      "Pass 1: scroll your LinkedIn Posts tab to collect URNs of new posts.",
    );
    console.log(
      "Pass 2: open up to 5 tabs in parallel and scrape each post detail page.",
    );
    console.log("Saves each post to posts/YYYY/MM-DD-<slug>.md.");
    return;
  }

  console.log("▶ LinkedIn Post Collector");
  const known = await loadKnownUrns();
  const failedUrns = await loadFailedUrns();
  console.log(
    `  ◇ ${known.size} saved post(s) on disk${
      failedUrns.length
        ? `, ${failedUrns.length} prior failure(s) to retry`
        : ""
    }`,
  );

  const context = await openBrowser();
  let saved = 0;
  let failed = 0;

  try {
    const { page, handle } = await ensureLoggedIn(context);

    console.log("  ◇ Pass 1: collecting URNs from feed…");
    const fresh = await collectPostUrns(page, handle, known);
    console.log(
      `  ◇ Collected ${fresh.length} new URN(s)${failedUrns.length ? ` + ${failedUrns.length} retry` : ""}`,
    );
    const queue = [...fresh, ...failedUrns];
    if (queue.length === 0) return;

    console.log(`  ◇ Pass 2: scraping in ${CONCURRENCY} parallel tabs…`);

    const workers = Array.from({ length: CONCURRENCY }, async (_, workerId) => {
      while (queue.length > 0) {
        const urn = queue.shift();
        if (!urn) return;
        const remaining = queue.length;
        try {
          const post = await scrapePost(context, urn);
          if (!post.content) {
            failed += 1;
            const stubPath = await saveErrorStub(urn, "empty body").catch(
              () => null,
            );
            console.warn(
              `  ✗ [w${workerId}] empty body for ${urn}${stubPath ? ` → ${stubPath}` : ""}`,
            );
            continue;
          }
          const path = await savePost(post);
          saved += 1;
          const a = post.analytics;
          console.log(
            `  ✓ [w${workerId}] ${path}  [imp=${a.impressions ?? "?"} ❤=${a.likes ?? "?"} 💬=${a.comments ?? "?"} 🔁=${a.shares ?? "?"}] (${post.comments.length} thread, ${remaining} left)`,
          );
        } catch (err) {
          failed += 1;
          const message = err instanceof Error ? err.message : String(err);
          const firstLine = message.split("\n")[0] ?? message;
          const stubPath = await saveErrorStub(urn, firstLine).catch(
            () => null,
          );
          console.warn(
            `  ✗ [w${workerId}] ${urn}: ${firstLine}${stubPath ? ` → ${stubPath}` : ""}`,
          );
        }
      }
    });

    await Promise.all(workers);
  } finally {
    await context.close();
  }

  console.log("");
  console.log(`▶ Done. ${saved} saved${failed ? `, ${failed} failed` : ""}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
