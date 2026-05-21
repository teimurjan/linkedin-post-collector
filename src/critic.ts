import type { IdeaBrief } from "./lifecycle.ts";

export type CriticScores = {
  hookStrength: number;
  specificity: number;
  novelty: number;
  readability: number;
  builderRelevance: number;
  discussionPotential: number;
};

export type CritiqueResult =
  | {
      approved: true;
      total: number;
      scores: CriticScores;
    }
  | {
      approved: false;
      total: number;
      scores: CriticScores;
      rewritePlan: {
        whatToCut: string;
        whatEvidenceToAdd: string;
        howToSharpenHook: string;
        ending: "takeaway" | "question";
      };
    };

export function critiqueDraft(
  idea: IdeaBrief,
  draftBody: string,
): CritiqueResult {
  const paragraphs = draftBody
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const hook = paragraphs[0] ?? "";
  const lowered = draftBody.toLowerCase();

  const scores: CriticScores = {
    hookStrength:
      hook.length >= 25 &&
      hook.length <= 220 &&
      (/\d/.test(hook) ||
        includesAny(hook, [idea.sourceTitle, ...idea.evidencePoints]))
        ? 2
        : hook.length > 0
          ? 1
          : 0,
    specificity:
      countMatches(draftBody, /\d/g) >= 2 ||
      sharedEvidenceCount(idea, draftBody) >= 2
        ? 2
        : sharedEvidenceCount(idea, draftBody) >= 1
          ? 1
          : 0,
    novelty:
      draftBody.includes(idea.opinionWedge) ||
      fuzzyContains(lowered, idea.opinionWedge)
        ? 2
        : idea.opinionWedge.trim()
          ? 1
          : 0,
    readability:
      paragraphs.length >= 4 &&
      paragraphs.length <= 8 &&
      longestParagraphWords(paragraphs) <= 90
        ? 2
        : paragraphs.length >= 2
          ? 1
          : 0,
    builderRelevance:
      /\b(engineer|builder|tooling|repo|compiler|runtime|benchmark|api|model|container|ci|typescript|react|rust|security|supply chain|diagnostic)\b/i.test(
        draftBody,
      )
        ? 2
        : /\bsoftware|dev|code\b/i.test(draftBody)
          ? 1
          : 0,
    discussionPotential:
      /\b(i think|i'd bet|the part worth watching|the real question|worth watching|my takeaway)\b/i.test(
        draftBody,
      )
        ? 2
        : draftBody.trim().endsWith("?")
          ? 1
          : 0,
  };

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const approved =
    total >= 8 && Object.values(scores).every((value) => value > 0);

  if (approved) {
    return { approved: true, total, scores };
  }

  return {
    approved: false,
    total,
    scores,
    rewritePlan: {
      whatToCut:
        scores.readability === 0
          ? "Cut the densest paragraph and one repeated claim."
          : "Cut generic setup before the first concrete detail.",
      whatEvidenceToAdd:
        sharedEvidenceCount(idea, draftBody) >= 1
          ? "Add one more concrete number, name, or artifact from the idea brief."
          : "Add two evidence points from the brief so the claim is defensible.",
      howToSharpenHook:
        scores.hookStrength === 0
          ? "Open with the sharpest concrete claim from the brief, not scene-setting."
          : "Compress the hook to one specific claim and one concrete detail.",
      ending:
        scores.discussionPotential >= 1 && paragraphs.length >= 4
          ? "question"
          : "takeaway",
    },
  };
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) =>
    fuzzyContains(haystack.toLowerCase(), needle),
  );
}

function fuzzyContains(haystack: string, needle: string): boolean {
  const tokens = needle
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);
  return tokens.some((token) => haystack.includes(token));
}

function sharedEvidenceCount(idea: IdeaBrief, draftBody: string): number {
  return idea.evidencePoints.filter((point) =>
    fuzzyContains(draftBody.toLowerCase(), point),
  ).length;
}

function countMatches(input: string, pattern: RegExp): number {
  return [...input.matchAll(pattern)].length;
}

function longestParagraphWords(paragraphs: string[]): number {
  return Math.max(
    0,
    ...paragraphs.map(
      (paragraph) => paragraph.split(/\s+/).filter(Boolean).length,
    ),
  );
}
