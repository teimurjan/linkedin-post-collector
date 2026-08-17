import { describe, expect, test } from "bun:test";
import {
  parseDraft,
  parseIdeaLedger,
  parseRetro,
  renderDraftMarkdown,
  renderIdeaLedger,
  renderRetroMarkdown,
} from "./lifecycle.ts";

describe("draft lifecycle frontmatter", () => {
  test("parses expanded draft frontmatter", () => {
    const raw = `---
source_url: https://example.com/source
source_title: Example Source
pitch_angle: Builders should treat containerized installs as the floor.
briefing_date: 2026-05-21
drafted_at: 2026-05-21T12:00:00.000Z
topic_family: security
source_type: news
hook_type: claim
why_now: Another supply-chain compromise landed today.
opinion_wedge: The laptop is the wrong trust boundary.
status: drafted
published_url: https://linkedin.example/post
published_at: 2026-05-22T12:00:00.000Z
impressions_24h: 1200
impressions_72h: 1800
likes_72h: 45
comments_72h: 7
shares_72h: 3
---
Draft body`;

    const draft = parseDraft(raw, "drafts/2026-05-21-test.md");
    expect(draft.topicFamily).toBe("security");
    expect(draft.sourceType).toBe("news");
    expect(draft.hookType).toBe("claim");
    expect(draft.impressions72h).toBe(1800);
    expect(draft.status).toBe("drafted");
  });

  test("preserves backward compatibility for older drafts", () => {
    const raw = `---
source_url: https://example.com/source
source_title: Example Source
pitch_angle: A narrower opinion angle.
briefing_date: 2026-05-19
drafted_at: 2026-05-19T15:30:00.000Z
---
Old draft`;

    const draft = parseDraft(raw, "drafts/2026-05-19-old.md");
    expect(draft.pitchAngle).toBe("A narrower opinion angle.");
    expect(draft.topicFamily).toBeUndefined();
    expect(draft.status).toBe("drafted");
  });
});

describe("idea ledger resilience", () => {
  test("reads a value that opens on a quoted phrase", () => {
    const raw = [
      "---",
      "idea_id: 2026-08-13-01",
      'opinion_wedge: "Choose boring technology" is sold as risk reduction.',
      "status: approved",
      "---",
      "",
    ].join("\n");

    const [entry] = parseIdeaLedger(raw);
    expect(entry?.ideaId).toBe("2026-08-13-01");
    expect(entry?.opinionWedge).toBe(
      '"Choose boring technology" is sold as risk reduction.',
    );
  });

  test("reads a list item containing a colon", () => {
    const raw = [
      "---",
      "idea_id: 2026-08-03-04",
      "evidence_points:",
      '  - "Qwen3.8-Max: $2.00/M input, $6.00/M output vs GPT-5.6 Sol"',
      "  - VS Code full build: 125.7s to 10.6s",
      "status: shortlisted",
      "---",
      "",
    ].join("\n");

    const [entry] = parseIdeaLedger(raw);
    expect(entry?.evidencePoints).toHaveLength(2);
    expect(entry?.evidencePoints[0]).toContain("Qwen3.8-Max");
    expect(entry?.evidencePoints[1]).toContain("125.7s");
  });

  test("keeps every entry when fences sit back-to-back with no body", () => {
    const entry = (n: string, status: string): string =>
      ["---", `idea_id: 2026-05-27-${n}`, `status: ${status}`, "---"].join(
        "\n",
      );
    const raw = `${entry("01", "approved")}\n${entry("02", "shortlisted")}\n${entry("03", "shortlisted")}\n`;

    const entries = parseIdeaLedger(raw);
    expect(entries.map((e) => e.ideaId)).toEqual([
      "2026-05-27-01",
      "2026-05-27-02",
      "2026-05-27-03",
    ]);
    // A following entry's frontmatter must never land in the previous body.
    for (const parsed of entries) expect(parsed.body).not.toContain("idea_id");
  });

  test("preserves a body that follows its frontmatter", () => {
    const raw = [
      "---",
      "idea_id: 2026-05-21-01",
      "status: shortlisted",
      "---",
      "Risk: generic if the evidence stays thin.",
      "---",
      "idea_id: 2026-05-21-02",
      "status: shortlisted",
      "---",
      "",
    ].join("\n");

    const entries = parseIdeaLedger(raw);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.body).toBe("Risk: generic if the evidence stays thin.");
    expect(entries[1]?.body).toBe("");
  });
});

describe("idea ledger and retros", () => {
  test("round-trips idea entries and retros", () => {
    const ledger = renderIdeaLedger([
      {
        ideaId: "2026-05-21-01",
        sourceUrl: "https://example.com/source",
        sourceTitle: "Example Source",
        briefingDate: "2026-05-21",
        topicFamily: "security",
        sourceType: "news",
        angle: "Developer laptops should not be in the blast radius.",
        whyNow: "Fresh incident with clear builder impact.",
        opinionWedge: "Containerization is the floor, not the ceiling.",
        evidencePoints: [
          "317 compromised packages",
          "public exfiltration repo",
        ],
        status: "shortlisted",
        body: "Risk: generic if the evidence stays thin.",
      },
    ]);

    const entries = parseIdeaLedger(ledger);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.ideaId).toBe("2026-05-21-01");

    // Fields the ideator writes that used to be dropped on render.
    const full = renderIdeaLedger([
      {
        ...(entries[0] as NonNullable<(typeof entries)[0]>),
        format: "carousel",
        score: 11,
        experienceHook: "none — wedge-driven news take",
        reachCeiling: 2,
        reachTier: "t2-universal",
        wikiRev: "2026-08-17",
        risk: "rehash",
      },
    ]);
    const reparsed = parseIdeaLedger(full)[0];
    expect(reparsed?.format).toBe("carousel");
    expect(reparsed?.score).toBe(11);
    expect(reparsed?.experienceHook).toBe("none — wedge-driven news take");
    expect(reparsed?.reachCeiling).toBe(2);
    expect(reparsed?.reachTier).toBe("t2-universal");
    expect(reparsed?.wikiRev).toBe("2026-08-17");
    expect(reparsed?.risk).toBe("rehash");

    const retroMarkdown = renderRetroMarkdown({
      kind: "retro",
      draftFile: "drafts/2026-05-21-test.md",
      topicFamily: "security",
      sourceType: "news",
      publishedUrl: "https://linkedin.example/post",
      publishedAt: "2026-05-24T12:00:00.000Z",
      impressions24h: 900,
      impressions72h: 1400,
      likes72h: 30,
      comments72h: 4,
      shares72h: 2,
      beatMedianImpressions: true,
      beatPeerGroup: true,
      discussionValidated: true,
      hookMatchedBody: true,
      wikiIngested: true,
      decision: "repeat",
      summary:
        "Concrete supply-chain claims with crisp mitigation advice still travel.",
      body: "Repeat the pattern when there is a fresh artifact to anchor the claim.",
    });

    const retro = parseRetro(retroMarkdown, "retros/2026-05-24-test.md");
    expect(retro.decision).toBe("repeat");
    expect(retro.beatPeerGroup).toBe(true);
  });

  test("renders expanded draft markdown", () => {
    const raw = renderDraftMarkdown(
      {
        sourceUrl: "https://example.com/source",
        sourceTitle: "Example Source",
        pitchAngle:
          "Tooling APIs for agents are becoming the real product surface.",
        briefingDate: "2026-05-21",
        draftedAt: "2026-05-21T12:00:00.000Z",
        topicFamily: "agents",
        sourceType: "news",
        hookType: "claim",
        whyNow:
          "A fresh launch made the machine-readable compiler surface explicit.",
        opinionWedge: "The toolchain matters more than the language marketing.",
      },
      "Draft body",
    );

    const draft = parseDraft(raw);
    expect(draft.topicFamily).toBe("agents");
    expect(draft.status).toBe("drafted");
  });
});
