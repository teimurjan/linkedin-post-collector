import type { CorpusStats, PostRecord } from "./analyze.ts";
import { corpusStats, filterByLane, topByImpressions } from "./analyze.ts";
import type {
  EndingType,
  HookType,
  PostLane,
  RetroDecision,
  RetroRecord,
  SourceType,
  TopicFamily,
} from "./lifecycle.ts";
import { DEFAULT_LANE, POST_LANES } from "./lifecycle.ts";

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
  // Sample size behind `medianImpressions`. A bucket median is only a signal
  // when it has posts under it; `sampleSize` travels with the number so no
  // reader can mistake a 2-post bucket for a family verdict.
  sampleSize: number;
  corpusSampleSize: number;
  posts: Array<{
    file: string;
    firstLine: string;
    impressions: number;
    classification: PostClassification;
  }>;
};

// A bucket median below this many posts is noise. Buckets under it are still
// printed (hiding them would look like the family does not exist) but carry an
// explicit do-not-cite marker.
export const MIN_CITABLE_SAMPLE = 4;

export type FamilyStat = {
  family: TopicFamily;
  n: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  shareOfCorpus: number;
};

export type PostIndexEntry = {
  file: string;
  postedAt: string;
  lane: PostLane;
  scrapeAgeHours: number | null;
  impressions: number | null;
  firstLine: string;
  length: number;
  classification: PostClassification;
};

// Per-lane distribution over the whole archive, reported even when the rest
// of the report is scoped to one lane, so the other lane's size stays visible.
export type LaneStat = {
  lane: PostLane;
  n: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
};

export type CohortMedian = {
  scrapeAgeBucket: string;
  n: number;
  median: number;
};

export type MetricCoverage = {
  total: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
};

export type OutlierAdjusted = {
  median: number;
  trimmedMedian: number;
  excluded: Array<{ file: string; impressions: number }>;
};

export type AntiPatternStat = {
  label: string;
  /** Posts carrying the flag. */
  n: number;
  medianWith: number;
  medianWithout: number;
  /** medianWith / medianWithout. Below 1 means the flag marks weaker posts. */
  ratio: number;
  verdict: "predictive" | "inverted" | "no-signal" | "too-few";
};

// A flag earns the name "anti-pattern" only by marking posts that actually
// underperform the ones without it, on enough posts to mean something.
// Counting flags inside the bottom quartile cannot show this: a trait common
// to every post is common in the bottom quartile too.
const ANTI_PATTERN_MIN_N = 4;
const ANTI_PATTERN_WORSE_RATIO = 0.7;
const ANTI_PATTERN_BETTER_RATIO = 1.2;

export type CoolingFamily = {
  family: TopicFamily;
  recentMisses: number;
  windowSize: number;
  recentImpressions: number[];
  // The family's own p25, not the corpus median — see detectCoolingFamilies.
  baseline: number;
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
  /** Present when the report was scoped to one lane; the other lane's posts
   * and retros are then excluded from every section except `laneStats`. */
  lane?: PostLane;
  laneStats: LaneStat[];
  corpus: CorpusStats;
  topBucketsByTopic: PatternBucket[];
  topBucketsBySource: PatternBucket[];
  bottomBucketsByTopic: PatternBucket[];
  bottomBucketsBySource: PatternBucket[];
  topQuartileMedianLength: number;
  topQuartileHookWordRange: [number, number];
  /** Flags that actually mark underperforming posts, worst ratio first. */
  antiPatterns: AntiPatternStat[];
  /** Flags tested and found not to predict underperformance. Kept visible so
   * a discredited rule does not quietly get reintroduced. */
  discreditedPatterns: AntiPatternStat[];
  retroSignals: string[];
  postmortemSignals: string[];
  coolingFamilies: CoolingFamily[];
  recentHooks: RecentHook[];
  repeatedFrames: string[];
  // Full-corpus family distribution. The bucket sections above see only the
  // top and bottom quartiles, which starves families down to 2-3 posts and
  // inverts the ranking; this is the honest denominator.
  familyStats: FamilyStat[];
  // One row per ranked post. Lets a consumer verify any cited median against
  // the posts it claims to summarize instead of trusting a bucket label.
  postIndex: PostIndexEntry[];
  cohortMedians: CohortMedian[];
  metricCoverage: MetricCoverage;
  outlierAdjusted: OutlierAdjusted;
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

export type PatternOptions = {
  /** Scope every section to one lane. The lanes are analyzed separately:
   * a news post's reach says nothing about an experience post's. */
  lane?: PostLane;
};

export function analyzePostPatterns(
  allPosts: PostRecord[],
  allRetros: RetroRecord[] = [],
  options: PatternOptions = {},
): PatternReport {
  const posts = filterByLane(allPosts, options.lane);
  const retros = options.lane
    ? allRetros.filter((retro) => (retro.lane ?? DEFAULT_LANE) === options.lane)
    : allRetros;
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

  const familyStats = buildFamilyStats(classified);
  const corpusCounts = countByKey(classified);
  const antiPatternStats = validateAntiPatterns(classified);

  return {
    generatedAt: new Date().toISOString(),
    ...(options.lane ? { lane: options.lane } : {}),
    laneStats: buildLaneStats(allPosts),
    corpus,
    topBucketsByTopic: buildBuckets(
      classified.filter(({ post }) => topQuartile.includes(post)),
      (item) => item.classification.topicFamily,
      corpusCounts.byTopic,
    ),
    topBucketsBySource: buildBuckets(
      classified.filter(({ post }) => topQuartile.includes(post)),
      (item) => item.classification.sourceType,
      corpusCounts.bySource,
    ),
    bottomBucketsByTopic: buildBuckets(
      classified.filter(({ post }) => bottomQuartile.includes(post)),
      (item) => item.classification.topicFamily,
      corpusCounts.byTopic,
    ),
    bottomBucketsBySource: buildBuckets(
      classified.filter(({ post }) => bottomQuartile.includes(post)),
      (item) => item.classification.sourceType,
      corpusCounts.bySource,
    ),
    topQuartileMedianLength: median(topQuartileLengths),
    topQuartileHookWordRange: [
      topQuartileHooks[0] ?? 0,
      topQuartileHooks[topQuartileHooks.length - 1] ?? 0,
    ],
    antiPatterns: antiPatternStats.filter((s) => s.verdict === "predictive"),
    discreditedPatterns: antiPatternStats.filter(
      (s) => s.verdict === "inverted" || s.verdict === "no-signal",
    ),
    retroSignals: summarizeRetros(
      retros.filter((retro) => retro.kind !== "postmortem"),
    ),
    postmortemSignals: summarizePostmortems(
      retros.filter((retro) => retro.kind === "postmortem"),
    ),
    coolingFamilies: detectCoolingFamilies(classified, familyStats),
    recentHooks,
    repeatedFrames: repeatedFrames(recentHooks),
    familyStats,
    postIndex: buildPostIndex(classified),
    cohortMedians: buildCohortMedians(ranked),
    metricCoverage: buildMetricCoverage(posts),
    outlierAdjusted: buildOutlierAdjusted(ranked, corpus.medianImpressions),
  };
}

export function renderPostPatternsMarkdown(report: PatternReport): string {
  const lines: string[] = [];
  lines.push("# Post patterns");
  lines.push("");
  const scope = report.lane
    ? ` Scoped to the \`${report.lane}\` lane; the other lane's posts and retros are excluded from every section below except the lane table.`
    : "";
  lines.push(
    `Corpus: ${report.corpus.total} posts, ${report.corpus.withImpressions} with impressions, generated ${report.generatedAt.slice(0, 10)}.${scope}`,
  );
  lines.push("");
  lines.push("## Lanes (full archive)");
  lines.push("");
  lines.push(
    "`news` posts react to an external event; `experience` posts are about the owner's own work and operation. Posts without a `lane` in their frontmatter count as `news`. Never compare a post against the other lane's numbers.",
  );
  lines.push("");
  for (const stat of report.laneStats) {
    const thin = stat.n < MIN_CITABLE_SAMPLE ? " — too few to cite" : "";
    lines.push(
      `- \`${stat.lane}\` n=${stat.n} · median ${stat.median} · p25 ${stat.p25} · p75 ${stat.p75} · range ${stat.min} to ${stat.max}${thin}`,
    );
  }
  lines.push("");
  const dropped = report.outlierAdjusted.excluded;
  const droppedNote =
    dropped.length === 0
      ? ""
      : ` With the top ${dropped.length} removed (${dropped.map((d) => d.impressions).join(", ")}): ${report.outlierAdjusted.trimmedMedian}.`;
  lines.push(
    `Median impressions: ${report.corpus.medianImpressions}.${droppedNote}`,
  );
  const coverage = report.metricCoverage;
  lines.push(
    `Metric coverage: impressions ${coverage.impressions}/${coverage.total}, likes ${coverage.likes}/${coverage.total}, comments ${coverage.comments}/${coverage.total}, shares ${coverage.shares}/${coverage.total}. Engagement-weighted rankings are unreliable at this coverage.`,
  );
  lines.push("");
  lines.push("## Topic family distribution (full corpus)");
  lines.push("");
  lines.push(
    `The bucket sections below see only the top and bottom quartiles, which shrinks families to 2-3 posts and can invert the ranking. These are the full-corpus numbers. Families under n=${MIN_CITABLE_SAMPLE} do not support a claim.`,
  );
  lines.push("");
  if (report.familyStats.length === 0) {
    lines.push("- None");
  } else {
    for (const stat of report.familyStats) {
      const thin = stat.n < MIN_CITABLE_SAMPLE ? " — too few to cite" : "";
      lines.push(
        `- \`${stat.family}\` n=${stat.n} · median ${stat.median} · p25 ${stat.p25} · p75 ${stat.p75} · range ${stat.min} to ${stat.max}${thin}`,
      );
    }
    lines.push("");
    lines.push(
      "`topic_family` comes from a first-match-wins keyword cascade over the whole body, so labels are unreliable and `other` is the residue bucket, not a family. Do not treat a family label as a reach signal.",
    );
  }
  lines.push("");
  lines.push("## Impressions by scrape age");
  lines.push("");
  lines.push(
    "Impressions are frozen at first scrape and never refreshed, so posts scraped at different ages are not directly comparable. Compare a fresh post against its own cohort, not the pooled median.",
  );
  lines.push("");
  if (report.cohortMedians.length === 0) {
    lines.push("- None");
  } else {
    for (const cohort of report.cohortMedians) {
      lines.push(
        `- ${cohort.scrapeAgeBucket}: n=${cohort.n} · median ${cohort.median} imp`,
      );
    }
  }
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
  lines.push("## Validated anti-patterns");
  lines.push("");
  lines.push(
    `Each flag is tested against the whole corpus: it counts as an anti-pattern only when flagged posts median below ${ANTI_PATTERN_WORSE_RATIO} of the unflagged ones, on at least ${ANTI_PATTERN_MIN_N} posts. Counting traits inside the bottom quartile does not show this.`,
  );
  lines.push("");
  if (report.antiPatterns.length === 0) {
    lines.push("- None hold up against the corpus.");
  } else {
    for (const item of report.antiPatterns) {
      lines.push(
        `- ${item.label} — n=${item.n}, median ${item.medianWith} vs ${item.medianWithout} without (${item.ratio}x)`,
      );
    }
  }
  if (report.discreditedPatterns.length > 0) {
    lines.push("");
    lines.push(
      "**Tested and discredited.** Do not treat these as faults, and do not reintroduce them as rules:",
    );
    lines.push("");
    for (const item of report.discreditedPatterns) {
      const note =
        item.verdict === "inverted"
          ? "flagged posts do *better*"
          : "no meaningful difference";
      lines.push(
        `- ${item.label} — n=${item.n}, median ${item.medianWith} vs ${item.medianWithout} without (${item.ratio}x): ${note}`,
      );
    }
  }
  if (report.coolingFamilies.length > 0) {
    lines.push("");
    lines.push("## Cooling families");
    lines.push("");
    lines.push(
      "Families with 3+ of their last 4 posts below the family's own p25, on at least 6 posts of record. This is a **trigger for review, not a gate** — the family classifier mislabels, so confirm the streak is real before requiring a firsthand artifact.",
    );
    lines.push("");
    for (const item of report.coolingFamilies) {
      lines.push(
        `- \`${item.family}\`: ${item.recentMisses} of last ${item.windowSize} below its p25 of ${item.baseline} (${item.recentImpressions.join(", ")})`,
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

type ClassifiedPost = {
  post: PostRecord;
  classification: PostClassification;
};

function countByKey(items: ClassifiedPost[]): {
  byTopic: Map<string, number>;
  bySource: Map<string, number>;
} {
  const byTopic = new Map<string, number>();
  const bySource = new Map<string, number>();
  for (const { classification } of items) {
    const topic = classification.topicFamily;
    const source = classification.sourceType;
    byTopic.set(topic, (byTopic.get(topic) ?? 0) + 1);
    bySource.set(source, (bySource.get(source) ?? 0) + 1);
  }
  return { byTopic, bySource };
}

function buildBuckets(
  items: ClassifiedPost[],
  keyFn: (item: ClassifiedPost) => string,
  corpusCounts: Map<string, number>,
): PatternBucket[] {
  const grouped = new Map<string, ClassifiedPost[]>();
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
      sampleSize: bucket.length,
      corpusSampleSize: corpusCounts.get(key) ?? bucket.length,
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
    const thin =
      bucket.sampleSize < MIN_CITABLE_SAMPLE ? " — too few to cite" : "";
    const lines = [
      `- \`${bucket.key}\` median ${bucket.medianImpressions} imp (n=${bucket.sampleSize} here, n=${bucket.corpusSampleSize} corpus-wide${thin})`,
    ];
    for (const post of bucket.posts) {
      lines.push(
        `  ${post.impressions} imp · ${trim(post.firstLine)} · ${post.classification.hookType}, ${post.classification.endingType}`,
      );
    }
    return lines;
  });
}

function buildFamilyStats(items: ClassifiedPost[]): FamilyStat[] {
  const grouped = new Map<TopicFamily, number[]>();
  for (const { post, classification } of items) {
    if (typeof post.impressions !== "number") continue;
    const family = classification.topicFamily;
    const bucket = grouped.get(family) ?? [];
    bucket.push(post.impressions);
    grouped.set(family, bucket);
  }

  const total = [...grouped.values()].reduce((sum, v) => sum + v.length, 0);

  return [...grouped.entries()]
    .map(([family, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return {
        family,
        n: sorted.length,
        median: median(sorted),
        p25: percentile(sorted, 0.25),
        p75: percentile(sorted, 0.75),
        min: sorted[0] ?? 0,
        max: sorted[sorted.length - 1] ?? 0,
        shareOfCorpus: total === 0 ? 0 : sorted.length / total,
      };
    })
    .sort((a, b) => b.n - a.n);
}

function buildLaneStats(posts: PostRecord[]): LaneStat[] {
  return POST_LANES.map((lane) => {
    const sorted = filterByLane(posts, lane)
      .map((post) => post.impressions)
      .filter((value): value is number => typeof value === "number")
      .sort((a, b) => a - b);
    return {
      lane,
      n: sorted.length,
      median: median(sorted),
      p25: percentile(sorted, 0.25),
      p75: percentile(sorted, 0.75),
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
    };
  });
}

function buildPostIndex(items: ClassifiedPost[]): PostIndexEntry[] {
  return items
    .map(({ post, classification }) => ({
      file: post.file,
      postedAt: post.postedAt.toISOString().slice(0, 10),
      lane: post.lane,
      scrapeAgeHours: post.scrapeAgeHours,
      impressions: post.impressions,
      firstLine: post.firstLine,
      length: post.length,
      classification,
    }))
    .sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1));
}

const COHORT_BUCKETS: Array<{ label: string; maxHours: number }> = [
  { label: "under 48h", maxHours: 48 },
  { label: "2 to 7 days", maxHours: 24 * 7 },
  { label: "1 to 4 weeks", maxHours: 24 * 30 },
  { label: "1 to 3 months", maxHours: 24 * 90 },
  { label: "over 3 months", maxHours: Number.POSITIVE_INFINITY },
];

function buildCohortMedians(ranked: PostRecord[]): CohortMedian[] {
  const grouped = new Map<string, number[]>();
  for (const post of ranked) {
    if (typeof post.impressions !== "number") continue;
    const age = post.scrapeAgeHours;
    const label =
      age === null
        ? "unknown scrape age"
        : (COHORT_BUCKETS.find((bucket) => age < bucket.maxHours)?.label ??
          "over 3 months");
    const bucket = grouped.get(label) ?? [];
    bucket.push(post.impressions);
    grouped.set(label, bucket);
  }

  const order = [...COHORT_BUCKETS.map((b) => b.label), "unknown scrape age"];
  return order
    .filter((label) => grouped.has(label))
    .map((label) => {
      const values = (grouped.get(label) ?? []).sort((a, b) => a - b);
      return {
        scrapeAgeBucket: label,
        n: values.length,
        median: median(values),
      };
    });
}

function buildMetricCoverage(posts: PostRecord[]): MetricCoverage {
  const count = (pick: (p: PostRecord) => number | null): number =>
    posts.filter((post) => typeof pick(post) === "number").length;
  return {
    total: posts.length,
    impressions: count((p) => p.impressions),
    likes: count((p) => p.likes),
    comments: count((p) => p.comments),
    shares: count((p) => p.shares),
  };
}

// One viral post can drag the corpus median that every "beat median" gate
// compares against. Report the median with the top 1% removed alongside the
// raw one so a consumer can see how much rests on a single number. At least
// one post is dropped once the corpus is big enough for that to be meaningful
// — a literal 1% of 50 posts rounds to zero and would trim nothing.
function buildOutlierAdjusted(
  ranked: PostRecord[],
  rawMedian: number,
): OutlierAdjusted {
  const sorted = [...ranked]
    .filter((post) => typeof post.impressions === "number")
    .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0));
  const dropCount =
    sorted.length < 10 ? 0 : Math.max(1, Math.floor(sorted.length * 0.01));
  const excluded = sorted.slice(0, dropCount);
  const kept = sorted
    .slice(dropCount)
    .map((post) => post.impressions as number)
    .sort((a, b) => a - b);

  return {
    median: rawMedian,
    trimmedMedian: median(kept),
    excluded: excluded.map((post) => ({
      file: post.file,
      impressions: post.impressions as number,
    })),
  };
}

const ANTI_PATTERN_CANDIDATES: Array<{
  label: string;
  test: (c: PostClassification) => boolean;
}> = [
  {
    label: "news posts without firsthand signal",
    test: (c) => c.sourceType === "news" && !c.hasFirsthandSignal,
  },
  { label: "posts with no concrete numbers", test: (c) => !c.containsNumbers },
  { label: "question endings", test: (c) => c.endingType === "question" },
  {
    label: "announcement hooks that read like recaps",
    test: (c) => c.hookType === "announcement",
  },
  { label: "link-out endings", test: (c) => c.endingType === "linkout" },
  { label: "prediction endings", test: (c) => c.endingType === "prediction" },
];

/**
 * Test each candidate flag against the whole corpus rather than counting it
 * inside the bottom quartile. The old counting approach reported any trait
 * that appeared twice among weak posts, which surfaced traits shared by the
 * strongest posts too — "news without firsthand signal" was reported as the
 * top anti-pattern while marking the two biggest posts in the archive, and
 * "no concrete numbers" was reported while those posts outperformed.
 */
function validateAntiPatterns(items: ClassifiedPost[]): AntiPatternStat[] {
  const ranked = items.filter(
    ({ post }) => typeof post.impressions === "number",
  );

  return ANTI_PATTERN_CANDIDATES.map(({ label, test }) => {
    const withFlag: number[] = [];
    const withoutFlag: number[] = [];
    for (const { post, classification } of ranked) {
      (test(classification) ? withFlag : withoutFlag).push(
        post.impressions as number,
      );
    }
    withFlag.sort((a, b) => a - b);
    withoutFlag.sort((a, b) => a - b);

    const medianWith = median(withFlag);
    const medianWithout = median(withoutFlag);
    const ratio = medianWithout === 0 ? 1 : medianWith / medianWithout;

    let verdict: AntiPatternStat["verdict"];
    if (withFlag.length < ANTI_PATTERN_MIN_N || withoutFlag.length === 0) {
      verdict = "too-few";
    } else if (ratio < ANTI_PATTERN_WORSE_RATIO) {
      verdict = "predictive";
    } else if (ratio > ANTI_PATTERN_BETTER_RATIO) {
      verdict = "inverted";
    } else {
      verdict = "no-signal";
    }

    return {
      label,
      n: withFlag.length,
      medianWith,
      medianWithout,
      ratio: Number(ratio.toFixed(2)),
      verdict,
    };
  }).sort((a, b) => a.ratio - b.ratio);
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

// A family "cools" when its own recent posts fall below its own baseline. Two
// guards keep this from firing on noise: the baseline is the family's p25 (the
// corpus median is dragged upward by a single 128k outlier, which made every
// family look like it was losing), and a family needs MIN_FAMILY_POSTS on
// record before a streak means anything — a 3-post family can otherwise cool
// itself on its first three posts.
function detectCoolingFamilies(
  classified: ClassifiedPost[],
  familyStats: FamilyStat[],
): CoolingFamily[] {
  const WINDOW = 4;
  const MIN_MISSES = 3;
  const MIN_FAMILY_POSTS = 6;

  const baselines = new Map(
    familyStats.map((stat) => [stat.family, stat] as const),
  );

  const byFamily = new Map<TopicFamily, ClassifiedPost[]>();
  for (const item of classified) {
    const family = item.classification.topicFamily;
    const bucket = byFamily.get(family) ?? [];
    bucket.push(item);
    byFamily.set(family, bucket);
  }

  const cooling: CoolingFamily[] = [];
  for (const [family, bucket] of byFamily) {
    const stat = baselines.get(family);
    if (!stat || stat.n < MIN_FAMILY_POSTS) continue;
    const baseline = stat.p25;
    if (baseline <= 0) continue;
    const recent = [...bucket]
      .sort((a, b) => b.post.postedAt.getTime() - a.post.postedAt.getTime())
      .slice(0, WINDOW);
    const impressions = recent.map((item) => item.post.impressions ?? 0);
    const misses = impressions.filter((value) => value < baseline).length;
    if (misses >= MIN_MISSES) {
      cooling.push({
        family,
        recentMisses: misses,
        windowSize: recent.length,
        recentImpressions: impressions,
        baseline,
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

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round(fraction * (sorted.length - 1))),
  );
  return sorted[index] ?? 0;
}

function trim(input: string): string {
  return input.length > 90 ? `${input.slice(0, 87)}...` : input;
}
