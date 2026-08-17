import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import type { RetroRecord } from "../analytics/lifecycle.ts";
import type { PatternReport } from "../analytics/patterns.ts";
import { walkMarkdown } from "../shared/fs.ts";
import {
  CONFIDENCE_FLOORS,
  type Confidence,
  KIND_DIRECTORIES,
  type WikiPage,
  isConfidence,
  isPageKind,
} from "./schema.ts";

export type Severity = "error" | "warning";

export type Finding = {
  check: string;
  severity: Severity;
  page: string;
  message: string;
};

export type LintInput = {
  pages: WikiPage[];
  report: PatternReport;
  /** Repo-relative paths of every file under posts/. */
  postFiles: Set<string>;
  /** Raw text of every skill file, keyed by repo-relative path. */
  skillFiles: Map<string, string>;
  /** Raw text of wiki/log.md, if present. */
  logRaw: string | null;
  /** Retros and postmortems, for ingest debt and missing-page detection. */
  retros: RetroRecord[];
};

const REQUIRED_KEYS = ["page", "kind", "title", "last_revised"] as const;

// Pages that are pure navigation carry no claims, so the evidence and
// freshness checks do not apply to them.
const NAVIGATION_KINDS = new Set(["index"]);

export function lintWiki(input: LintInput): Finding[] {
  const findings: Finding[] = [];
  const { pages, report } = input;

  for (const page of pages) {
    findings.push(...checkSchema(page));
    findings.push(...checkCitations(page, input.postFiles));
    findings.push(...checkNumerics(page, report));
    findings.push(...checkConfidence(page));
    findings.push(...checkFreshness(page, report));
    findings.push(...checkLooseNumbers(page));
    findings.push(...checkLogEntry(page, input.logRaw));
  }

  findings.push(...checkDanglingWikiPaths(input.skillFiles, pages));
  findings.push(...checkOrphans(pages));
  findings.push(...checkInboundLinks(pages));
  findings.push(...checkLogFormat(input.logRaw));
  findings.push(...checkIngestDebt(input.retros));
  findings.push(...checkMissingPages(input.retros, pages));

  return findings.sort(
    (a, b) =>
      Number(b.severity === "error") - Number(a.severity === "error") ||
      a.page.localeCompare(b.page) ||
      a.check.localeCompare(b.check),
  );
}

function checkSchema(page: WikiPage): Finding[] {
  const out: Finding[] = [];
  const fm = page.frontmatter;
  const fail = (message: string, check = "schema"): void => {
    out.push({ check, severity: "error", page: page.repoPath, message });
  };

  if (page.slug === "log") return out;

  for (const key of REQUIRED_KEYS) {
    if (fm[key] === undefined || fm[key] === null || fm[key] === "") {
      fail(`missing required frontmatter key \`${key}\``);
    }
  }

  if (fm.page !== undefined && fm.page !== page.slug) {
    fail(`\`page: ${String(fm.page)}\` does not match its path (${page.slug})`);
  }

  if (fm.kind !== undefined && !isPageKind(fm.kind)) {
    fail(`unknown \`kind: ${String(fm.kind)}\``);
  } else if (isPageKind(fm.kind)) {
    const expectedDir = KIND_DIRECTORIES[fm.kind];
    if (expectedDir && !page.slug.startsWith(`${expectedDir}/`)) {
      fail(`\`kind: ${fm.kind}\` belongs under wiki/${expectedDir}/`);
    }
  }

  if (fm.confidence !== undefined && !isConfidence(fm.confidence)) {
    fail(`unknown \`confidence: ${String(fm.confidence)}\``);
  }

  if (fm.last_revised !== undefined && !isIsoDate(fm.last_revised)) {
    fail("`last_revised` must be a YYYY-MM-DD date");
  }

  return out;
}

function checkCitations(page: WikiPage, postFiles: Set<string>): Finding[] {
  const out: Finding[] = [];
  for (const cited of page.citedPosts) {
    if (!postFiles.has(cited)) {
      out.push({
        check: "broken-citation",
        severity: "error",
        page: page.repoPath,
        message: `cites \`${cited}\`, which does not exist under posts/`,
      });
    }
  }

  // Drafts, ideas and retros are gitignored, so a claim resting on one cannot
  // be checked from a fresh clone.
  const unverifiable = collectIgnoredPaths(page.frontmatter);
  for (const path of unverifiable) {
    out.push({
      check: "unverifiable-citation",
      severity: "warning",
      page: page.repoPath,
      message: `cites \`${path}\`, which is gitignored and unverifiable in a fresh clone`,
    });
  }

  return out;
}

/**
 * Recompute every statistic the page claims from the posts it cites. This is
 * what keeps a hand-written page honest: the numbers in frontmatter are a
 * summary of `evidence_posts`, so they can be derived rather than trusted.
 */
function checkNumerics(page: WikiPage, report: PatternReport): Finding[] {
  const out: Finding[] = [];
  const byFile = new Map(
    report.postIndex.map((entry) => [
      relative(process.cwd(), entry.file),
      entry,
    ]),
  );

  const groups = collectStatGroups(page.frontmatter);
  for (const group of groups) {
    const impressions = group.posts
      .map((path) => byFile.get(path)?.impressions)
      .filter((value): value is number => typeof value === "number")
      .sort((a, b) => a - b);
    if (impressions.length === 0) continue;

    const actual: Record<string, number> = {
      observed_n: impressions.length,
      observed_median: median(impressions),
      observed_min: impressions[0] ?? 0,
      observed_max: impressions[impressions.length - 1] ?? 0,
    };

    for (const [key, expected] of Object.entries(actual)) {
      const claimed = group.claims[key];
      if (typeof claimed !== "number") continue;
      if (claimed !== expected) {
        out.push({
          check: "stale-numeric",
          severity: "error",
          page: page.repoPath,
          message: `${group.label}: \`${key}: ${claimed}\` but the cited posts give ${expected}`,
        });
      }
    }
  }

  return out;
}

function checkConfidence(page: WikiPage): Finding[] {
  const fm = page.frontmatter;
  if (!isConfidence(fm.confidence)) return [];
  const evidenceN = fm.evidence_n;
  if (typeof evidenceN !== "number") {
    return [
      {
        check: "confidence-evidence",
        severity: "error",
        page: page.repoPath,
        message: `\`confidence: ${fm.confidence}\` with no \`evidence_n\` to support it`,
      },
    ];
  }

  const floor = CONFIDENCE_FLOORS[fm.confidence as Confidence];
  if (evidenceN < floor) {
    return [
      {
        check: "confidence-evidence",
        severity: "error",
        page: page.repoPath,
        message: `\`confidence: ${fm.confidence}\` needs evidence_n >= ${floor}, has ${evidenceN}`,
      },
    ];
  }

  // A claim never tested against a miss is weaker than it looks.
  if (evidenceN >= 5 && page.counterPosts.length === 0) {
    const declared = page.frontmatter.counter_posts;
    if (
      declared === undefined ||
      (Array.isArray(declared) && declared.length === 0)
    ) {
      return [
        {
          check: "no-counter-evidence",
          severity: "warning",
          page: page.repoPath,
          message: `evidence_n ${evidenceN} with no \`counter_posts\` — the claim has never been tested against a miss`,
        },
      ];
    }
  }

  return [];
}

function checkFreshness(page: WikiPage, report: PatternReport): Finding[] {
  const out: Finding[] = [];
  const fm = page.frontmatter;
  if (NAVIGATION_KINDS.has(String(fm.kind))) return out;

  const covered = fm.posts_covered;
  if (typeof covered === "number") {
    const behind = report.corpus.total - covered;
    if (behind > 10) {
      out.push({
        check: "stale-fingerprint",
        severity: "error",
        page: page.repoPath,
        message: `\`posts_covered: ${covered}\` is ${behind} posts behind the corpus (${report.corpus.total}) — revise the page`,
      });
    } else if (behind > 0) {
      out.push({
        check: "stale-fingerprint",
        severity: "warning",
        page: page.repoPath,
        message: `\`posts_covered: ${covered}\` is ${behind} behind the corpus (${report.corpus.total})`,
      });
    }
  }

  const claimedMedian = fm.corpus_median_at_revision;
  if (
    typeof claimedMedian === "number" &&
    claimedMedian !== report.corpus.medianImpressions
  ) {
    out.push({
      check: "stale-fingerprint",
      severity: "warning",
      page: page.repoPath,
      message: `\`corpus_median_at_revision: ${claimedMedian}\` but the corpus median is now ${report.corpus.medianImpressions}`,
    });
  }

  return out;
}

/**
 * A number in prose that has no frontmatter twin cannot be recomputed, so it
 * drifts unnoticed — the failure that left "55 impressions" wrong in six
 * places across three skill files.
 */
function checkLooseNumbers(page: WikiPage): Finding[] {
  // The index is navigation and the log is a historical record; neither makes
  // live claims, so their numbers are not expected to track the corpus.
  if (page.slug === "log") return [];
  if (NAVIGATION_KINDS.has(String(page.frontmatter.kind))) return [];

  const known = new Set<string>();
  const collect = (node: unknown): void => {
    if (typeof node === "number") {
      known.add(String(node));
      known.add(node.toLocaleString("en-US"));
      return;
    }
    if (typeof node === "string") {
      for (const match of node.matchAll(/\d[\d,]*/g)) {
        known.add(match[0]);
        known.add(match[0].replace(/,/g, ""));
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) collect(item);
      return;
    }
    if (node && typeof node === "object") {
      for (const item of Object.values(node)) collect(item);
    }
  };
  collect(page.frontmatter);

  const loose = new Set<string>();
  const body = page.body.replace(/`[^`]*`/g, " ").replace(/\|/g, " ");
  for (const match of body.matchAll(/\b\d[\d,]*\b/g)) {
    const raw = match[0];
    const bare = raw.replace(/,/g, "");
    if (Number(bare) < 100) continue;
    // Calendar years are prose, not claims about the corpus.
    if (/^(19|20)\d{2}$/.test(bare)) continue;
    if (known.has(raw) || known.has(bare)) continue;
    loose.add(raw);
  }

  if (loose.size === 0) return [];
  return [
    {
      check: "loose-number",
      severity: "warning",
      page: page.repoPath,
      message: `body cites ${[...loose].join(", ")} with no frontmatter twin — cannot be rechecked`,
    },
  ];
}

function checkLogEntry(page: WikiPage, logRaw: string | null): Finding[] {
  if (page.slug === "log" || logRaw === null) return [];
  const revised = page.frontmatter.last_revised;
  if (!isIsoDate(revised)) return [];

  const entries = logRaw
    .split("\n")
    .filter((line) => line.startsWith(`## [${String(revised)}]`));
  const block = blockFor(logRaw, String(revised));
  const named = block.includes(page.repoPath) || block.includes(page.slug);

  if (entries.length === 0 || !named) {
    return [
      {
        check: "log-completeness",
        severity: "error",
        page: page.repoPath,
        message: `\`last_revised: ${String(revised)}\` has no wiki/log.md entry naming this page`,
      },
    ];
  }
  return [];
}

function checkLogFormat(logRaw: string | null): Finding[] {
  if (logRaw === null) return [];
  const out: Finding[] = [];
  const headings = [...logRaw.matchAll(/^## \[(\d{4}-\d{2}-\d{2})\][^\n]*$/gm)];
  for (const heading of headings) {
    const block = blockFor(logRaw, heading[1] ?? "", heading.index ?? 0);
    if (!/^\s*-\s*contradicted:/m.test(block)) {
      out.push({
        check: "log-completeness",
        severity: "error",
        page: "wiki/log.md",
        message: `entry "${(heading[0] ?? "").trim()}" has no \`contradicted:\` line — an ingest must state what it overwrote, even if nothing`,
      });
    }
  }
  return out;
}

/**
 * A skill pointing at a wiki page that does not exist is a silent no-op: the
 * skill reads nothing and falls back to whatever it remembers.
 */
function checkDanglingWikiPaths(
  skillFiles: Map<string, string>,
  pages: WikiPage[],
): Finding[] {
  const existing = new Set(pages.map((page) => page.repoPath));
  const out: Finding[] = [];
  for (const [file, raw] of skillFiles) {
    const referenced = new Set(
      [...raw.matchAll(/\bwiki\/[A-Za-z0-9._/-]*\.md\b/g)].map((m) => m[0]),
    );
    for (const ref of referenced) {
      if (!existing.has(ref)) {
        out.push({
          check: "dangling-wiki-path",
          severity: "error",
          page: file,
          message: `references \`${ref}\`, which does not exist`,
        });
      }
    }
  }
  return out;
}

/**
 * A page nothing links to is unreachable by browsing, and the connections
 * between pages carry as much of the knowledge as the pages do. The index
 * listing is a catalog, not a cross-reference, so it does not count here.
 */
function checkInboundLinks(pages: WikiPage[]): Finding[] {
  if (pages.length < 2) return [];
  const out: Finding[] = [];

  for (const page of pages) {
    if (page.slug === "index" || page.slug === "log") continue;
    const linked = pages.some((other) => {
      if (other.slug === page.slug || other.slug === "index") return false;
      const wikilink = new RegExp(
        `\\[\\[${escapeRegExp(page.slug)}(\\|[^\\]]*)?\\]\\]`,
      );
      return (
        wikilink.test(other.body) ||
        other.body.includes(`](${page.slug}.md)`) ||
        other.body.includes(page.repoPath)
      );
    });
    if (!linked) {
      out.push({
        check: "no-inbound-links",
        severity: "warning",
        page: page.repoPath,
        message:
          "no other wiki page links to it — add a [[wikilink]] from a related page",
      });
    }
  }
  return out;
}

/**
 * Lessons sitting in retros with `wiki_ingested: false` have not reached any
 * consumer: `post-patterns` surfaces only a retro's decision and summary, and
 * caps summaries at three per decision, so unabsorbed conclusions silently
 * expire as the retro count grows.
 */
function checkIngestDebt(retros: RetroRecord[]): Finding[] {
  const pending = retros.filter(
    (retro) => retro.wikiCandidate && !retro.wikiIngested,
  );
  if (pending.length === 0) return [];

  const severity: Severity = pending.length > 10 ? "error" : "warning";
  if (pending.length <= 3 && severity === "warning") {
    return [
      {
        check: "ingest-debt",
        severity: "warning",
        page: "wiki/log.md",
        message: `${pending.length} retro lesson(s) not yet absorbed into the wiki — run wiki-curator ingest`,
      },
    ];
  }
  return [
    {
      check: "ingest-debt",
      severity,
      page: "wiki/log.md",
      message: `${pending.length} retro lessons not yet absorbed into the wiki (${pending
        .slice(0, 3)
        .map((r) => relative(process.cwd(), r.file))
        .join(
          ", ",
        )}${pending.length > 3 ? ", …" : ""}) — run wiki-curator ingest`,
    },
  ];
}

/**
 * A retro pointing its lesson at a page that does not exist names a concept
 * the wiki is missing. Karpathy's lint calls this out explicitly: important
 * concepts mentioned but lacking their own page.
 */
function checkMissingPages(
  retros: RetroRecord[],
  pages: WikiPage[],
): Finding[] {
  const existing = new Set(pages.map((page) => page.slug));
  const wanted = new Map<string, string[]>();

  for (const retro of retros) {
    if (!retro.wikiCandidate) continue;
    for (const slug of retro.wikiPages ?? []) {
      if (existing.has(slug)) continue;
      const seen = wanted.get(slug) ?? [];
      seen.push(relative(process.cwd(), retro.file));
      wanted.set(slug, seen);
    }
  }

  return [...wanted.entries()].map(([slug, sources]) => ({
    check: "missing-page",
    severity: "warning" as Severity,
    page: `wiki/${slug}.md`,
    message: `${sources.length} retro(s) route a lesson here but the page does not exist (${sources.slice(0, 2).join(", ")}) — create it or redirect the lesson`,
  }));
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checkOrphans(pages: WikiPage[]): Finding[] {
  const index = pages.find((page) => page.slug === "index");
  if (!index) return [];
  const out: Finding[] = [];
  for (const page of pages) {
    if (page.slug === "index" || page.slug === "log") continue;
    if (!index.body.includes(`${page.slug}.md`)) {
      out.push({
        check: "orphan",
        severity: "warning",
        page: page.repoPath,
        message: "not listed in wiki/index.md",
      });
    }
  }
  return out;
}

type StatGroup = {
  label: string;
  posts: string[];
  claims: Record<string, unknown>;
};

/**
 * Find every frontmatter object that both cites posts and claims statistics
 * about them. Works for a page-level `evidence_posts` block and for nested
 * per-tier or per-instance groups alike.
 */
function collectStatGroups(frontmatter: Record<string, unknown>): StatGroup[] {
  const groups: StatGroup[] = [];
  const visit = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    const posts = collectPostsShallow(record);
    const hasClaims = Object.keys(record).some((key) =>
      key.startsWith("observed_"),
    );
    if (posts.length > 0 && hasClaims) {
      groups.push({
        label: String(record.id ?? record.page ?? (path || "page")),
        posts,
        claims: record,
      });
    }

    for (const [key, value] of Object.entries(record)) {
      visit(value, path ? `${path}.${key}` : key);
    }
  };

  const posts = collectPostsShallow(frontmatter);
  const hasClaims = Object.keys(frontmatter).some((key) =>
    key.startsWith("observed_"),
  );
  if (posts.length > 0 && hasClaims) {
    groups.push({
      label: String(frontmatter.page ?? "page"),
      posts,
      claims: frontmatter,
    });
  }
  for (const [key, value] of Object.entries(frontmatter)) visit(value, key);

  return groups;
}

/** Post paths owned by this object: its own fields and its exemplar list, but
 * not those of a nested sibling group. */
function collectPostsShallow(record: Record<string, unknown>): string[] {
  const out: string[] = [];
  const take = (value: unknown): void => {
    if (typeof value === "string" && /^posts\/.*\.md$/.test(value.trim())) {
      out.push(value.trim());
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") take(item);
        else if (item && typeof item === "object") {
          const post = (item as Record<string, unknown>).post;
          if (typeof post === "string") take(post);
        }
      }
    }
  };
  for (const [key, value] of Object.entries(record)) {
    if (key === "counter_posts") continue;
    take(value);
  }
  return [...new Set(out)];
}

function collectIgnoredPaths(value: unknown): string[] {
  const found: string[] = [];
  const visit = (node: unknown): void => {
    if (typeof node === "string") {
      if (/^(drafts|ideas|retros)\/.*\.md$/.test(node.trim()))
        found.push(node.trim());
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (node && typeof node === "object") {
      for (const item of Object.values(node)) visit(item);
    }
  };
  visit(value);
  return [...new Set(found)];
}

function blockFor(raw: string, date: string, fromIndex = 0): string {
  const start =
    fromIndex > 0 ? fromIndex : raw.indexOf(`## [${date}]`, fromIndex);
  if (start === -1) return "";
  const next = raw.indexOf("\n## ", start + 1);
  return raw.slice(start, next === -1 ? raw.length : next);
}

function isIsoDate(value: unknown): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

export async function loadPostFileSet(): Promise<Set<string>> {
  const files = await walkMarkdown(resolve(process.cwd(), "posts"));
  return new Set(files.map((file) => relative(process.cwd(), file)));
}

export async function loadSkillFiles(): Promise<Map<string, string>> {
  const files = await walkMarkdown(resolve(process.cwd(), ".agents"));
  const out = new Map<string, string>();
  for (const file of files) {
    out.set(relative(process.cwd(), file), await readFile(file, "utf8"));
  }
  return out;
}

export async function loadLogRaw(): Promise<string | null> {
  try {
    return await readFile(resolve(process.cwd(), "wiki/log.md"), "utf8");
  } catch {
    return null;
  }
}
