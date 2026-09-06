import { ensureLoggedIn } from "./auth.ts";
import { openBrowser } from "./browser.ts";
import {
  CONCURRENCY,
  discoverNewUrns,
  newPostJobs,
  runScrapeJobs,
} from "./run.ts";

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
    console.log("");
    console.log(
      "To also refresh analytics on posts already saved, use `bun run rescrape`.",
    );
    return;
  }

  console.log("▶ LinkedIn Post Collector");

  const context = await openBrowser();
  let summary = { saved: 0, updated: 0, failed: 0 };

  try {
    const { page, handle } = await ensureLoggedIn(context);

    console.log("  ◇ Pass 1: collecting URNs from feed…");
    const discovery = await discoverNewUrns(page, handle);
    console.log(
      `  ◇ ${discovery.known.size} saved post(s) on disk, collected ${discovery.fresh.length} new URN(s)${
        discovery.retry.length ? ` + ${discovery.retry.length} retry` : ""
      }`,
    );

    const jobs = newPostJobs(discovery);
    if (jobs.length === 0) return;

    console.log(`  ◇ Pass 2: scraping in ${CONCURRENCY} parallel tabs…`);
    summary = await runScrapeJobs(context, jobs);
  } finally {
    await context.close();
  }

  console.log("");
  console.log(
    `▶ Done. ${summary.saved} saved${summary.failed ? `, ${summary.failed} failed` : ""}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
