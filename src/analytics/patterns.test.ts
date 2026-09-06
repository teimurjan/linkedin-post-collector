import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PostRecord } from "./analyze.ts";
import { loadPosts } from "./analyze.ts";
import {
  analyzePostPatterns,
  classifyPost,
  renderPostPatternsMarkdown,
} from "./patterns.ts";

function makePost(
  firstLine: string,
  impressions: number | null,
  postedAt: string,
  overrides: Partial<PostRecord> = {},
): PostRecord {
  const body = `${firstLine}\n\nbody text with a number 42.`;
  const posted = new Date(postedAt);
  return {
    urn: `urn:${postedAt}`,
    url: "https://example.com/post",
    postedAt: posted,
    scrapedAt: new Date(posted.getTime() + 72 * 3_600_000),
    lane: "news",
    scrapeAgeHours: 72,
    impressions,
    likes: null,
    comments: null,
    shares: null,
    body,
    file: `posts/${postedAt}.md`,
    firstLine,
    length: body.length,
    ...overrides,
  };
}

describe("classifyPost", () => {
  test("classifies SolidJS post as frontend launch", async () => {
    const file = resolve(
      process.cwd(),
      "posts/2026/03-11-solidjs-v2-beta-is-out-and-it-quietly-changes-how-async-ui-w.md",
    );
    const raw = await readFile(file, "utf8");
    const body = raw.split("---\n").slice(2).join("---\n").trim();
    const classification = classifyPost({
      body,
      firstLine: "SolidJS v2 beta is out.",
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7437497920708395008/",
    });

    expect(classification.topicFamily).toBe("frontend");
    expect(classification.sourceType).toBe("launch");
    expect(classification.hookType).toBe("announcement");
    expect(classification.endingType).toBe("linkout");
  });

  test("classifies firsthand AI experiment correctly", () => {
    const classification = classifyPost({
      firstLine: "Tiny models are getting weirdly useful.",
      body: [
        "Tiny models are getting weirdly useful.",
        "",
        "I've been experimenting with SLMs running directly in the browser.",
        "I built a small component around Qwen 3 and ran prompt optimization passes on a dataset.",
        "",
        "Curious what other UI components could benefit from something like this?",
      ].join("\n"),
      url: "https://example.com/post",
    });

    expect(classification.topicFamily).toBe("frontend");
    expect(classification.sourceType).toBe("build_log");
    expect(classification.containsNumbers).toBe(true);
    expect(classification.hasFirsthandSignal).toBe(true);
    expect(classification.endingType).toBe("question");
  });
});

describe("post-patterns report", () => {
  test("flags a topic family as cooling against its own p25 baseline", async () => {
    const posts = await loadPosts();
    const report = analyzePostPatterns(posts);
    // Live corpus is the source of truth; assert shape, not specific families.
    for (const cooling of report.coolingFamilies) {
      expect(cooling.windowSize).toBeGreaterThanOrEqual(3);
      expect(cooling.recentMisses).toBeGreaterThanOrEqual(3);
      expect(cooling.recentImpressions.length).toBe(cooling.windowSize);
      const below = cooling.recentImpressions.filter(
        (value) => value < cooling.baseline,
      ).length;
      expect(below).toBe(cooling.recentMisses);

      // A family needs 6 posts of record before a streak can mean anything.
      const stat = report.familyStats.find(
        (entry) => entry.family === cooling.family,
      );
      expect(stat?.n ?? 0).toBeGreaterThanOrEqual(6);
    }
  });

  test("does not cool a family with fewer than 6 posts of record", () => {
    // Four posts, all far below the family's own spread. Under the old
    // corpus-median rule this would cool on its first four posts.
    const posts = [
      makePost("React 19 shipped a new compiler.", 10, "2026-06-01"),
      makePost("React server components changed again.", 10, "2026-06-02"),
      makePost("React is dropping a jsx runtime flag.", 10, "2026-06-03"),
      makePost("React nudged the dom reconciler.", 9000, "2026-06-04"),
    ];
    const report = analyzePostPatterns(posts);

    const frontend = report.familyStats.find((s) => s.family === "frontend");
    expect(frontend?.n).toBe(4);
    expect(report.coolingFamilies).toEqual([]);
  });

  test("familyStats counts the full corpus, not just the quartiles", async () => {
    const posts = await loadPosts();
    const report = analyzePostPatterns(posts);

    const totalInStats = report.familyStats.reduce((sum, s) => sum + s.n, 0);
    expect(totalInStats).toBe(report.corpus.withImpressions);
    expect(report.postIndex.length).toBe(report.corpus.withImpressions);

    // Quartile buckets are a subset, so a family's bucket count can never
    // exceed its corpus count. This is the inversion that made a 2-post
    // bucket read as the top family.
    for (const bucket of report.topBucketsByTopic) {
      expect(bucket.sampleSize).toBeLessThanOrEqual(bucket.corpusSampleSize);
    }
    for (const stat of report.familyStats) {
      expect(stat.p25).toBeLessThanOrEqual(stat.median);
      expect(stat.median).toBeLessThanOrEqual(stat.p75);
      expect(stat.min).toBeLessThanOrEqual(stat.max);
    }
  });

  test("renders sample size and marks thin buckets as uncitable", async () => {
    const posts = await loadPosts();
    const markdown = renderPostPatternsMarkdown(analyzePostPatterns(posts));

    expect(markdown).toContain("## Topic family distribution (full corpus)");
    expect(markdown).toContain("## Impressions by scrape age");
    expect(markdown).toMatch(/n=\d+ here, n=\d+ corpus-wide/);
    expect(markdown).toContain("too few to cite");
    expect(markdown).toContain("Metric coverage:");
  });

  test("only reports an anti-pattern that marks underperforming posts", async () => {
    const posts = await loadPosts();
    const report = analyzePostPatterns(posts);

    for (const stat of report.antiPatterns) {
      expect(stat.verdict).toBe("predictive");
      expect(stat.n).toBeGreaterThanOrEqual(4);
      expect(stat.ratio).toBeLessThan(0.7);
      expect(stat.medianWith).toBeLessThan(stat.medianWithout);
    }

    // A trait shared by the strongest posts must never be called a fault.
    const labels = report.antiPatterns.map((s) => s.label);
    expect(labels).not.toContain("news posts without firsthand signal");
    expect(labels).not.toContain("posts with no concrete numbers");

    // Discredited flags stay visible so they are not silently reintroduced.
    const discredited = report.discreditedPatterns.map((s) => s.label);
    expect(discredited).toContain("news posts without firsthand signal");
    for (const stat of report.discreditedPatterns) {
      expect(["inverted", "no-signal"]).toContain(stat.verdict);
    }
  });

  // `detectEndingType` reads the final paragraph, so the trailing "?" has to
  // live there rather than in the hook.
  const withQuestionEnding = (
    label: string,
    impressions: number,
    postedAt: string,
  ): PostRecord => {
    const body = `${label}\n\nSo what would you reach for here?`;
    return makePost(label, impressions, postedAt, { body });
  };

  test("calls out an inverted flag rather than hiding it", () => {
    // Question endings outperform in this corpus, the opposite of the real
    // one. The report must say so instead of dropping the flag.
    const posts = [
      ...Array.from({ length: 5 }, (_, i) =>
        withQuestionEnding(`Strong hook ${i}.`, 5000, `2026-06-0${i + 1}`),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makePost(`Weak hook number ${i}.`, 100, `2026-07-0${i + 1}`),
      ),
    ];
    const report = analyzePostPatterns(posts);

    const question = [
      ...report.antiPatterns,
      ...report.discreditedPatterns,
    ].find((s) => s.label === "question endings");
    expect(question?.verdict).toBe("inverted");
    expect(question?.medianWith).toBeGreaterThan(question?.medianWithout ?? 0);
    expect(report.antiPatterns.map((s) => s.label)).not.toContain(
      "question endings",
    );
  });

  test("withholds a verdict on a flag with too few posts", () => {
    const posts = [
      withQuestionEnding("A lone question.", 10, "2026-06-01"),
      ...Array.from({ length: 6 }, (_, i) =>
        makePost(`Plain statement number ${i}.`, 900, `2026-07-0${i + 1}`),
      ),
    ];
    const report = analyzePostPatterns(posts);

    const labels = [...report.antiPatterns, ...report.discreditedPatterns].map(
      (s) => s.label,
    );
    expect(labels).not.toContain("question endings");
  });

  test("reports a trimmed median alongside the raw one", async () => {
    const posts = await loadPosts();
    const report = analyzePostPatterns(posts);

    expect(report.outlierAdjusted.median).toBe(report.corpus.medianImpressions);
    expect(report.outlierAdjusted.trimmedMedian).toBeLessThanOrEqual(
      report.outlierAdjusted.median,
    );
    expect(report.metricCoverage.impressions).toBe(
      report.corpus.withImpressions,
    );
  });

  test("groups impressions by scrape-age cohort", () => {
    const posts = [
      makePost("Fresh post about react.", 100, "2026-06-01", {
        scrapeAgeHours: 24,
      }),
      makePost("Another fresh post about react.", 300, "2026-06-02", {
        scrapeAgeHours: 30,
      }),
      makePost("Mature post about react.", 5000, "2026-01-01", {
        scrapeAgeHours: 24 * 120,
      }),
    ];
    const report = analyzePostPatterns(posts);

    const fresh = report.cohortMedians.find(
      (c) => c.scrapeAgeBucket === "under 48h",
    );
    const mature = report.cohortMedians.find(
      (c) => c.scrapeAgeBucket === "over 3 months",
    );

    expect(fresh).toEqual({ scrapeAgeBucket: "under 48h", n: 2, median: 200 });
    expect(mature?.n).toBe(1);
    expect(mature?.median).toBe(5000);
  });
});

describe("recent-hook frame guard", () => {
  test("tags the pronoun-pivot frame on both surface variants", () => {
    const posts = [
      makePost(
        "Everyone read 4B params. I read 0.93 gigabytes.",
        300,
        "2026-06-01",
      ),
      makePost(
        "Everyone sees free VRAM. I see a 32 GB/s wall.",
        300,
        "2026-06-03",
      ),
      makePost("SolidJS v2 beta is out.", 300, "2026-05-20"),
    ];
    const report = analyzePostPatterns(posts);
    const pivot = report.recentHooks.filter(
      (hook) => hook.frame === "pronoun-pivot (everyone X, I Y)",
    );

    expect(pivot.length).toBe(2);
    expect(
      report.recentHooks.find((h) => h.firstLine.startsWith("SolidJS"))?.frame,
    ).toBeNull();
  });

  test("flags a repeated frame and marks it weak when a prior use was sub-median", () => {
    const posts = [
      makePost(
        "Everyone read 4B params. I read 0.93 gigabytes.",
        100,
        "2026-06-01",
      ),
      makePost(
        "Everyone sees free VRAM. I see a 32 GB/s wall.",
        5000,
        "2026-06-03",
      ),
    ];
    const report = analyzePostPatterns(posts);

    expect(report.repeatedFrames.length).toBe(1);
    expect(report.repeatedFrames[0]).toContain("pronoun-pivot");
    expect(report.repeatedFrames[0]).toContain("sub-median");
  });

  test("caps the recent-hook window at 8 entries, newest first", () => {
    const posts = Array.from({ length: 10 }, (_, index) =>
      makePost(
        `Hook number ${index}.`,
        300,
        `2026-05-${String(index + 1).padStart(2, "0")}`,
      ),
    );
    const report = analyzePostPatterns(posts);

    expect(report.recentHooks.length).toBe(8);
    expect(report.recentHooks[0]?.postedAt).toBe("2026-05-10");
  });
});

describe("lane scoping", () => {
  const news = [
    makePost("News one.", 1000, "2026-08-01T12:00:00Z"),
    makePost("News two.", 3000, "2026-08-03T12:00:00Z"),
    makePost("News three.", 5000, "2026-08-05T12:00:00Z"),
  ];
  const experience = [
    makePost("I shipped it.", 200, "2026-08-02T12:00:00Z", {
      lane: "experience",
    }),
    makePost("I measured it.", 400, "2026-08-04T12:00:00Z", {
      lane: "experience",
    }),
  ];

  test("an unscoped report covers both lanes and tabulates each", () => {
    const report = analyzePostPatterns([...news, ...experience]);
    expect(report.lane).toBeUndefined();
    expect(report.corpus.total).toBe(5);
    expect(report.laneStats).toEqual([
      expect.objectContaining({ lane: "news", n: 3, median: 3000 }),
      expect.objectContaining({ lane: "experience", n: 2, median: 300 }),
    ]);
    expect(report.postIndex.map((entry) => entry.lane)).toContain("experience");
  });

  test("a lane-scoped report excludes the other lane everywhere but the lane table", () => {
    const report = analyzePostPatterns([...news, ...experience], [], {
      lane: "experience",
    });
    expect(report.lane).toBe("experience");
    expect(report.corpus.total).toBe(2);
    expect(report.corpus.medianImpressions).toBe(300);
    expect(report.postIndex.every((entry) => entry.lane === "experience")).toBe(
      true,
    );
    expect(report.laneStats.find((s) => s.lane === "news")?.n).toBe(3);

    const markdown = renderPostPatternsMarkdown(report);
    expect(markdown).toContain("Scoped to the `experience` lane");
    expect(markdown).toContain("## Lanes (full archive)");
  });

  test("lane scoping drops the other lane's retros; unlabeled retros count as news", () => {
    const retro = (
      lane: "news" | "experience" | undefined,
      summary: string,
    ) => ({
      kind: "retro" as const,
      draftFile: "drafts/x.md",
      topicFamily: "other" as const,
      sourceType: "news" as const,
      ...(lane ? { lane } : {}),
      publishedUrl: "",
      publishedAt: "2026-08-01T00:00:00.000Z",
      beatMedianImpressions: true,
      beatPeerGroup: true,
      discussionValidated: true,
      hookMatchedBody: true,
      decision: "repeat" as const,
      summary,
      wikiIngested: true,
      file: "retros/x.md",
      body: "",
    });
    const retros = [
      retro(undefined, "legacy news lesson"),
      retro("experience", "experience lesson"),
    ];

    const scoped = analyzePostPatterns([...news, ...experience], retros, {
      lane: "experience",
    });
    expect(scoped.retroSignals.join("\n")).toContain("experience lesson");
    expect(scoped.retroSignals.join("\n")).not.toContain("legacy news lesson");

    const newsOnly = analyzePostPatterns([...news, ...experience], retros, {
      lane: "news",
    });
    expect(newsOnly.retroSignals.join("\n")).toContain("legacy news lesson");
  });
});
