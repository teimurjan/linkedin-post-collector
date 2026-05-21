import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import matter from "gray-matter";
import { walkMarkdown } from "./fs.ts";

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
};

export type DraftFrontmatter = {
  sourceUrl?: string;
  sourceTitle?: string;
  pitchAngle: string;
  briefingDate?: string;
  draftedAt: string;
  topicFamily?: TopicFamily;
  sourceType?: SourceType;
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
  draftFile: string;
  topicFamily: TopicFamily;
  sourceType: SourceType;
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
  decision: RetroDecision;
  summary: string;
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

export function parseIdeaLedger(raw: string): IdeaBrief[] {
  const entries: IdeaBrief[] = [];
  let cursor = 0;

  while (cursor < raw.length) {
    const start = raw.indexOf("---\n", cursor);
    if (start === -1) break;
    const frontmatterEnd = raw.indexOf("\n---\n", start + 4);
    if (frontmatterEnd === -1) break;

    const frontmatter = raw.slice(start + 4, frontmatterEnd);
    const contentStart = frontmatterEnd + "\n---\n".length;
    const nextEntry = raw.indexOf("\n---\n", contentStart);
    const body = raw
      .slice(contentStart, nextEntry === -1 ? raw.length : nextEntry)
      .trim();
    const parsed = matter(`---\n${frontmatter}\n---\n`);
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
    });

    cursor = nextEntry === -1 ? raw.length : nextEntry + 1;
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
        angle: entry.angle,
        why_now: entry.whyNow,
        opinion_wedge: entry.opinionWedge,
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

  return {
    draftFile: str(data.draft_file) ?? "",
    topicFamily: topicFamily(data.topic_family) ?? "other",
    sourceType: sourceType(data.source_type) ?? "opinion",
    publishedUrl: str(data.published_url) ?? "",
    publishedAt: str(data.published_at) ?? "",
    impressions24h: num(data.impressions_24h),
    impressions72h: num(data.impressions_72h),
    likes72h: num(data.likes_72h),
    comments72h: num(data.comments_72h),
    shares72h: num(data.shares_72h),
    beatMedianImpressions: bool(data.beat_median_impressions),
    beatPeerGroup: bool(data.beat_peer_group),
    discussionValidated: bool(data.discussion_validated),
    hookMatchedBody: bool(data.hook_matched_body),
    decision: retroDecision(data.decision) ?? "modify",
    summary: str(data.summary) ?? "",
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
      `- Beat median impressions: ${retro.beatMedianImpressions ? "yes" : "no"}`,
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
      decision: retro.decision,
      summary: retro.summary,
    },
  );
}

export function inferDraftDate(file: string): string | null {
  const match = basename(file).match(/^(\d{4}-\d{2}-\d{2})-/);
  return match?.[1] ?? null;
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

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : undefined;
}
