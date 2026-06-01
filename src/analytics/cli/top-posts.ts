import {
  type PostRecord,
  bottomByImpressions,
  corpusStats,
  engagementScore,
  loadPosts,
  topByEngagement,
  topByImpressions,
} from "../analyze.ts";

type Args = { n: number; json: boolean };

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
  return { n, json };
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

function renderMarkdown(posts: PostRecord[], n: number): string {
  const stats = corpusStats(posts);
  const topImp = topByImpressions(posts, n);
  const topEng = topByEngagement(posts, n);
  const bot = bottomByImpressions(posts, 5);

  const lines: string[] = [];
  lines.push(
    `# Post corpus analysis (${stats.total} posts, ${stats.withImpressions} ranked)\n`,
  );

  lines.push("## Top by impressions\n");
  for (const p of topImp) lines.push(renderRow(p));
  lines.push("");

  lines.push("## Top by engagement (likes + 3·comments + 5·shares)\n");
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
  const { n, json } = parseArgs(process.argv.slice(2));
  const posts = await loadPosts();

  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
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

  process.stdout.write(`${renderMarkdown(posts, n)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
