import {
  type PostRecord,
  bottomByImpressions,
  corpusStats,
  engagementScore,
  filterByLane,
  loadPosts,
  topByEngagement,
  topByImpressions,
} from "../analyze.ts";
import type { PostLane } from "../lifecycle.ts";
import { laneFlag } from "./flags.ts";

type Args = { n: number; json: boolean; lane?: PostLane };

function parseArgs(argv: string[]): Args {
  let n = 10;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--n" || a === "-n") {
      n = Number(argv[++i]) || 10;
    } else if (a === "--json") {
      json = true;
    }
  }
  const lane = laneFlag(argv);
  return { n, json, ...(lane ? { lane } : {}) };
}

function preview(p: PostRecord): string {
  const line = p.firstLine.replace(/\s+/g, " ").trim();
  return line.length > 110 ? `${line.slice(0, 107)}...` : line;
}

function renderRow(p: PostRecord, score?: number): string {
  const date = p.postedAt.toISOString().slice(0, 10);
  const imp = p.impressions ?? "—";
  const l = p.likes ?? 0;
  const c = p.comments ?? 0;
  const s = p.shares ?? 0;
  const tail = score === undefined ? "" : ` · score ${score}`;
  return `- **${date}** · ${imp} imp · ${l}♥ ${c}💬 ${s}↗${tail}\n  > ${preview(p)}`;
}

function renderMarkdown(
  posts: PostRecord[],
  n: number,
  lane?: PostLane,
): string {
  const stats = corpusStats(posts);
  const topImp = topByImpressions(posts, n);
  const topEng = topByEngagement(posts, n);
  const bot = bottomByImpressions(posts, 5);

  const lines: string[] = [];
  const scope = lane ? `, \`${lane}\` lane only` : "";
  lines.push(
    `# Post corpus analysis (${stats.total} posts, ${stats.withImpressions} ranked${scope})\n`,
  );

  lines.push("## Top by impressions\n");
  for (const p of topImp) lines.push(renderRow(p));
  lines.push("");

  lines.push("## Top by engagement (likes + 3·comments + 5·shares)\n");
  const covered = (pick: (p: PostRecord) => number | null): number =>
    posts.filter((p) => typeof pick(p) === "number").length;
  lines.push(
    `> Coverage: likes on ${covered((p) => p.likes)}/${stats.total} posts, comments ${covered((p) => p.comments)}/${stats.total}, shares ${covered((p) => p.shares)}/${stats.total}. Missing values count as zero, so this ranking partly reflects which posts scraped cleanly. Prefer impressions.\n`,
  );
  for (const p of topEng) lines.push(renderRow(p, engagementScore(p)));
  lines.push("");

  lines.push("## Bottom by impressions (avoid these patterns)\n");
  for (const p of bot) lines.push(renderRow(p));
  lines.push("");

  lines.push("## Corpus stats\n");
  lines.push(`- Median impressions: ${stats.medianImpressions}`);
  lines.push(`- Median post length (chars): ${stats.medianLength}`);
  lines.push(
    `- Opening-line word counts in top quartile: ${stats.topQuartileOpeningWords.join(", ") || "—"}`,
  );

  return lines.join("\n");
}

async function main() {
  const { n, json, lane } = parseArgs(process.argv.slice(2));
  const posts = filterByLane(await loadPosts(), lane);

  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          ...(lane ? { lane } : {}),
          stats: corpusStats(posts),
          topByImpressions: topByImpressions(posts, n),
          topByEngagement: topByEngagement(posts, n).map((p) => ({
            ...p,
            score: engagementScore(p),
          })),
          bottomByImpressions: bottomByImpressions(posts, 5),
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  process.stdout.write(`${renderMarkdown(posts, n, lane)}\n`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
