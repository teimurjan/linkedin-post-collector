import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadPosts } from "./analyze.ts";
import {
  analyzePostPatterns,
  classifyPost,
  renderPostPatternsMarkdown,
} from "./patterns.ts";

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
  test("matches the current corpus golden report", async () => {
    const posts = await loadPosts();
    const report = renderPostPatternsMarkdown(analyzePostPatterns(posts));
    const goldenPath = resolve(
      process.cwd(),
      "test/fixtures/post-patterns.golden.md",
    );
    const golden = await readFile(goldenPath, "utf8");
    expect(report).toBe(golden.trimEnd());
  });
});
