import { loadPosts } from "../analyze.ts";
import { loadRetros } from "../lifecycle.ts";
import {
  analyzePostPatterns,
  renderPostPatternsMarkdown,
} from "../patterns.ts";

type Args = { json: boolean };

function parseArgs(argv: string[]): Args {
  return { json: argv.includes("--json") };
}

async function main() {
  const { json } = parseArgs(process.argv.slice(2));
  const [posts, retros] = await Promise.all([loadPosts(), loadRetros()]);
  const report = analyzePostPatterns(posts, retros);

  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderPostPatternsMarkdown(report)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
