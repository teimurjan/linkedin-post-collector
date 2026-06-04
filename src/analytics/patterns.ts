import type { CorpusStats, PostRecord } from "./analyze.ts";
import { corpusStats, topByImpressions } from "./analyze.ts";
import type {
  EndingType,
  HookType,
  RetroDecision,
  RetroRecord,
  SourceType,
  TopicFamily,
} from "./lifecycle.ts";

export type PostClassification = {
  topicFamily: TopicFamily;
  sourceType: SourceType;
  hookType: HookType;
  containsNumbers: boolean;
  hasFirsthandSignal: boolean;
  endingType: EndingType;
};

export type PatternBucket = {
  key: string;
  medianImpressions: number;
  posts: Array<{
    file: string;
    firstLine: string;
    impressions: number;
    classification: PostClassification;
  }>;
};

export type CoolingFamily = {
  family: TopicFamily;
  recentMisses: number;
  windowSize: number;
  recentImpressions: number[];
};

export type RecentHook = {
  file: string;
  firstLine: string;
  impressions: number | null;
  postedAt: string;
  frame: string | null;
  belowMedian: boolean;
};

export type PatternReport = {
  generatedAt: string;
  corpus: CorpusStats;
  topBucketsByTopic: PatternBucket[];
  topBucketsBySource: PatternBucket[];
  bottomBucketsByTopic: PatternBucket[];
  bottomBucketsBySource: PatternBucket[];
  topQuartileMedianLength: number;
  topQuartileHookWordRange: [number, number];
  antiPatterns: string[];
  retroSignals: string[];
  postmortemSignals: string[];
  coolingFamilies: CoolingFamily[];
  recentHooks: RecentHook[];
  repeatedFrames: string[];
};

export function classifyPost(
  post: Pick<PostRecord, "body" | "firstLine" | "url">,
): PostClassification {
  const body = post.body;
  const first = post.firstLine;
  const lastParagraph = lastNonEmptyParagraph(body);
  const lowerBody = body.toLowerCase();
  const lowerFirst = first.toLowerCase();

  return {
    topicFamily: detectTopicFamily(lowerBody),
    sourceType: detectSourceType(lowerBody, lowerFirst, post.url),
    hookType: detectHookType(lowerFirst),
    containsNumbers: /\b\d[\d.,]*\b/.test(body),
    hasFirsthandSignal:
      /\b(i|we)\s+(built|tested|shipped|ran|ported|measured|benchmarked|experimented|implemented|wrote)\b/i.test(
        body,
      ),
    endingType: detectEndingType(lastParagraph),
  };
}

export function analyzePostPatterns(
  posts: PostRecord[],
  retros: RetroRecord[] = [],
): PatternReport {
  const corpus = corpusStats(posts);
  const ranked = posts.filter((post) => typeof post.impressions === "number");
  const classified = ranked.map((post) => ({
    post,
    classification: classifyPost(post),
  }));
  const recentHooks = buildRecentHooks(posts, corpus.medianImpressions);
  const topQuartileCount = Math.max(1, Math.ceil(classified.length / 4));
  const topQuartile = topByImpressions(ranked, topQuartileCount);
  const topQuartileLengths = topQuartile
    .map((post) => post.length)
    .sort((a, b) => a - b);
  const topQuartileHooks = topQuartile
    .map((post) => post.firstLine.split(/\s+/).filter(Boolean).length)
    .sort((a, b) => a - b);
  const bottomQuartile = [...ranked]
    .sort((a, b) => (a.impressions ?? 0) - (b.impressions ?? 0))
    .slice(0, topQuartileCount);

  return {
    generatedAt: new Date().toISOString(),
    corpus,
    topBucketsByTopic: buildBuckets(
      classified.filter(({ post }) => topQuartile.includes(post)),
      (item) => item.classification.topicFamily,
    ),
    topBucketsBySource: buildBuckets(
      classified.filter(({ post }) => topQuartile.includes(post)),
      (item) => item.classification.sourceType,
    ),
    bottomBucketsByTopic: buildBuckets(
      classified.filter(({ post }) => bottomQuartile.includes(post)),
      (item) => item.classification.topicFamily,
    ),
    bottomBucketsBySource: buildBuckets(
      classified.filter(({ post }) => bottomQuartile.includes(post)),
      (item) => item.classification.sourceType,
    ),
    topQuartileMedianLength: median(topQuartileLengths),
    topQuartileHookWordRange: [
      topQuartileHooks[0] ?? 0,
      topQuartileHooks[topQuartileHooks.length - 1] ?? 0,
    ],
    antiPatterns: repeatedAntiPatterns(
      bottomQuartile.map((post) => classifyPost(post)),
    ),
    retroSignals: summarizeRetros(
      retros.filter((retro) => retro.kind !== "postmortem"),
    ),
    postmortemSignals: summarizePostmortems(
      retros.filter((retro) => retro.kind === "postmortem"),
    ),
    coolingFamilies: detectCoolingFamilies(classified, corpus),
    recentHooks,
    repeatedFrames: repeatedFrames(recentHooks),
  };
}

export function renderPostPatternsMarkdown(report: PatternReport): string {
  const lines: string[] = [];
  lines.push("# Post patterns");
  lines.push("");
  lines.push(
    `Corpus: ${report.corpus.total} posts, ${report.corpus.withImpressions} with impressions, generated ${report.generatedAt.slice(0, 10)}.`,
  );
  lines.push("");
  lines.push("## Top performers by topic family");
  lines.push("");
  lines.push(...renderBuckets(report.topBucketsByTopic));
  lines.push("");
  lines.push("## Top performers by source type");
  lines.push("");
  lines.push(...renderBuckets(report.topBucketsBySource));
  lines.push("");
  lines.push("## Bottom performers by topic family");
  lines.push("");
  lines.push(...renderBuckets(report.bottomBucketsByTopic));
  lines.push("");
  lines.push("## Bottom performers by source type");
  lines.push("");
  lines.push(...renderBuckets(report.bottomBucketsBySource));
  lines.push("");
  lines.push("## Top quartile shape");
  lines.push("");
  lines.push(`- Median length: ${report.topQuartileMedianLength} chars`);
  lines.push(
    `- Hook length range: ${report.topQuartileHookWordRange[0]} to ${report.topQuartileHookWordRange[1]} words`,
  );
  lines.push("");
  lines.push("## Recent hooks (do not reuse a frame already here)");
  lines.push("");
  lines.push(
    "The last few first lines, newest first. A new draft must open on a different frame — especially avoid any flagged below as repeated or sub-median.",
  );
  lines.push("");
  if (report.recentHooks.length === 0) {
    lines.push("- None");
  } else {
    for (const hook of report.recentHooks) {
      const imp = hook.impressions === null ? "n/a" : `${hook.impressions} imp`;
      const frame = hook.frame ? ` · frame: ${hook.frame}` : "";
      const weak = hook.belowMedian ? " · sub-median" : "";
      lines.push(
        `- ${hook.postedAt} · ${imp}${weak} · ${trim(hook.firstLine)}${frame}`,
      );
    }
  }
  if (report.repeatedFrames.length > 0) {
    lines.push("");
    lines.push("Repeated frames to avoid:");
    for (const item of report.repeatedFrames) lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Repeated anti-patterns");
  lines.push("");
  for (const item of report.antiPatterns) lines.push(`- ${item}`);
  if (report.coolingFamilies.length > 0) {
    lines.push("");
    lines.push("## Cooling families");
    lines.push("");
    lines.push(
      "Topic families with 3+ consecutive sub-median posts. The ideator must require a firsthand artifact for any new idea here; the critic auto-zeros `builder relevance` if one ships without it.",
    );
    lines.push("");
    for (const item of report.coolingFamilies) {
      lines.push(
        `- \`${item.family}\`: ${item.recentMisses} of last ${item.windowSize} sub-median (${item.recentImpressions.join(", ")})`,
      );
    }
  }
  if (report.retroSignals.length > 0) {
    lines.push("");
    lines.push("## Retro signals");
    lines.push("");
    for (const item of report.retroSignals) lines.push(`- ${item}`);
  }
  if (report.postmortemSignals.length > 0) {
    lines.push("");
    lines.push("## Recurring failure modes from postmortems");
    lines.push("");
    for (const item of report.postmortemSignals) lines.push(`- ${item}`);
  }
  return lines.join("\n");
}

function buildBuckets(
  items: Array<{ post: PostRecord; classification: PostClassification }>,
  keyFn: (item: {
    post: PostRecord;
    classification: PostClassification;
  }) => string,
): PatternBucket[] {
  const grouped = new Map<
    string,
    Array<{ post: PostRecord; classification: PostClassification }>
  >();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = grouped.get(key) ?? [];
    bucket.push(item);
    grouped.set(key, bucket);
  }

  return [...grouped.entries()]
    .map(([key, bucket]) => ({
      key,
      medianImpressions: median(
        bucket
          .map(({ post }) => post.impressions ?? 0)
          .filter((value): value is number => Number.isFinite(value))
          .sort((a, b) => a - b),
      ),
      posts: bucket
        .sort((a, b) => (b.post.impressions ?? 0) - (a.post.impressions ?? 0))
        .slice(0, 3)
        .map(({ post, classification }) => ({
          file: post.file,
          firstLine: post.firstLine,
          impressions: post.impressions ?? 0,
          classification,
        })),
    }))
    .sort((a, b) => b.medianImpressions - a.medianImpressions);
}

function renderBuckets(buckets: PatternBucket[]): string[] {
  if (buckets.length === 0) return ["- None"];
  return buckets.flatMap((bucket) => {
    const lines = [
      `- \`${bucket.key}\` median ${bucket.medianImpressions} imp`,
    ];
    for (const post of bucket.posts) {
      lines.push(
        `  ${post.impressions} imp · ${trim(post.firstLine)} · ${post.classification.hookType}, ${post.classification.endingType}`,
      );
    }
    return lines;
  });
}

function repeatedAntiPatterns(classifications: PostClassification[]): string[] {
  const counters = new Map<string, number>();
  for (const classification of classifications) {
    const flags = [
      classification.sourceType === "news" && !classification.hasFirsthandSignal
        ? "news posts without firsthand signal"
        : null,
      !classification.containsNumbers ? "posts with no concrete numbers" : null,
      classification.endingType === "question"
        ? "question endings without enough substance to carry them"
        : null,
      classification.hookType === "announcement"
        ? "announcement hooks that read like recaps"
        : null,
    ].filter((value): value is string => Boolean(value));
    for (const flag of flags) {
      counters.set(flag, (counters.get(flag) ?? 0) + 1);
    }
  }

  const repeated = [...counters.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => `${label} (${count})`);

  return repeated.length > 0 ? repeated : ["No repeated anti-patterns yet."];
}

function summarizeRetros(retros: RetroRecord[]): string[] {
  if (retros.length === 0) return [];
  const decisionCounts = new Map<RetroDecision, number>();
  for (const retro of retros) {
    decisionCounts.set(
      retro.decision,
      (decisionCounts.get(retro.decision) ?? 0) + 1,
    );
  }
  const lines = [...decisionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([decision, count]) => `${decision} patterns: ${count}`);

  // Surface the actual lesson from each retro, newest first and labeled by
  // decision, so a stop/tune/keep conclusion reaches the writer and ideator.
  // Previously only `block` summaries surfaced, which made every `modify` and
  // `repeat` retro write-only — a +1 to a counter and nothing more.
  const order: RetroDecision[] = ["block", "modify", "repeat"];
  const summaries = order.flatMap((decision) =>
    retros
      .filter((retro) => retro.decision === decision)
      .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
      .map((retro) => retro.summary)
      .filter(Boolean)
      .slice(0, 3)
      .map((summary) => `${decision}: ${summary}`),
  );

  return [...lines, ...summaries];
}

function detectCoolingFamilies(
  classified: Array<{ post: PostRecord; classification: PostClassification }>,
  corpus: CorpusStats,
): CoolingFamily[] {
  const median = corpus.medianImpressions;
  if (median <= 0) return [];

  const WINDOW = 4;
  const MIN_MISSES = 3;

  const byFamily = new Map<
    TopicFamily,
    Array<{ post: PostRecord; classification: PostClassification }>
  >();
  for (const item of classified) {
    const family = item.classification.topicFamily;
    const bucket = byFamily.get(family) ?? [];
    bucket.push(item);
    byFamily.set(family, bucket);
  }

  const cooling: CoolingFamily[] = [];
  for (const [family, bucket] of byFamily) {
    if (bucket.length < MIN_MISSES) continue;
    const recent = [...bucket]
      .sort((a, b) => b.post.postedAt.getTime() - a.post.postedAt.getTime())
      .slice(0, WINDOW);
    const impressions = recent.map((item) => item.post.impressions ?? 0);
    const misses = impressions.filter((value) => value < median).length;
    if (misses >= MIN_MISSES) {
      cooling.push({
        family,
        recentMisses: misses,
        windowSize: recent.length,
        recentImpressions: impressions,
      });
    }
  }

  return cooling.sort((a, b) => b.recentMisses - a.recentMisses);
}

function summarizePostmortems(postmortems: RetroRecord[]): string[] {
  if (postmortems.length === 0) return [];

  const failureCounts = new Map<string, number>();
  for (const postmortem of postmortems) {
    for (const mode of postmortem.likelyFailureModes ?? []) {
      const normalized = mode.trim();
      if (!normalized) continue;
      failureCounts.set(normalized, (failureCounts.get(normalized) ?? 0) + 1);
    }
  }

  const aggregated = [...failureCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([mode, count]) => `${mode} (${count})`);

  const blocked = postmortems
    .filter((postmortem) => postmortem.decision === "block")
    .map((postmortem) => postmortem.summary)
    .filter(Boolean)
    .slice(0, 2);

  if (aggregated.length === 0 && blocked.length === 0) {
    return [
      `postmortems on file: ${postmortems.length} (no failure mode repeats yet)`,
    ];
  }

  return [...aggregated, ...blocked];
}

function detectTopicFamily(body: string): TopicFamily {
  if (
    /\b(breach|malicious|npm|supply chain|cve|token|exploit|malware|security)\b/i.test(
      body,
    )
  ) {
    return "security";
  }
  if (/\b(react|solid|ui|javascript|jsx|dom|frontend|browser)\b/i.test(body)) {
    return "frontend";
  }
  if (/\b(agent|agents|tool use|retrieval|memory|coding agent)\b/i.test(body)) {
    return "agents";
  }
  if (
    /\b(llm|slm|models|qwen|browser-ai|local inference|prompt optimization|ai sdk)\b/i.test(
      body,
    )
  ) {
    return "ai";
  }
  if (
    /\b(open source|oss|repo|github repo|js open source awards|library)\b/i.test(
      body,
    )
  ) {
    return "oss";
  }
  if (
    /\b(subscription|pricing|product|feature|company|toolchain)\b/i.test(body)
  ) {
    return "product";
  }
  if (/\b(attending|conference|award|summit|berlin|event)\b/i.test(body)) {
    return "event";
  }
  if (/\b(career|hiring|job|milestone)\b/i.test(body)) {
    return "career";
  }
  return "other";
}

function detectSourceType(
  body: string,
  first: string,
  url: string,
): SourceType {
  if (/\b(i|we)\s+(built|shipped|ported|wrote|launched)\b/i.test(body)) {
    return "build_log";
  }
  if (
    /\bexperiment|benchmark|tested|i ran|i've been experimenting|retrieval experiments\b/i.test(
      body,
    )
  ) {
    return "experiment";
  }
  if (
    /\bmy first reaction|i think|i'm skeptical|i’d bet|i'd bet|worth watching\b/i.test(
      body,
    )
  ) {
    return "opinion";
  }
  if (
    /\b(beta is out|dropped|launched|released|nominated|share something|milestone)\b/i.test(
      first + body,
    )
  ) {
    return "launch";
  }
  if (
    /\barticle|writeup|i wrote|made it to hackernoon|newsletter\b/i.test(
      body,
    ) ||
    /hackernoon/i.test(url)
  ) {
    return "article";
  }
  return "news";
}

function detectHookType(firstLine: string): HookType {
  if (
    /\b(is out|dropped|launched|released|published|nominated|attending)\b/i.test(
      firstLine,
    )
  ) {
    return "announcement";
  }
  if (
    /\b(quietly|mostly|skeptical|wasn'?t|underrated|not)\b/i.test(firstLine)
  ) {
    return "contrarian";
  }
  if (
    /\b(i built|i shipped|i tested|i ran|experiment|benchmark)\b/i.test(
      firstLine,
    ) ||
    /\d/.test(firstLine)
  ) {
    return "result";
  }
  if (
    /\b(are getting|everyone's|everyone’s|most|it only knows|my first reaction)\b/i.test(
      firstLine,
    )
  ) {
    return "observation";
  }
  return "claim";
}

// `hookType` buckets a hook by *category* (announcement/result/...). `frame`
// fingerprints its *surface template* so a gimmick can't quietly repeat across
// posts under different categories — e.g. "Everyone read 4B params. I read
// 0.93 GB." and "Everyone sees free VRAM. I see a 32 GB/s wall." both classify
// as `result` (they carry numbers) yet share one frame. Returns a named frame
// for known repeatable templates, else null.
const HOOK_FRAMES: Array<{ label: string; test: RegExp }> = [
  {
    label: "pronoun-pivot (everyone X, I Y)",
    test: /^(?:everyone|everybody|every\s+\w+|most\s+people|most\s+\w+|nobody|no one|the world|they)\b.*?[.,;:—–-]\s+(?:i|we|you|my|our)\b/i,
  },
];

function detectHookFrame(firstLine: string): string | null {
  return HOOK_FRAMES.find((frame) => frame.test.test(firstLine))?.label ?? null;
}

const RECENT_HOOK_WINDOW = 8;

function buildRecentHooks(posts: PostRecord[], median: number): RecentHook[] {
  return [...posts]
    .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
    .slice(0, RECENT_HOOK_WINDOW)
    .map((post) => ({
      file: post.file,
      firstLine: post.firstLine,
      impressions: post.impressions ?? null,
      postedAt: post.postedAt.toISOString().slice(0, 10),
      frame: detectHookFrame(post.firstLine),
      belowMedian:
        typeof post.impressions === "number" &&
        median > 0 &&
        post.impressions < median,
    }));
}

function repeatedFrames(hooks: RecentHook[]): string[] {
  const counts = new Map<string, { count: number; weak: boolean }>();
  for (const hook of hooks) {
    if (!hook.frame) continue;
    const entry = counts.get(hook.frame) ?? { count: 0, weak: false };
    entry.count += 1;
    entry.weak = entry.weak || hook.belowMedian;
    counts.set(hook.frame, entry);
  }

  return [...counts.entries()]
    .filter(([, value]) => value.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .map(
      ([label, value]) =>
        `\`${label}\` used ${value.count}x in the last ${hooks.length} hooks${value.weak ? " — at least one was sub-median; do not reuse" : ""}`,
    );
}

function detectEndingType(lastParagraph: string): EndingType {
  if (/https?:\/\/|lnkd\.in\//i.test(lastParagraph)) return "linkout";
  if (lastParagraph.trim().endsWith("?")) return "question";
  if (/\b(will|going to|gets copied|next)\b/i.test(lastParagraph))
    return "prediction";
  return "takeaway";
}

function lastNonEmptyParagraph(body: string): string {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  return paragraphs[paragraphs.length - 1] ?? "";
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

function trim(input: string): string {
  return input.length > 90 ? `${input.slice(0, 87)}...` : input;
}
