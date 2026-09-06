import { loadPosts } from "../analyze.ts";
import { type PostLane, loadRetros } from "../lifecycle.ts";
import {
  analyzePostPatterns,
  renderPostPatternsMarkdown,
} from "../patterns.ts";
import { laneFlag } from "./flags.ts";

type Args = { json: boolean; lane?: PostLane };

function parseArgs(argv: string[]): Args {
  const lane = laneFlag(argv);
  return { json: argv.includes("--json"), ...(lane ? { lane } : {}) };
}

async function main() {
  const { json, lane } = parseArgs(process.argv.slice(2));
  const [posts, retros] = await Promise.all([loadPosts(), loadRetros()]);
  const report = analyzePostPatterns(posts, retros, { lane });

  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderPostPatternsMarkdown(report)}\n`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
