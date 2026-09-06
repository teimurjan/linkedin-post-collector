// Maps each of the six pipeline stages to its latest real markdown artifact, so
// the office shows what's actually in the repo. Pure-ish: the only side effect is
// reading files through the existing loaders — nothing here mutates state.

import { readFile, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
  type PostRecord,
  corpusStats,
  loadPosts,
  topByImpressions,
} from "../../analytics/analyze.ts";
import {
  type DraftRecord,
  type IdeaBrief,
  loadDrafts,
  loadRetros,
  parseIdeaLedger,
} from "../../analytics/lifecycle.ts";
import { walkMarkdown } from "../../shared/fs.ts";
import { type AgentId, type OfficeState, readOfficeState } from "./state.ts";

const ROOT = process.cwd();
const RESPONSE_LIMIT = 2000;

type Latest = {
  file: string | null;
  title: string;
  updatedAt: string | null;
  response: string;
} | null;

export type AgentMeta = {
  id: AgentId;
  name: string;
  role: string;
  blurb: string;
  currentInstruction: string;
};

// Static identity per stage — mirrors the prototype's AGENTS array. The live
// artifact (`latest`) and `runtime` are attached at request time.
const AGENT_META: AgentMeta[] = [
  {
    id: "analyst",
    name: "Analyst",
    role: "reviews past performance",
    blurb:
      "Reads the retros and postmortems — what landed, what flopped — and sets the bar for today.",
    currentInstruction:
      "# post-retro\nRead retros/ and the corpus. Surface what to repeat and what to avoid, and set today's bar.",
  },
  {
    id: "scout",
    name: "Scout",
    role: "gathers the morning briefing",
    blurb:
      "Sweeps Hacker News, Lobsters, RSS and Exa for what's actually moving today.",
    currentInstruction:
      "# topics-briefing\nMerge HN + Lobsters + RSS + Exa from the last 7 days, dedupe, bucket by recency.",
  },
  {
    id: "ideator",
    name: "Ideator",
    role: "brainstorms scored angles",
    blurb:
      "Turns the briefing into post angles, each scored on heat, specificity, and fit.",
    currentInstruction:
      "# post-ideator\nScore angles on heat, specificity, differentiation, builder fit, discussion potential.",
  },
  {
    id: "writer",
    name: "Writer",
    role: "drafts the post in the owner's voice",
    blurb:
      "Takes the winning angle and writes the actual post — hook, body, no fluff.",
    currentInstruction:
      "# post-writer\nDraft from one approved brief in the owner's voice. Hook first, one idea, no fluff.",
  },
  {
    id: "illustrator",
    name: "Illustrator",
    role: "designs the cover image prompt",
    blurb:
      "Drafts three sketch-on-white cover-image prompts for the post and renders them for the owner to pick one.",
    currentInstruction:
      "# post-image\nThree tactile, content-specific metaphors, sketch-on-white, hook rendered in-image. The owner picks one. No clichés.",
  },
  {
    id: "critic",
    name: "Critic",
    role: "gates the draft, approves or rejects",
    blurb:
      "The bouncer. Checks the draft against the bar and either ships it or sends it back.",
    currentInstruction:
      "# post-critic\nGate the draft. Approve only at 8/10+ with no zero-scored category, else one rewrite plan.",
  },
];

// A single malformed ledger file (unquoted YAML in the wild) must not take down
// the whole endpoint — degrade to an empty list for that file.
function safeParseIdeas(raw: string): IdeaBrief[] {
  try {
    return parseIdeaLedger(raw);
  } catch {
    return [];
  }
}

const truncate = (text: string): string =>
  text.length > RESPONSE_LIMIT
    ? `${text.slice(0, RESPONSE_LIMIT).trimEnd()}\n…`
    : text;

// Newest markdown file in a directory by `YYYY-MM-DD` filename prefix (the
// repo's universal convention), falling back to mtime when prefixes are absent.
async function latestMarkdown(dir: string): Promise<string | null> {
  const files = await walkMarkdown(resolve(ROOT, dir));
  if (files.length === 0) return null;

  const dated = files
    .map((file) => ({
      file,
      date: basename(file).match(/^(\d{4}-\d{2}-\d{2})/)?.[1],
    }))
    .filter((f): f is { file: string; date: string } => Boolean(f.date))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (dated[0]) return dated[0].file;

  const withTimes = await Promise.all(
    files.map(async (file) => ({ file, mtime: (await stat(file)).mtimeMs })),
  );
  return withTimes.sort((a, b) => b.mtime - a.mtime)[0]?.file ?? null;
}

// concepts/ nests prompt.md under a dated subdir; rank by the subdir's date.
async function latestConcept(): Promise<string | null> {
  const files = await walkMarkdown(resolve(ROOT, "concepts"));
  const prompts = files.filter((f) => basename(f) === "prompt.md");
  if (prompts.length === 0) return null;
  return (
    prompts
      .map((file) => ({
        file,
        key: file.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? "",
      }))
      .sort((a, b) => b.key.localeCompare(a.key))[0]?.file ?? null
  );
}

const isoOrNull = (ms: number): string => new Date(ms).toISOString();

async function fileMeta(file: string): Promise<{ updatedAt: string }> {
  return { updatedAt: isoOrNull((await stat(file)).mtimeMs) };
}

async function scoutLatest(): Promise<Latest> {
  const file = await latestMarkdown("briefings");
  if (!file) return null;
  const raw = await readFile(file, "utf8");
  const { updatedAt } = await fileMeta(file);
  const title = raw
    .split("\n")
    .find((l) => l.startsWith("# "))
    ?.slice(2)
    .trim();
  return {
    file,
    title: title ?? basename(file),
    updatedAt,
    response: truncate(raw.trim()),
  };
}

function ideaResponse(idea: IdeaBrief): string {
  return [
    `[${idea.topicFamily} · ${idea.sourceType}] ${idea.status}`,
    "",
    `ANGLE   ${idea.angle}`,
    `WHY NOW ${idea.whyNow}`,
    `WEDGE   ${idea.opinionWedge}`,
    idea.evidencePoints.length
      ? `\nEVIDENCE\n${idea.evidencePoints.map((e) => ` • ${e}`).join("\n")}`
      : "",
    idea.sourceUrl ? `\nsource → ${idea.sourceUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function ideatorLatest(): Promise<Latest> {
  // Walk ledgers newest-first; skip any that fail to parse (malformed YAML in
  // the wild) or hold no ideas, so the inspector still shows real material.
  const files = (await walkMarkdown(resolve(ROOT, "ideas")))
    .map((file) => ({
      file,
      date: basename(file).match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const { file } of files) {
    const ideas = safeParseIdeas(await readFile(file, "utf8"));
    if (ideas.length === 0) continue;
    // Prefer an approved/drafted brief, else the first shortlisted one.
    const pick =
      ideas.find((i) => i.status === "approved" || i.status === "drafted") ??
      ideas[0];
    if (!pick) continue;
    const { updatedAt } = await fileMeta(file);
    return {
      file,
      title: pick.sourceTitle || basename(file),
      updatedAt,
      response: `${ideas.length} idea${ideas.length === 1 ? "" : "s"} in ${basename(file)}\n\n${truncate(ideaResponse(pick))}`,
    };
  }
  return null;
}

const draftDateKey = (d: DraftRecord): string =>
  d.draftedAt || basename(d.file);

async function latestDraft(): Promise<DraftRecord | null> {
  const drafts = await loadDrafts();
  return (
    [...drafts].sort((a, b) =>
      draftDateKey(b).localeCompare(draftDateKey(a)),
    )[0] ?? null
  );
}

async function writerLatest(): Promise<Latest> {
  const draft = await latestDraft();
  if (!draft) return null;
  const { updatedAt } = await fileMeta(draft.file);
  return {
    file: draft.file,
    title: draft.sourceTitle ?? basename(draft.file),
    updatedAt,
    response: truncate(draft.body),
  };
}

async function illustratorLatest(): Promise<Latest> {
  const file = await latestConcept();
  if (!file) return null;
  const raw = await readFile(file, "utf8");
  const { updatedAt } = await fileMeta(file);
  const hook = raw.match(/hook_overlay:\s*(.+)/)?.[1]?.trim();
  return {
    file,
    title: hook ?? basename(resolve(file, "..")),
    updatedAt,
    response: truncate(raw.trim()),
  };
}

async function criticLatest(): Promise<Latest> {
  const draft = await latestDraft();
  if (!draft) return null;
  const { updatedAt } = await fileMeta(draft.file);
  const verdict =
    draft.status === "published"
      ? "✅ APPROVED — shipped"
      : draft.status === "approved"
        ? "✅ APPROVED — ready to ship"
        : draft.status === "rejected"
          ? "✗ REVISE — sent back"
          : "… awaiting verdict";
  return {
    file: draft.file,
    title: draft.sourceTitle ?? basename(draft.file),
    updatedAt,
    response: `VERDICT: ${verdict}\nstatus: ${draft.status ?? "drafted"}\ndraft: ${basename(draft.file)}`,
  };
}

async function analystLatest(posts: PostRecord[]): Promise<Latest> {
  const retros = await loadRetros();
  const stats = corpusStats(posts);
  const barLine = `corpus median impressions: ${stats.medianImpressions} (${stats.withImpressions}/${stats.total} ranked)`;
  if (retros.length === 0) {
    return {
      file: null,
      title: "Corpus snapshot",
      updatedAt: null,
      response: barLine,
    };
  }
  const latest = [...retros].sort((a, b) =>
    (b.publishedAt || b.file).localeCompare(a.publishedAt || a.file),
  )[0];
  if (!latest) {
    return {
      file: null,
      title: "Corpus snapshot",
      updatedAt: null,
      response: barLine,
    };
  }
  const { updatedAt } = await fileMeta(latest.file);
  return {
    file: latest.file,
    title: basename(latest.file),
    updatedAt,
    response: truncate(
      [
        barLine,
        "",
        `decision: ${latest.decision}`,
        `beat median: ${latest.beatMedianImpressions ? "yes" : "no"} · beat peers: ${latest.beatPeerGroup ? "yes" : "no"}`,
        "",
        latest.summary,
      ].join("\n"),
    ),
  };
}

const LATEST_BY_ID: Record<AgentId, (posts: PostRecord[]) => Promise<Latest>> =
  {
    analyst: (posts) => analystLatest(posts),
    scout: () => scoutLatest(),
    ideator: () => ideatorLatest(),
    writer: () => writerLatest(),
    illustrator: () => illustratorLatest(),
    critic: () => criticLatest(),
  };

export type AgentPayload = AgentMeta & {
  latest: Latest;
  runtime: OfficeState["agents"][AgentId];
};

export async function buildAgentsPayload(): Promise<{
  agents: AgentPayload[];
  overview: Overview;
  runId: string;
}> {
  const [posts, state] = await Promise.all([loadPosts(), readOfficeState()]);
  const [agents, overview] = await Promise.all([
    Promise.all(
      AGENT_META.map(async (meta) => ({
        ...meta,
        latest: await LATEST_BY_ID[meta.id](posts),
        runtime: state.agents[meta.id],
      })),
    ),
    overviewFrom(posts),
  ]);
  return { agents, overview, runId: state.runId };
}

export type Overview = {
  posts: number;
  ranked: number;
  medianImpressions: number;
  topPosts: { title: string; impressions: number }[];
  drafts: number;
  ideas: number;
  retros: number;
};

async function overviewFrom(posts: PostRecord[]): Promise<Overview> {
  const stats = corpusStats(posts);
  const topPosts = topByImpressions(posts, 5).map((p) => ({
    title: p.firstLine.slice(0, 80),
    impressions: p.impressions ?? 0,
  }));
  const [drafts, retros, ideaFiles] = await Promise.all([
    loadDrafts(),
    loadRetros(),
    walkMarkdown(resolve(ROOT, "ideas")),
  ]);
  let ideas = 0;
  for (const file of ideaFiles) {
    ideas += safeParseIdeas(await readFile(file, "utf8")).length;
  }
  return {
    posts: posts.length,
    ranked: stats.withImpressions,
    medianImpressions: stats.medianImpressions,
    topPosts,
    drafts: drafts.length,
    ideas,
    retros: retros.length,
  };
}

export async function buildOverviewPayload(): Promise<Overview> {
  return overviewFrom(await loadPosts());
}
