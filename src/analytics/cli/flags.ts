import { POST_LANES, type PostLane, parsePostLane } from "../lifecycle.ts";

/**
 * `--lane news|experience` scopes a report to one pipeline. Returns
 * `undefined` when the flag is absent (whole archive) and throws on a value
 * outside the known lanes, so a typo cannot silently widen the scope.
 */
export function laneFlag(argv: string[]): PostLane | undefined {
  const index = argv.indexOf("--lane");
  if (index === -1) return undefined;
  const raw = argv[index + 1];
  const lane = parsePostLane(raw);
  if (!lane) {
    throw new Error(
      `--lane must be one of ${POST_LANES.join("|")}, got ${JSON.stringify(raw ?? "")}`,
    );
  }
  return lane;
}
