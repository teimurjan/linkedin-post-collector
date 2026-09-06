import { rm } from "node:fs/promises";
import { join } from "node:path";
import {
  CLEANUP_DIRS,
  type CleanupPlan,
  collectDatedEntries,
  cutoffDate,
  findRetroPendingDrafts,
  planCleanup,
} from "../cleanup.ts";

const DEFAULT_DAYS = 3;

type Args = { days: number; dryRun: boolean };
type ArgsResult = { ok: true; args: Args } | { ok: false; error: string };

function parseArgs(argv: string[]): ArgsResult {
  let days = DEFAULT_DAYS;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--days") {
      days = Number(argv[++i]);
    } else {
      return { ok: false, error: `Unknown option: ${arg}` };
    }
  }
  if (!Number.isInteger(days) || days < 1) {
    return { ok: false, error: "--days takes a positive integer." };
  }
  return { ok: true, args: { days, dryRun } };
}

function render(plan: CleanupPlan, args: Args): string {
  const lines: string[] = [];
  const verb = args.dryRun ? "Would keep" : "Keeping";
  lines.push(
    `${verb} ${plan.cutoff} and newer (last ${args.days} day${args.days === 1 ? "" : "s"}).\n`,
  );

  for (const { dir } of CLEANUP_DIRS) {
    const remove = plan.remove.filter((entry) => entry.dir === dir);
    const kept = plan.keep.filter((entry) => entry.dir === dir);
    lines.push(`${dir}/ — ${remove.length} to remove, ${kept.length} kept`);
    for (const entry of remove) lines.push(`  ${entry.name}`);
  }

  const held = plan.keep.filter((entry) => entry.reason === "retro_pending");
  if (held.length > 0) {
    lines.push("\nHeld back — published, retro not written yet:");
    for (const entry of held) lines.push(`  ${entry.path}`);
  }

  const files = plan.remove.filter((entry) => entry.kind === "file").length;
  const dirs = plan.remove.length - files;
  const done = args.dryRun ? "Would remove" : "Removed";
  lines.push(`\n${done} ${files} file(s) and ${dirs} directory(ies).`);
  return `${lines.join("\n")}\n`;
}

function usage(): void {
  process.stdout.write(
    [
      "Usage: bun run cleanup [--days N] [--dry-run]",
      "",
      "  Removes cycle working files older than the retention window from",
      `  ${CLEANUP_DIRS.map((d) => `${d.dir}/`).join(", ")}. Never touches posts/,`,
      "  concepts/, retros/ or wiki/, and never removes a draft whose published",
      "  post is still waiting on its retro.",
      "",
      `  --days N    Keep the last N days, today included (default ${DEFAULT_DAYS}).`,
      "  --dry-run   Print the plan without deleting anything.",
      "",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    usage();
    process.exit(0);
  }

  const parsed = parseArgs(argv);
  if (!parsed.ok) {
    process.stderr.write(`${parsed.error}\n\n`);
    usage();
    process.exit(1);
  }

  const root = process.cwd();
  const [entries, retroPending] = await Promise.all([
    collectDatedEntries(root),
    findRetroPendingDrafts(root),
  ]);
  const plan = planCleanup(
    entries,
    cutoffDate(new Date(), parsed.args.days),
    retroPending,
  );

  if (!parsed.args.dryRun) {
    for (const entry of plan.remove) {
      await rm(join(root, entry.path), { recursive: true, force: true });
    }
  }
  process.stdout.write(render(plan, parsed.args));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
