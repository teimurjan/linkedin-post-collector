import { describe, expect, test } from "bun:test";
import type { PostRecord } from "../analytics/analyze.ts";
import type { RetroRecord } from "../analytics/lifecycle.ts";
import { analyzePostPatterns } from "../analytics/patterns.ts";
import { type Finding, type LintInput, lintWiki } from "./lint.ts";
import { type WikiPage, collectPostPaths } from "./schema.ts";

function makePost(file: string, impressions: number): PostRecord {
  const body = "React shipped a thing. It has 42 numbers in it.";
  const postedAt = new Date("2026-06-01");
  return {
    urn: `urn:${file}`,
    url: "https://example.com/post",
    postedAt,
    scrapedAt: new Date(postedAt.getTime() + 72 * 3_600_000),
    lane: "news",
    scrapeAgeHours: 72,
    impressions,
    likes: null,
    comments: null,
    shares: null,
    body,
    file: `${process.cwd()}/${file}`,
    firstLine: "React shipped a thing.",
    length: body.length,
  };
}

function makePage(
  slug: string,
  frontmatter: Record<string, unknown>,
  body = "",
): WikiPage {
  return {
    file: `${process.cwd()}/wiki/${slug}.md`,
    repoPath: `wiki/${slug}.md`,
    slug,
    frontmatter,
    body,
    evidencePosts: collectPostPaths(frontmatter.evidence_posts),
    counterPosts: collectPostPaths(frontmatter.counter_posts),
    citedPosts: collectPostPaths(frontmatter),
  };
}

const POSTS = [
  makePost("posts/2026/06-01-a.md", 100),
  makePost("posts/2026/06-02-b.md", 300),
  makePost("posts/2026/06-03-c.md", 500),
];

function lint(
  pages: WikiPage[],
  overrides: Partial<LintInput> = {},
): Finding[] {
  return lintWiki({
    pages,
    report: analyzePostPatterns(POSTS),
    postFiles: new Set([
      "posts/2026/06-01-a.md",
      "posts/2026/06-02-b.md",
      "posts/2026/06-03-c.md",
    ]),
    skillFiles: new Map(),
    logRaw: null,
    retros: [],
    ...overrides,
  });
}

function makeRetro(
  file: string,
  fields: Partial<RetroRecord> = {},
): RetroRecord {
  return {
    kind: "retro",
    draftFile: `drafts/${file}.md`,
    topicFamily: "agents",
    sourceType: "news",
    publishedUrl: "https://linkedin.example/post",
    publishedAt: "2026-08-06T13:00:00.000Z",
    beatMedianImpressions: false,
    beatPeerGroup: false,
    discussionValidated: false,
    hookMatchedBody: true,
    decision: "modify",
    summary: "Room size, not craft.",
    wikiIngested: true,
    file: `${process.cwd()}/retros/${file}.md`,
    body: "",
    ...fields,
  };
}

function checks(findings: Finding[]): string[] {
  return findings.map((f) => f.check);
}

const VALID = {
  page: "audience",
  kind: "audience",
  title: "Tiers",
  status: "active",
  last_revised: "2026-08-17",
  confidence: "low",
  evidence_n: 2,
  observed_n: 2,
  observed_median: 200,
  observed_min: 100,
  observed_max: 300,
  evidence_posts: ["posts/2026/06-01-a.md", "posts/2026/06-02-b.md"],
};

describe("wiki lint", () => {
  test("a well-formed page produces no findings", () => {
    expect(lint([makePage("audience", VALID)])).toEqual([]);
  });

  test("flags a citation to a post that does not exist", () => {
    const findings = lint([
      makePage("audience", {
        ...VALID,
        evidence_posts: ["posts/2026/06-01-a.md", "posts/2026/99-99-gone.md"],
        observed_n: 1,
        observed_median: 100,
        observed_min: 100,
        observed_max: 100,
      }),
    ]);
    expect(checks(findings)).toContain("broken-citation");
    expect(findings[0]?.severity).toBe("error");
  });

  test("recomputes claimed statistics from the cited posts", () => {
    const findings = lint([
      makePage("audience", { ...VALID, observed_median: 999 }),
    ]);
    const stale = findings.find((f) => f.check === "stale-numeric");
    expect(stale?.severity).toBe("error");
    expect(stale?.message).toContain("999");
    expect(stale?.message).toContain("200");
  });

  test("verifies per-tier statistics inside a nested block", () => {
    const findings = lint([
      makePage("audience", {
        page: "audience",
        kind: "audience",
        title: "Tiers",
        last_revised: "2026-08-17",
        confidence: "low",
        evidence_n: 2,
        tiers: [
          {
            id: "t2-universal",
            observed_n: 2,
            observed_median: 400,
            exemplars: [
              { post: "posts/2026/06-02-b.md", impressions: 300 },
              { post: "posts/2026/06-03-c.md", impressions: 500 },
            ],
          },
        ],
      }),
    ]);
    expect(checks(findings)).not.toContain("stale-numeric");

    const broken = lint([
      makePage("audience", {
        page: "audience",
        kind: "audience",
        title: "Tiers",
        last_revised: "2026-08-17",
        tiers: [
          {
            id: "t2-universal",
            observed_n: 2,
            observed_median: 123,
            exemplars: [{ post: "posts/2026/06-02-b.md", impressions: 300 }],
          },
        ],
      }),
    ]);
    const stale = broken.find((f) => f.check === "stale-numeric");
    expect(stale?.message).toContain("t2-universal");
  });

  test("holds confidence to its evidence floor", () => {
    const findings = lint([
      makePage("audience", { ...VALID, confidence: "high", evidence_n: 2 }),
    ]);
    const finding = findings.find((f) => f.check === "confidence-evidence");
    expect(finding?.severity).toBe("error");
    expect(finding?.message).toContain("evidence_n >= 8");
  });

  test("warns when a claim has never been tested against a miss", () => {
    const findings = lint([
      makePage("audience", {
        ...VALID,
        confidence: "medium",
        evidence_n: 5,
      }),
    ]);
    const finding = findings.find((f) => f.check === "no-counter-evidence");
    expect(finding?.severity).toBe("warning");
  });

  test("escalates a stale corpus fingerprint past 10 posts", () => {
    const warn = lint([makePage("audience", { ...VALID, posts_covered: 2 })]);
    expect(warn.find((f) => f.check === "stale-fingerprint")?.severity).toBe(
      "warning",
    );

    const bigCorpus = analyzePostPatterns(
      Array.from({ length: 40 }, (_, i) =>
        makePost(`posts/2026/06-${String(i + 1).padStart(2, "0")}-x.md`, 300),
      ),
    );
    const err = lint([makePage("audience", { ...VALID, posts_covered: 2 })], {
      report: bigCorpus,
    });
    expect(err.find((f) => f.check === "stale-fingerprint")?.severity).toBe(
      "error",
    );
  });

  test("flags a skill pointing at a wiki page that does not exist", () => {
    const findings = lint([makePage("audience", VALID)], {
      skillFiles: new Map([
        [
          ".agents/skills/post-image/SKILL.md",
          "consult wiki/imagery.md before picking a metaphor",
        ],
      ]),
    });
    const finding = findings.find((f) => f.check === "dangling-wiki-path");
    expect(finding?.severity).toBe("error");
    expect(finding?.page).toBe(".agents/skills/post-image/SKILL.md");
  });

  test("does not flag a skill pointing at a page that exists", () => {
    const findings = lint([makePage("audience", VALID)], {
      skillFiles: new Map([
        [".agents/skills/post-ideator/SKILL.md", "read wiki/audience.md first"],
      ]),
    });
    expect(checks(findings)).not.toContain("dangling-wiki-path");
  });

  test("flags a body number with no frontmatter twin", () => {
    const findings = lint([
      makePage("audience", VALID, "The family median is 4711 impressions."),
    ]);
    const finding = findings.find((f) => f.check === "loose-number");
    expect(finding?.severity).toBe("warning");
    expect(finding?.message).toContain("4711");
  });

  test("accepts a body number that is declared in frontmatter", () => {
    const findings = lint([
      makePage(
        "audience",
        { ...VALID, context_stats: { family_median: 4711 } },
        "The family median is 4711 impressions.",
      ),
    ]);
    expect(checks(findings)).not.toContain("loose-number");
  });

  test("ignores calendar years and small numbers in prose", () => {
    const findings = lint([
      makePage("audience", VALID, "In 2026 we saw 42 posts do this."),
    ]);
    expect(checks(findings)).not.toContain("loose-number");
  });

  test("requires a log entry naming each revised page", () => {
    const missing = lint([makePage("audience", VALID)], {
      logRaw:
        "## [2026-08-17] ingest | something else\n\n- contradicted: none\n",
    });
    expect(missing.find((f) => f.check === "log-completeness")?.severity).toBe(
      "error",
    );

    const present = lint([makePage("audience", VALID)], {
      logRaw:
        "## [2026-08-17] ingest | tiers\n\n- changed:\n  - wiki/audience.md — created\n- contradicted: none\n",
    });
    expect(checks(present)).not.toContain("log-completeness");
  });

  test("requires every log entry to state what it contradicted", () => {
    const findings = lint([], {
      logRaw:
        "## [2026-08-17] ingest | tiers\n\n- changed:\n  - wiki/audience.md — created\n",
    });
    const finding = findings.find((f) => f.check === "log-completeness");
    expect(finding?.page).toBe("wiki/log.md");
    expect(finding?.message).toContain("contradicted");
  });

  test("rejects a page whose id disagrees with its path", () => {
    const findings = lint([
      makePage("audience", { ...VALID, page: "plays/x" }),
    ]);
    const finding = findings.find((f) => f.check === "schema");
    expect(finding?.message).toContain("does not match its path");
  });

  test("rejects a kind filed in the wrong directory", () => {
    const findings = lint([
      makePage("loose-play", {
        ...VALID,
        page: "loose-play",
        kind: "play",
      }),
    ]);
    expect(
      findings.find((f) => f.message.includes("belongs under wiki/plays/")),
    ).toBeDefined();
  });

  test("warns when a page is missing from the index", () => {
    const findings = lint([
      makePage("index", {
        page: "index",
        kind: "index",
        title: "Wiki index",
        last_revised: "2026-08-17",
      }),
      makePage("audience", VALID),
    ]);
    const finding = findings.find((f) => f.check === "orphan");
    expect(finding?.severity).toBe("warning");
    expect(finding?.page).toBe("wiki/audience.md");
  });

  test("warns when no other page links to a page", () => {
    const findings = lint([
      makePage("index", {
        page: "index",
        kind: "index",
        title: "Wiki index",
        last_revised: "2026-08-17",
      }),
      makePage("audience", VALID, "Tiers live here."),
      makePage(
        "plays/mainstream-tool",
        { ...VALID, page: "plays/mainstream-tool", kind: "play" },
        "Shape of a winning news take.",
      ),
    ]);
    const orphans = findings
      .filter((f) => f.check === "no-inbound-links")
      .map((f) => f.page);
    expect(orphans).toContain("wiki/audience.md");
    expect(orphans).toContain("wiki/plays/mainstream-tool.md");
  });

  test("accepts a wikilink as an inbound reference", () => {
    const findings = lint([
      makePage(
        "audience",
        VALID,
        "See [[plays/mainstream-tool]] for the shape.",
      ),
      makePage(
        "plays/mainstream-tool",
        { ...VALID, page: "plays/mainstream-tool", kind: "play" },
        "Grounded in [[audience]].",
      ),
    ]);
    expect(checks(findings)).not.toContain("no-inbound-links");
  });

  test("counts unabsorbed retro lessons as ingest debt", () => {
    const clean = lint([makePage("audience", VALID)], {
      retros: [makeRetro("2026-08-06-a")],
    });
    expect(checks(clean)).not.toContain("ingest-debt");

    const pending = lint([makePage("audience", VALID)], {
      retros: [
        makeRetro("2026-08-06-a", {
          wikiCandidate: "A firsthand hook cannot carry a t0 subject.",
          wikiPages: ["audience"],
          wikiIngested: false,
        }),
      ],
    });
    const debt = pending.find((f) => f.check === "ingest-debt");
    expect(debt?.severity).toBe("warning");

    const flood = lint([makePage("audience", VALID)], {
      retros: Array.from({ length: 11 }, (_, i) =>
        makeRetro(`2026-08-0${i}-x`, {
          wikiCandidate: `lesson ${i}`,
          wikiPages: ["audience"],
          wikiIngested: false,
        }),
      ),
    });
    expect(flood.find((f) => f.check === "ingest-debt")?.severity).toBe(
      "error",
    );
  });

  test("flags a lesson routed at a page that does not exist", () => {
    const findings = lint([makePage("audience", VALID)], {
      retros: [
        makeRetro("2026-08-06-a", {
          wikiCandidate: "Vendor early-access tools have no room.",
          wikiPages: ["plays/vendor-early-access"],
          wikiIngested: false,
        }),
      ],
    });
    const missing = findings.find((f) => f.check === "missing-page");
    expect(missing?.severity).toBe("warning");
    expect(missing?.page).toBe("wiki/plays/vendor-early-access.md");
  });

  test("warns on a citation into a gitignored directory", () => {
    const findings = lint([
      makePage("audience", {
        ...VALID,
        source_retro: "retros/2026-08-06-something.md",
      }),
    ]);
    const finding = findings.find((f) => f.check === "unverifiable-citation");
    expect(finding?.severity).toBe("warning");
  });
});
