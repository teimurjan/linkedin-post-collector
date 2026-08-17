import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadPosts } from "../../analytics/analyze.ts";
import { loadRetros } from "../../analytics/lifecycle.ts";
import { analyzePostPatterns } from "../../analytics/patterns.ts";
import {
  type Finding,
  lintWiki,
  loadLogRaw,
  loadPostFileSet,
  loadSkillFiles,
} from "../lint.ts";
import { type WikiPage, loadWikiPages } from "../schema.ts";

const CATALOG_BEGIN = "<!-- BEGIN catalog -->";
const CATALOG_END = "<!-- END catalog -->";

async function runLint(): Promise<number> {
  const [pages, posts, retros, postFiles, skillFiles, logRaw] =
    await Promise.all([
      loadWikiPages(),
      loadPosts(),
      loadRetros(),
      loadPostFileSet(),
      loadSkillFiles(),
      loadLogRaw(),
    ]);

  if (pages.length === 0) {
    process.stdout.write("No wiki pages found under wiki/. Nothing to lint.\n");
    return 0;
  }

  const report = analyzePostPatterns(posts, retros);
  const findings = lintWiki({
    pages,
    report,
    postFiles,
    skillFiles,
    logRaw,
    retros,
  });

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");

  for (const finding of findings) {
    const label = finding.severity === "error" ? "error" : "warn ";
    process.stdout.write(
      `${label} ${finding.page} [${finding.check}] ${finding.message}\n`,
    );
  }

  process.stdout.write(
    `\n${pages.length} page(s) checked · ${errors.length} error(s) · ${warnings.length} warning(s)\n`,
  );
  return errors.length > 0 ? 1 : 0;
}

async function runIndex(): Promise<number> {
  const pages = await loadWikiPages();
  const indexPath = resolve(process.cwd(), "wiki/index.md");
  let raw: string;
  try {
    raw = await readFile(indexPath, "utf8");
  } catch {
    process.stderr.write("wiki/index.md not found.\n");
    return 1;
  }

  const start = raw.indexOf(CATALOG_BEGIN);
  const end = raw.indexOf(CATALOG_END);
  if (start === -1 || end === -1 || end < start) {
    process.stderr.write(
      `wiki/index.md is missing the ${CATALOG_BEGIN} / ${CATALOG_END} markers.\n`,
    );
    return 1;
  }

  const rows = pages
    .filter((page) => page.slug !== "index" && page.slug !== "log")
    .map((page) => renderRow(page));

  const table = [
    "| Page | Kind | Confidence | Evidence | Covers | Revised |",
    "|---|---|---|---|---|---|",
    ...(rows.length > 0 ? rows : ["| _(none yet)_ | | | | | |"]),
  ].join("\n");

  const next = `${raw.slice(0, start + CATALOG_BEGIN.length)}\n${table}\n${raw.slice(end)}`;
  await writeFile(indexPath, next);
  process.stdout.write(
    `Updated wiki/index.md catalog (${rows.length} page(s)).\n`,
  );
  return 0;
}

function renderRow(page: WikiPage): string {
  const fm = page.frontmatter;
  const cell = (value: unknown, fallback = "—"): string =>
    value === undefined || value === null || value === ""
      ? fallback
      : String(value);
  const evidence =
    typeof fm.evidence_n === "number" ? `n=${fm.evidence_n}` : "—";
  const covers =
    typeof fm.posts_covered === "number" ? `${fm.posts_covered} posts` : "—";
  return `| [${page.slug}](${page.slug}.md) | ${cell(fm.kind)} | ${cell(fm.confidence)} | ${evidence} | ${covers} | ${cell(fm.last_revised)} |`;
}

function usage(): void {
  process.stdout.write(
    [
      "Usage: bun run wiki <command>",
      "",
      "  lint    Check every wiki page against the corpus and the skills.",
      "          Exits 1 on any error, 0 when only warnings remain.",
      "  index   Regenerate the catalog table in wiki/index.md.",
      "",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === "lint") {
    process.exit(await runLint());
  }
  if (command === "index") {
    process.exit(await runIndex());
  }
  usage();
  process.exit(command === undefined || command === "--help" ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
