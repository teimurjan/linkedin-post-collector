import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import matter from "gray-matter";
import { walkMarkdown } from "../shared/fs.ts";

export type TopicFamily =
  | "ai"
  | "agents"
  | "frontend"
  | "security"
  | "oss"
  | "product"
  | "event"
  | "career"
  | "other";

export type SourceType =
  | "news"
  | "build_log"
  | "experiment"
  | "opinion"
  | "launch"
  | "article";

export type HookType =
  | "announcement"
  | "claim"
  | "contrarian"
  | "observation"
  | "result";

export type EndingType = "question" | "takeaway" | "prediction" | "linkout";

export type IdeaStatus = "shortlisted" | "approved" | "rejected" | "drafted";

export type DraftStatus = "drafted" | "approved" | "published" | "rejected";

export type RetroDecision = "repeat" | "modify" | "block";

export type RetroKind = "retro" | "postmortem";

/**
 * Which pipeline a post belongs to. `news` posts react to an external event
 * and come out of the briefing → ideator path; `experience` posts are about
 * the owner's own work and operation and come straight from a raw thought.
 * The two are analyzed separately, so every artifact carries its lane.
 */
export type PostLane = "news" | "experience";

export const POST_LANES: readonly PostLane[] = ["news", "experience"];

/** The archive predates the lane axis; everything unlabeled was a news post. */
export const DEFAULT_LANE: PostLane = "news";

export function parsePostLane(value: unknown): PostLane | undefined {
  return oneOf<PostLane>(value, POST_LANES);
}

export type IdeaBrief = {
  ideaId: string;
  sourceUrl: string;
  sourceTitle: string;
  briefingDate: string;
  topicFamily: TopicFamily;
  sourceType: SourceType;
  angle: string;
  whyNow: string;
  opinionWedge: string;
  evidencePoints: string[];
  status: IdeaStatus;
  body: string;
  // Written by post-ideator and read by the news cycle's pick step. These were
  // absent from the round-trip, so any edit through render dropped them.
  format?: string;
  score?: number;
  experienceHook?: string;
  reachCeiling?: number;
  reachTier?: string;
  wikiRev?: string;
  risk?: string;
  lane?: PostLane;
  /** One plain sentence saying what the post is about, for the idea pick. */
  gist?: string;
};

export type DraftFrontmatter = {
  sourceUrl?: string;
  sourceTitle?: string;
  pitchAngle: string;
  briefingDate?: string;
  draftedAt: string;
  topicFamily?: TopicFamily;
  sourceType?: SourceType;
  lane?: PostLane;
  /** Experience-lane drafts name the positioning pillar they serve. */
  pillar?: string;
  hookType?: HookType;
  whyNow?: string;
  opinionWedge?: string;
  status?: DraftStatus;
  publishedUrl?: string;
  publishedAt?: string;
  impressions24h?: number;
  impressions72h?: number;
  likes72h?: number;
  comments72h?: number;
  shares72h?: number;
};

export type DraftRecord = DraftFrontmatter & {
  file: string;
  body: string;
};

export type RetroRecord = {
  kind: RetroKind;
  draftFile: string;
  sourcePost?: string;
  topicFamily: TopicFamily;
  sourceType: SourceType;
  lane?: PostLane;
  publishedUrl: string;
  publishedAt: string;
  impressions24h?: number;
  impressions72h?: number;
  likes72h?: number;
  comments72h?: number;
  shares72h?: number;
  beatMedianImpressions: boolean;
  beatPeerGroup: boolean;
  discussionValidated: boolean;
  hookMatchedBody: boolean;
  likelyFailureModes?: string[];
  decision: RetroDecision;
  summary: string;
  /** Subject tier from wiki/audience.md, recorded at run time. */
  reachTier?: string;
  /** Scrape-age cohort the post was compared against, and that cohort's median. */
  cohort?: string;
  cohortMedianAtRun?: number;
  /** The lesson as one falsifiable claim, awaiting absorption into wiki/.
   * A retro's prose reaches no consumer, so the claim has to be a field. */
  wikiCandidate?: string;
  wikiPages?: string[];
  /** False until wiki-curator has folded the claim into a wiki page. */
  wikiIngested: boolean;
  file: string;
  body: string;
};

const DRAFTS_DIR = resolve(process.cwd(), "drafts");
const RETROS_DIR = resolve(process.cwd(), "retros");

export async function loadDrafts(root = DRAFTS_DIR): Promise<DraftRecord[]> {
  const files = await walkMarkdown(root);
  const drafts: DraftRecord[] = [];
  for (const file of files) {
    const raw = await readFile(file, "utf8");
    drafts.push(parseDraft(raw, file));
  }
  return drafts;
}

export function parseDraft(raw: string, file = "draft.md"): DraftRecord {
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;

  return {
    file,
    body: parsed.content.trim(),
    sourceUrl: str(data.source_url),
    sourceTitle: str(data.source_title),
    pitchAngle: str(data.pitch_angle) ?? "",
    briefingDate: str(data.briefing_date),
    draftedAt: str(data.drafted_at) ?? "",
    topicFamily: topicFamily(data.topic_family),
    sourceType: sourceType(data.source_type),
    ...optional("lane", parsePostLane(data.lane)),
    ...optional("pillar", str(data.pillar)),
    hookType: hookType(data.hook_type),
    whyNow: str(data.why_now),
    opinionWedge: str(data.opinion_wedge),
    status: draftStatus(data.status) ?? "drafted",
    publishedUrl: str(data.published_url),
    publishedAt: str(data.published_at),
    impressions24h: num(data.impressions_24h),
    impressions72h: num(data.impressions_72h),
    likes72h: num(data.likes_72h),
    comments72h: num(data.comments_72h),
    shares72h: num(data.shares_72h),
  };
}

export function renderDraftMarkdown(
  frontmatter: DraftFrontmatter,
  body: string,
): string {
  return matter.stringify(body.trim(), {
    ...(frontmatter.sourceUrl ? { source_url: frontmatter.sourceUrl } : {}),
    ...(frontmatter.sourceTitle
      ? { source_title: frontmatter.sourceTitle }
      : {}),
    pitch_angle: frontmatter.pitchAngle,
    ...(frontmatter.briefingDate
      ? { briefing_date: frontmatter.briefingDate }
      : {}),
    drafted_at: frontmatter.draftedAt,
    ...(frontmatter.topicFamily
      ? { topic_family: frontmatter.topicFamily }
      : {}),
    ...(frontmatter.sourceType ? { source_type: frontmatter.sourceType } : {}),
    ...(frontmatter.lane ? { lane: frontmatter.lane } : {}),
    ...(frontmatter.pillar ? { pillar: frontmatter.pillar } : {}),
    ...(frontmatter.hookType ? { hook_type: frontmatter.hookType } : {}),
    ...(frontmatter.whyNow ? { why_now: frontmatter.whyNow } : {}),
    ...(frontmatter.opinionWedge
      ? { opinion_wedge: frontmatter.opinionWedge }
      : {}),
    status: frontmatter.status ?? "drafted",
    ...(frontmatter.publishedUrl
      ? { published_url: frontmatter.publishedUrl }
      : {}),
    ...(frontmatter.publishedAt
      ? { published_at: frontmatter.publishedAt }
      : {}),
    ...(frontmatter.impressions24h !== undefined
      ? { impressions_24h: frontmatter.impressions24h }
      : {}),
    ...(frontmatter.impressions72h !== undefined
      ? { impressions_72h: frontmatter.impressions72h }
      : {}),
    ...(frontmatter.likes72h !== undefined
      ? { likes_72h: frontmatter.likes72h }
      : {}),
    ...(frontmatter.comments72h !== undefined
      ? { comments_72h: frontmatter.comments72h }
      : {}),
    ...(frontmatter.shares72h !== undefined
      ? { shares_72h: frontmatter.shares72h }
      : {}),
  });
}

/**
 * Idea ledgers are written by an LLM as hand-rolled YAML, and prose values
 * routinely break the parser: a wedge that opens on a quoted phrase
 * (`opinion_wedge: "Choose boring technology" is sold as...`) reads as a
 * double-quoted scalar with trailing garbage, and a value containing a
 * colon-space reads as a nested mapping. Either one used to throw and take the
 * whole file with it — 17 of 35 ledgers on disk were unreadable, and the Post
 * Office silently showed them as empty.
 *
 * Re-emit those values as single-quoted scalars before parsing. Only
 * single-line `key: value` pairs are touched; list items, block scalars and
 * already-safe values pass through untouched.
 */
export function requoteAmbiguousScalars(frontmatter: string): string {
  return frontmatter
    .split("\n")
    .map((line) => {
      const pair = /^([ \t]*)([A-Za-z0-9_-]+):[ \t]+(.*\S)[ \t]*$/.exec(line);
      if (pair) {
        const [, indent = "", key = "", value = ""] = pair;
        if (isYamlDirective(value) || isSafePlainScalar(value)) return line;
        return `${indent}${key}: ${singleQuote(value)}`;
      }

      const item = /^([ \t]*)-[ \t]+(.*\S)[ \t]*$/.exec(line);
      if (item) {
        const [, indent = "", value = ""] = item;
        if (isYamlDirective(value)) return line;
        // `- key: value` is a nested mapping entry, not prose. Anything that
        // opens on a quote is prose no matter what follows the first colon.
        const isMappingEntry =
          /^[A-Za-z0-9_-]+:[ \t]/.test(value) && !/^["']/.test(value);
        if (isMappingEntry || isSafePlainScalar(value)) return line;
        return `${indent}- ${singleQuote(value)}`;
      }

      return line;
    })
    .join("\n");
}

function singleQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Block scalars, anchors, aliases and tags carry YAML meaning of their own. */
function isYamlDirective(value: string): boolean {
  return /^[|>&*!%@`]/.test(value);
}

function isSafePlainScalar(value: string): boolean {
  // A well-formed quoted scalar spanning the entire value is already valid.
  const quoted =
    (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
    (value.startsWith("'") && value.endsWith("'") && value.length > 1);
  if (quoted) {
    const inner = value.slice(1, -1);
    const quote = value[0] ?? '"';
    // A closing quote in the middle means the scalar ends early.
    if (!inner.includes(quote)) return true;
    if (quote === "'" && !/(^|[^'])'([^']|$)/.test(inner)) return true;
    return false;
  }
  // A plain scalar may not open with a quote, nor contain a colon-space
  // (which YAML reads as a nested key) or a trailing colon.
  if (value.startsWith('"') || value.startsWith("'")) return false;
  if (value.includes(": ") || value.endsWith(":")) return false;
  if (value.includes(" #")) return false;
  return true;
}

/**
 * Split a ledger into `---`-delimited segments and pair each frontmatter block
 * with the body that follows it. Scanning delimiters positionally used to
 * misread a file whose entries sit back-to-back (`---` immediately followed by
 * `---`, no body between): the closing and opening fences merged, and the next
 * entry's frontmatter was swallowed into the previous entry's body, losing half
 * the ideas in the file.
 */
function splitLedgerEntries(
  raw: string,
): Array<{ frontmatter: string; body: string }> {
  const segments = raw.split(/^---[ \t]*$/m);
  const out: Array<{ frontmatter: string; body: string }> = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i] ?? "";
    if (!/^[ \t]*idea_id[ \t]*:/m.test(segment)) continue;
    const next = segments[i + 1] ?? "";
    // A segment holding another entry's frontmatter is not this entry's body.
    const body = /^[ \t]*idea_id[ \t]*:/m.test(next) ? "" : next;
    out.push({ frontmatter: segment.trim(), body: body.trim() });
  }

  return out;
}

export function parseIdeaLedger(raw: string): IdeaBrief[] {
  const entries: IdeaBrief[] = [];

  for (const { frontmatter, body } of splitLedgerEntries(raw)) {
    const parsed = matter(
      `---\n${requoteAmbiguousScalars(frontmatter)}\n---\n`,
    );
    const data = parsed.data as Record<string, unknown>;
    entries.push({
      ideaId: str(data.idea_id) ?? "",
      sourceUrl: str(data.source_url) ?? "",
      sourceTitle: str(data.source_title) ?? "",
      briefingDate: str(data.briefing_date) ?? "",
      topicFamily: topicFamily(data.topic_family) ?? "other",
      sourceType: sourceType(data.source_type) ?? "opinion",
      angle: str(data.angle) ?? "",
      whyNow: str(data.why_now) ?? "",
      opinionWedge: str(data.opinion_wedge) ?? "",
      evidencePoints: stringArray(data.evidence_points),
      status: ideaStatus(data.status) ?? "shortlisted",
      body,
      ...optional("format", str(data.format)),
      ...optional("score", num(data.score)),
      ...optional("experienceHook", str(data.experience_hook)),
      ...optional("reachCeiling", num(data.reach_ceiling)),
      ...optional("reachTier", str(data.reach_tier)),
      ...optional("wikiRev", str(data.wiki_rev)),
      ...optional("risk", str(data.risk)),
      ...optional("lane", parsePostLane(data.lane)),
      ...optional("gist", str(data.gist)),
    });
  }

  return entries;
}

export function renderIdeaLedger(entries: IdeaBrief[]): string {
  return entries
    .map((entry) =>
      matter.stringify(entry.body.trim(), {
        idea_id: entry.ideaId,
        source_url: entry.sourceUrl,
        source_title: entry.sourceTitle,
        briefing_date: entry.briefingDate,
        topic_family: entry.topicFamily,
        source_type: entry.sourceType,
        ...(entry.lane !== undefined ? { lane: entry.lane } : {}),
        ...(entry.format !== undefined ? { format: entry.format } : {}),
        ...(entry.gist !== undefined ? { gist: entry.gist } : {}),
        angle: entry.angle,
        ...(entry.score !== undefined ? { score: entry.score } : {}),
        why_now: entry.whyNow,
        opinion_wedge: entry.opinionWedge,
        ...(entry.experienceHook !== undefined
          ? { experience_hook: entry.experienceHook }
          : {}),
        ...(entry.reachCeiling !== undefined
          ? { reach_ceiling: entry.reachCeiling }
          : {}),
        ...(entry.reachTier !== undefined
          ? { reach_tier: entry.reachTier }
          : {}),
        ...(entry.wikiRev !== undefined ? { wiki_rev: entry.wikiRev } : {}),
        ...(entry.risk !== undefined ? { risk: entry.risk } : {}),
        evidence_points: entry.evidencePoints,
        status: entry.status,
      }),
    )
    .join("\n");
}

export async function loadRetros(root = RETROS_DIR): Promise<RetroRecord[]> {
  const files = await walkMarkdown(root);
  const retros: RetroRecord[] = [];
  for (const file of files) {
    const raw = await readFile(file, "utf8");
    retros.push(parseRetro(raw, file));
  }
  return retros;
}

export function parseRetro(raw: string, file = "retro.md"): RetroRecord {
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const kind = retroKind(data.kind) ?? "retro";

  return {
    kind,
    draftFile: str(data.draft_file) ?? "",
    sourcePost: str(data.source_post),
    topicFamily: topicFamily(data.topic_family) ?? "other",
    sourceType: sourceType(data.source_type) ?? "opinion",
    ...optional("lane", parsePostLane(data.lane)),
    publishedUrl: str(data.published_url) ?? "",
    publishedAt: str(data.published_at) ?? "",
    impressions24h: num(data.impressions_24h),
    impressions72h: num(data.impressions_72h) ?? num(data.impressions),
    likes72h: num(data.likes_72h) ?? num(data.likes),
    comments72h: num(data.comments_72h) ?? num(data.comments),
    shares72h: num(data.shares_72h) ?? num(data.shares),
    beatMedianImpressions:
      bool(data.beat_median_impressions) || bool(data.beat_median),
    beatPeerGroup: bool(data.beat_peer_group),
    discussionValidated: bool(data.discussion_validated),
    hookMatchedBody: bool(data.hook_matched_body),
    likelyFailureModes: stringArray(data.likely_failure_modes),
    decision: retroDecision(data.decision) ?? "modify",
    summary: str(data.summary) ?? "",
    ...optional("reachTier", str(data.reach_tier)),
    ...optional("cohort", str(data.cohort)),
    ...optional("cohortMedianAtRun", num(data.cohort_median_at_run)),
    ...optional("wikiCandidate", str(data.wiki_candidate)),
    ...optional(
      "wikiPages",
      data.wiki_pages === undefined ? undefined : stringArray(data.wiki_pages),
    ),
    // Retros written before the wiki existed carry no lesson to absorb, so
    // they default to ingested rather than showing up as permanent debt.
    wikiIngested:
      data.wiki_candidate === undefined ? true : bool(data.wiki_ingested),
    file,
    body: parsed.content.trim(),
  };
}

export function renderRetroMarkdown(
  retro: Omit<RetroRecord, "file" | "body"> & { body?: string },
) {
  return matter.stringify(
    [
      "## Assessment",
      "",
      `- Beat ${retro.cohort ? `${retro.cohort} cohort` : "median"} impressions: ${retro.beatMedianImpressions ? "yes" : "no"}`,
      ...(retro.reachTier ? [`- Subject tier: ${retro.reachTier}`] : []),
      `- Beat similar ${retro.topicFamily} + ${retro.sourceType} posts: ${retro.beatPeerGroup ? "yes" : "no"}`,
      `- Comments validated intended discussion angle: ${retro.discussionValidated ? "yes" : "no"}`,
      `- Hook matched body: ${retro.hookMatchedBody ? "yes" : "no"}`,
      "",
      "## Decision",
      "",
      retro.body?.trim() ?? "",
    ]
      .filter(Boolean)
      .join("\n"),
    {
      draft_file: retro.draftFile,
      topic_family: retro.topicFamily,
      source_type: retro.sourceType,
      ...(retro.lane !== undefined ? { lane: retro.lane } : {}),
      published_url: retro.publishedUrl,
      published_at: retro.publishedAt,
      ...(retro.impressions24h !== undefined
        ? { impressions_24h: retro.impressions24h }
        : {}),
      ...(retro.impressions72h !== undefined
        ? { impressions_72h: retro.impressions72h }
        : {}),
      ...(retro.likes72h !== undefined ? { likes_72h: retro.likes72h } : {}),
      ...(retro.comments72h !== undefined
        ? { comments_72h: retro.comments72h }
        : {}),
      ...(retro.shares72h !== undefined ? { shares_72h: retro.shares72h } : {}),
      beat_median_impressions: retro.beatMedianImpressions,
      beat_peer_group: retro.beatPeerGroup,
      discussion_validated: retro.discussionValidated,
      hook_matched_body: retro.hookMatchedBody,
      ...(retro.reachTier !== undefined ? { reach_tier: retro.reachTier } : {}),
      ...(retro.cohort !== undefined ? { cohort: retro.cohort } : {}),
      ...(retro.cohortMedianAtRun !== undefined
        ? { cohort_median_at_run: retro.cohortMedianAtRun }
        : {}),
      decision: retro.decision,
      summary: retro.summary,
      ...(retro.wikiCandidate !== undefined
        ? {
            wiki_candidate: retro.wikiCandidate,
            wiki_pages: retro.wikiPages ?? [],
            wiki_ingested: retro.wikiIngested,
          }
        : {}),
    },
  );
}

export function inferDraftDate(file: string): string | null {
  const match = basename(file).match(/^(\d{4}-\d{2}-\d{2})-/);
  return match?.[1] ?? null;
}

/** Include a key only when its value survived parsing, so an absent field
 * stays absent through a parse/render round-trip rather than becoming null. */
function optional<K extends string, V>(
  key: K,
  value: V | undefined,
): Record<K, V> | Record<string, never> {
  return value === undefined ? {} : ({ [key]: value } as Record<K, V>);
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function bool(value: unknown): boolean {
  return value === true;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function topicFamily(value: unknown): TopicFamily | undefined {
  return oneOf<TopicFamily>(value, [
    "ai",
    "agents",
    "frontend",
    "security",
    "oss",
    "product",
    "event",
    "career",
    "other",
  ]);
}

function sourceType(value: unknown): SourceType | undefined {
  return oneOf<SourceType>(value, [
    "news",
    "build_log",
    "experiment",
    "opinion",
    "launch",
    "article",
  ]);
}

function hookType(value: unknown): HookType | undefined {
  return oneOf<HookType>(value, [
    "announcement",
    "claim",
    "contrarian",
    "observation",
    "result",
  ]);
}

function ideaStatus(value: unknown): IdeaStatus | undefined {
  return oneOf<IdeaStatus>(value, [
    "shortlisted",
    "approved",
    "rejected",
    "drafted",
  ]);
}

function draftStatus(value: unknown): DraftStatus | undefined {
  return oneOf<DraftStatus>(value, [
    "drafted",
    "approved",
    "published",
    "rejected",
  ]);
}

function retroDecision(value: unknown): RetroDecision | undefined {
  return oneOf<RetroDecision>(value, ["repeat", "modify", "block"]);
}

function retroKind(value: unknown): RetroKind | undefined {
  return oneOf<RetroKind>(value, ["retro", "postmortem"]);
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : undefined;
}
