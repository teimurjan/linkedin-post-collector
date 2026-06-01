import { describe, expect, test } from "bun:test";
import { rejectIdeaCandidate, totalScore } from "./ideation.ts";
import type { DraftRecord } from "./lifecycle.ts";

describe("ideation rejection rules", () => {
  const now = new Date("2026-05-21T12:00:00.000Z");

  test("rejects duplicate source URLs from recent drafts", () => {
    const drafts: DraftRecord[] = [
      {
        file: "/tmp/drafts/2026-05-20-supply-chain.md",
        body: "draft body",
        pitchAngle:
          "Containerize installs before the next npm supply-chain hit.",
        draftedAt: "2026-05-20T10:00:00.000Z",
        sourceUrl: "https://example.com/npm-attack",
        status: "drafted",
      },
    ];

    const reasons = rejectIdeaCandidate({
      now,
      drafts,
      posts: [],
      candidate: {
        angle: "Containerize installs before the next npm supply-chain hit.",
        sourceUrl: "https://example.com/npm-attack",
        sourceTitle: "Attack writeup",
        briefingDate: "2026-05-21",
        topicFamily: "security",
        sourceType: "news",
        whyNow: "Fresh incident.",
        opinionWedge: "Developer laptops should be outside the blast radius.",
        evidencePoints: [
          "317 packages compromised",
          "preinstall hook exfiltrated secrets",
        ],
        scores: {
          heat: 2,
          specificity: 2,
          differentiation: 1,
          builderFit: 1,
          discussionPotential: 1,
        },
      },
    });

    expect(reasons).toContain(
      "near-duplicate of a draft from the last 30 days",
    );
  });

  test("rejects same-topic sequel without a new artifact", () => {
    const reasons = rejectIdeaCandidate({
      now,
      drafts: [],
      posts: [
        {
          postedAt: new Date("2026-05-20T16:30:00.000Z"),
          topicFamily: "security",
          firstLine:
            "Yesterday I posted about TeamPCP and 637 malicious npm versions. Today the same group is claiming GitHub itself.",
          url: "https://www.linkedin.com/feed/update/team-pcp",
        },
      ],
      candidate: {
        angle:
          "TeamPCP is moving through the software supply chain and the next obvious targets are the smaller registries.",
        sourceUrl: "https://example.com/github-breach-claim",
        sourceTitle: "GitHub breach claim",
        briefingDate: "2026-05-21",
        topicFamily: "security",
        sourceType: "news",
        whyNow: "A day-after sequel to the same story.",
        opinionWedge: "Registries with smaller security teams are next.",
        evidencePoints: [
          "Same crew claimed a new target",
          "No new benchmark or dataset yet",
        ],
        scores: {
          heat: 2,
          specificity: 2,
          differentiation: 1,
          builderFit: 1,
          discussionPotential: 1,
        },
      },
    });

    expect(reasons).toContain("same-topic sequel without a new artifact");
  });

  test("rejects generic recap angles with no opinion wedge", () => {
    const candidate = {
      angle: "A new framework beta shipped and people are discussing it.",
      sourceUrl: "https://example.com/framework-beta",
      sourceTitle: "Framework beta",
      briefingDate: "2026-05-21",
      topicFamily: "frontend" as const,
      sourceType: "news" as const,
      whyNow: "It happened today.",
      opinionWedge: "",
      evidencePoints: ["The beta shipped"],
      scores: {
        heat: 1 as const,
        specificity: 1 as const,
        differentiation: 0 as const,
        builderFit: 1 as const,
        discussionPotential: 0 as const,
      },
    };

    expect(totalScore(candidate.scores)).toBeLessThan(7);
    const reasons = rejectIdeaCandidate({
      now,
      drafts: [],
      posts: [],
      candidate,
    });

    expect(reasons).toContain("score below 7/10");
    expect(reasons).toContain("news recap with no opinion wedge");
    expect(reasons).toContain("thin news recap");
  });
});
