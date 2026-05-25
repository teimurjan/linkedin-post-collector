import { ensureLoggedIn } from "../auth.ts";
import { openBrowser } from "../browser.ts";
import { scrapePost } from "../post.ts";
import {
  loadSavedPostIndex,
  type SavedPostIndexEntry,
  savePostAt,
} from "../storage.ts";

const DEFAULT_LIMIT = 5;
const CONCURRENCY = 5;

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
      "Refresh the N most recent saved posts (default 5) in place — fetches",
    );
    console.log(
      "current impressions, likes, comments, shares, and threaded replies.",
    );
    return;
  }

  const { limit } = parseArgs(process.argv.slice(2));
  const index = await loadSavedPostIndex();
  const targets = index.slice(0, limit);

  if (targets.length === 0) {
    console.log("No saved posts to rescrape.");
    return;
  }

  console.log(
    `▶ Rescraping ${targets.length} most recent post(s) (limit ${limit})…`,
  );

  const context = await openBrowser();
  let updated = 0;
  let failed = 0;

  try {
    await ensureLoggedIn(context);

    const queue: SavedPostIndexEntry[] = [...targets];
    const workerCount = Math.min(CONCURRENCY, queue.length);

    const workers = Array.from({ length: workerCount }, async (_, workerId) => {
      while (queue.length > 0) {
        const target = queue.shift();
        if (!target) return;
        const remaining = queue.length;
        try {
          const post = await scrapePost(context, target.urn);
          if (!post.content) {
            failed += 1;
            console.warn(
              `  ✗ [w${workerId}] empty body for ${target.urn} (kept old file)`,
            );
            continue;
          }
          await savePostAt(target.path, post);
          updated += 1;
          const a = post.analytics;
          console.log(
            `  ✓ [w${workerId}] ${target.path}  [imp=${a.impressions ?? "?"} ❤=${a.likes ?? "?"} 💬=${a.comments ?? "?"} 🔁=${a.shares ?? "?"}] (${post.comments.length} thread, ${remaining} left)`,
          );
        } catch (err) {
          failed += 1;
          const message = err instanceof Error ? err.message : String(err);
          const firstLine = message.split("\n")[0] ?? message;
          console.warn(`  ✗ [w${workerId}] ${target.urn}: ${firstLine}`);
        }
      }
    });

    await Promise.all(workers);
  } finally {
    await context.close();
  }

  console.log("");
  console.log(
    `▶ Done. ${updated} updated${failed ? `, ${failed} failed` : ""}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
