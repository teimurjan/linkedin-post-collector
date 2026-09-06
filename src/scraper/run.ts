import type { BrowserContext, Page } from "playwright-core";
import { collectPostUrns } from "./feed.ts";
import { scrapePost } from "./post.ts";
import {
  loadFailedUrns,
  loadKnownUrns,
  saveErrorStub,
  savePost,
  savePostAt,
} from "./storage.ts";
import type { Post } from "./types.ts";

export const CONCURRENCY = 5;

/**
 * One post to scrape. `path` set means the post is already on disk and gets
 * refreshed in place; absent means it's new and gets a fresh file (plus an
 * error stub on failure, so the next run retries it).
 */
export type ScrapeJob = { urn: string; path?: string };

export type ScrapeSummary = { saved: number; updated: number; failed: number };

export type Discovery = {
  known: ReadonlySet<string>;
  fresh: string[];
  retry: string[];
};

/**
 * Pass 1: walk the Posts tab for URNs not yet on disk, plus the URNs of prior
 * failures (error stubs), which the stop-on-first-known walk would strand.
 */
export async function discoverNewUrns(
  page: Page,
  handle: string,
): Promise<Discovery> {
  const known = await loadKnownUrns();
  const retry = await loadFailedUrns();
  const fresh = await collectPostUrns(page, handle, known);
  return { known, fresh, retry };
}

export function newPostJobs(discovery: Discovery): ScrapeJob[] {
  return [...new Set([...discovery.fresh, ...discovery.retry])].map((urn) => ({
    urn,
  }));
}

/**
 * Drain `jobs` through a fixed pool of parallel tabs, saving each post as it
 * lands. Never throws for a single bad post — failures are counted and logged.
 */
export async function runScrapeJobs(
  context: BrowserContext,
  jobs: ScrapeJob[],
  concurrency = CONCURRENCY,
): Promise<ScrapeSummary> {
  const queue = [...jobs];
  const summary: ScrapeSummary = { saved: 0, updated: 0, failed: 0 };
  const workerCount = Math.min(concurrency, queue.length);

  const workers = Array.from({ length: workerCount }, async (_, workerId) => {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) return;
      const remaining = queue.length;
      try {
        const post = await scrapePost(context, job.urn);
        if (!post.content) {
          summary.failed += 1;
          await warnFailure(job, workerId, "empty body");
          continue;
        }
        const path = await persist(job, post);
        if (job.path) summary.updated += 1;
        else summary.saved += 1;
        const a = post.analytics;
        console.log(
          `  ${job.path ? "↻" : "✓"} [w${workerId}] ${path}  [imp=${a.impressions ?? "?"} ❤=${a.likes ?? "?"} 💬=${a.comments ?? "?"} 🔁=${a.shares ?? "?"}] (${post.comments.length} thread, ${remaining} left)`,
        );
      } catch (err) {
        summary.failed += 1;
        const message = err instanceof Error ? err.message : String(err);
        await warnFailure(job, workerId, message.split("\n")[0] ?? message);
      }
    }
  });

  await Promise.all(workers);
  return summary;
}

async function persist(job: ScrapeJob, post: Post): Promise<string> {
  if (!job.path) return savePost(post);
  await savePostAt(job.path, post);
  return job.path;
}

async function warnFailure(
  job: ScrapeJob,
  workerId: number,
  reason: string,
): Promise<void> {
  if (job.path) {
    console.warn(`  ✗ [w${workerId}] ${job.urn}: ${reason} (kept ${job.path})`);
    return;
  }
  const stubPath = await saveErrorStub(job.urn, reason).catch(() => null);
  console.warn(
    `  ✗ [w${workerId}] ${job.urn}: ${reason}${stubPath ? ` → ${stubPath}` : ""}`,
  );
}
