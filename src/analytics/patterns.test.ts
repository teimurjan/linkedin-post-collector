import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PostRecord } from "./analyze.ts";
import { loadPosts } from "./analyze.ts";
import { analyzePostPatterns, classifyPost } from "./patterns.ts";

function makePost(
  firstLine: string,
  impressions: number | null,
  postedAt: string,
): PostRecord {
  const body = `${firstLine}\n\nbody text with a number 42.`;
  return {
    urn: `urn:${postedAt}`,
    url: "https://example.com/post",
    postedAt: new Date(postedAt),
    impressions,
    likes: null,
    comments: null,
    shares: null,
    body,
    file: `posts/${postedAt}.md`,
    firstLine,
    length: body.length,
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
  test("flags a topic family as cooling when 3 of the last 4 are sub-median", async () => {
    const posts = await loadPosts();
    const report = analyzePostPatterns(posts);
    // Live corpus is the source of truth; assert shape, not specific families.
    for (const cooling of report.coolingFamilies) {
      expect(cooling.windowSize).toBeGreaterThanOrEqual(3);
      expect(cooling.recentMisses).toBeGreaterThanOrEqual(3);
      expect(cooling.recentImpressions.length).toBe(cooling.windowSize);
      const subMedian = cooling.recentImpressions.filter(
        (value) => value < report.corpus.medianImpressions,
      ).length;
      expect(subMedian).toBe(cooling.recentMisses);
    }
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
    expect(report.recentHooks[0].postedAt).toBe("2026-05-10");
  });
});
