import { resolve } from "node:path";
import { POST_LANES, parsePostLane } from "../../analytics/lifecycle.ts";
import { setPostLane } from "../storage.ts";

function usage(): never {
  process.stderr.write(
    `usage: bun run post-lane <posts/YYYY/MM-DD-slug.md> <${POST_LANES.join("|")}>\n`,
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const [postArg, laneArg] = process.argv.slice(2);
  const lane = parsePostLane(laneArg);
  if (!postArg || !lane) usage();
  await setPostLane(resolve(process.cwd(), postArg), lane);
  process.stdout.write(`${postArg} → lane: ${lane}\n`);
}

main().catch((err) => {
  process.stderr.write(
    `post-lane: ${err instanceof Error ? err.message : err}\n`,
  );
  process.exit(1);
});
