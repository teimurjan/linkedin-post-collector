import { describe, expect, test } from "bun:test";
import { critiqueDraft } from "./critic.ts";
import {
  parseDraft,
  parseIdeaLedger,
  parseRetro,
  renderDraftMarkdown,
  renderIdeaLedger,
  renderRetroMarkdown,
} from "./lifecycle.ts";

describe("builder-reach workflow", () => {
  test("runs idea brief -> draft -> critic -> retro", () => {
    const ledger = renderIdeaLedger([
      {
        ideaId: "2026-05-21-01",
        sourceUrl: "https://example.com/zero",
        sourceTitle: "Zero",
        briefingDate: "2026-05-21",
        topicFamily: "agents",
        sourceType: "news",
        angle:
          "The agent-native compiler API matters more than the language pitch.",
        whyNow: "Zero made machine-readable diagnostics the headline.",
        opinionWedge:
          "The JSON toolchain surface is the part incumbents will copy first.",
        evidencePoints: [
          "stable diagnostic codes",
          "typed repair metadata",
          "JSON graph output",
        ],
        status: "approved",
        body: "Risk: rehash if the draft only restates the launch post.",
      },
    ]);
    const [idea] = parseIdeaLedger(ledger);
    expect(idea).toBeDefined();

    const draftMarkdown = renderDraftMarkdown(
      {
        sourceUrl: idea!.sourceUrl,
        sourceTitle: idea!.sourceTitle,
        pitchAngle: idea!.angle,
        briefingDate: idea!.briefingDate,
        draftedAt: "2026-05-21T12:30:00.000Z",
        topicFamily: idea!.topicFamily,
        sourceType: idea!.sourceType,
        hookType: "claim",
        whyNow: idea!.whyNow,
        opinionWedge: idea!.opinionWedge,
        status: "drafted",
      },
      [
        'Most "agent-native" language launches are really tooling launches.',
        "",
        "Zero is interesting because it makes stable diagnostic codes, typed repair metadata, and JSON graph output part of the pitch on day one.",
        "",
        "That matters more than the language syntax. Agents do not care about syntax aesthetics. They care about whether the compiler emits a machine-readable interface they can loop on without scraping terminal text.",
        "",
        "Rust or Zig could copy that surface faster than a new language can win production adoption.",
        "",
        "My takeaway is simple: the part worth watching is the toolchain API, not the branding.",
      ].join("\n"),
    );
    const draft = parseDraft(draftMarkdown, "drafts/2026-05-21-zero.md");
    const critique = critiqueDraft(idea!, draft.body);

    expect(critique.approved).toBe(true);

    const retroMarkdown = renderRetroMarkdown({
      draftFile: draft.file,
      topicFamily: draft.topicFamily ?? "agents",
      sourceType: draft.sourceType ?? "news",
      publishedUrl: "https://linkedin.example/zero",
      publishedAt: "2026-05-24T12:30:00.000Z",
      impressions24h: 1800,
      impressions72h: 2600,
      likes72h: 40,
      comments72h: 9,
      shares72h: 4,
      beatMedianImpressions: true,
      beatPeerGroup: true,
      discussionValidated: true,
      hookMatchedBody: true,
      decision: "repeat",
      summary:
        "Opinionated toolchain framing outperformed generic launch commentary.",
      body: "Repeat when a launch exposes a genuinely machine-readable builder surface.",
    });

    const retro = parseRetro(retroMarkdown, "retros/2026-05-24-zero.md");
    expect(retro.summary).toContain("toolchain");
    expect(retro.decision).toBe("repeat");
  });
});
