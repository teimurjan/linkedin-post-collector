import { describe, expect, test } from "bun:test";
import { matchConceptPath, textSimilarity } from "./concepts.ts";
import type { DraftConcept } from "./concepts.ts";
import type { Post } from "./types.ts";

function post(content: string, postedAt: string): Post {
  return {
    urn: "urn:li:activity:1",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:1/",
    postedAt: new Date(postedAt),
    content,
    analytics: { impressions: null, likes: null, comments: null, shares: null },
    comments: [],
  };
}

describe("textSimilarity", () => {
  test("identical text scores 1", () => {
    expect(textSimilarity("hello brave world", "hello brave world")).toBe(1);
  });

  test("disjoint text scores 0", () => {
    expect(textSimilarity("alpha beta", "gamma delta")).toBe(0);
  });

  test("near-duplicate scores high despite edits and punctuation", () => {
    const a =
      "Linus Torvalds asked people to stop sending AI patches this week.";
    const b =
      'Linus Torvalds asked people to stop sending "AI" patches, this week!';
    expect(textSimilarity(a, b)).toBeGreaterThan(0.8);
  });

  test("empty input scores 0", () => {
    expect(textSimilarity("", "anything here")).toBe(0);
  });
});

describe("matchConceptPath", () => {
  const torvalds: DraftConcept = {
    date: "2026-05-29",
    body: "Linus Torvalds spent the week telling people to stop sending AI patches. Comprehension is the bottleneck, not generation.",
    conceptPath: "concepts/2026-05-29-torvalds/prompt.md",
  };
  const rag: DraftConcept = {
    date: "2026-05-29",
    body: "An agent wrote my first retrieval system in a minute. The one I shipped took two days of fixing edge cases.",
    conceptPath: "concepts/2026-05-29-rag/prompt.md",
  };

  test("returns undefined when no drafts", () => {
    expect(
      matchConceptPath(post("anything", "2026-05-29T12:00:00Z"), []),
    ).toBeUndefined();
  });

  test("picks the closer of two same-date drafts", () => {
    const p = post(
      "Linus Torvalds spent the week telling people to stop sending AI patches. Comprehension is the bottleneck.",
      "2026-05-29T12:00:00Z",
    );
    expect(matchConceptPath(p, [rag, torvalds])).toBe(torvalds.conceptPath);
  });

  test("returns undefined below the similarity threshold", () => {
    const p = post(
      "Completely unrelated post about Rust build tooling speed.",
      "2026-05-29T12:00:00Z",
    );
    expect(matchConceptPath(p, [torvalds, rag])).toBeUndefined();
  });

  test("matches across a one-day publish drift", () => {
    const p = post(torvalds.body, "2026-05-30T09:00:00Z");
    expect(matchConceptPath(p, [torvalds])).toBe(torvalds.conceptPath);
  });

  test("ignores drafts more than a day off", () => {
    const p = post(torvalds.body, "2026-06-02T09:00:00Z");
    expect(matchConceptPath(p, [torvalds])).toBeUndefined();
  });
});
