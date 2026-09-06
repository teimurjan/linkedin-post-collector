import { ensureLoggedIn } from "../auth.ts";
import { openBrowser } from "../browser.ts";
import {
  CONCURRENCY,
  type ScrapeJob,
  discoverNewUrns,
  newPostJobs,
  runScrapeJobs,
} from "../run.ts";
import { loadSavedPostIndex } from "../storage.ts";

const DEFAULT_LIMIT = 5;

type Args = { limit: number };

function parseArgs(argv: string[]): Args {
  let limit = DEFAULT_LIMIT;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit" || a === "-n") {
      const next = Number(argv[++i]);
      if (Number.isFinite(next) && next > 0) limit = Math.floor(next);
    }
  }
  return { limit };
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: bun run rescrape [--limit N]");
    console.log("");
    console.log(
      "Scrape any posts not yet on disk, then refresh the N most recent saved",
    );
    console.log(
      "posts (default 5) in place — current impressions, likes, comments,",
    );
    console.log("shares, and threaded replies.");
    return;
  }

  const { limit } = parseArgs(process.argv.slice(2));

  console.log("▶ LinkedIn Post Collector — rescrape");

  const context = await openBrowser();
  let summary = { saved: 0, updated: 0, failed: 0 };

  try {
    const { page, handle } = await ensureLoggedIn(context);

    // Loaded before the feed walk, so a post discovered this run is scraped
    // once as new rather than also queued as a refresh target.
    const refresh: ScrapeJob[] = (await loadSavedPostIndex())
      .slice(0, limit)
      .map(({ urn, path }) => ({ urn, path }));

    console.log("  ◇ Pass 1: collecting URNs from feed…");
    const discovery = await discoverNewUrns(page, handle);
    const fresh = newPostJobs(discovery);
    console.log(
      `  ◇ ${fresh.length} new post(s)${
        discovery.retry.length ? ` (incl. ${discovery.retry.length} retry)` : ""
      }, ${refresh.length} to refresh (limit ${limit})`,
    );

    const jobs = [...fresh, ...refresh];
    if (jobs.length === 0) {
      console.log("Nothing to scrape.");
      return;
    }

    console.log(`  ◇ Pass 2: scraping in ${CONCURRENCY} parallel tabs…`);
    summary = await runScrapeJobs(context, jobs);
  } finally {
    await context.close();
  }

  console.log("");
  console.log(
    `▶ Done. ${summary.saved} saved, ${summary.updated} refreshed${
      summary.failed ? `, ${summary.failed} failed` : ""
    }.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
