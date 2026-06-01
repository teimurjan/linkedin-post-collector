import type { DraftRecord, SourceType, TopicFamily } from "./lifecycle.ts";
import { inferDraftDate } from "./lifecycle.ts";

export type RubricScores = {
  heat: 0 | 1 | 2;
  specificity: 0 | 1 | 2;
  differentiation: 0 | 1 | 2;
  builderFit: 0 | 1 | 2;
  discussionPotential: 0 | 1 | 2;
};

export type IdeationCandidate = {
  angle: string;
  sourceUrl: string;
  sourceTitle: string;
  briefingDate: string;
  topicFamily: TopicFamily;
  sourceType: SourceType;
  whyNow: string;
  opinionWedge: string;
  evidencePoints: string[];
  scores: RubricScores;
};

export type PublishedReference = {
  postedAt: Date;
  topicFamily: TopicFamily;
  firstLine: string;
  url: string;
};

export function totalScore(scores: RubricScores): number {
  return (
    scores.heat +
    scores.specificity +
    scores.differentiation +
    scores.builderFit +
    scores.discussionPotential
  );
}

export function rejectIdeaCandidate(input: {
  candidate: IdeationCandidate;
  drafts: DraftRecord[];
  posts: PublishedReference[];
  now: Date;
}): string[] {
  const { candidate, drafts, posts, now } = input;
  const reasons: string[] = [];

  if (totalScore(candidate.scores) < 7) {
    reasons.push("score below 7/10");
  }

  if (!candidate.opinionWedge.trim()) {
    reasons.push("news recap with no opinion wedge");
  }

  const draftCutoff = daysAgo(now, 30);
  const recentDrafts = drafts.filter((draft) => {
    const inferred = inferDraftDate(draft.file);
    return inferred
      ? new Date(`${inferred}T00:00:00.000Z`) >= draftCutoff
      : true;
  });

  if (
    recentDrafts.some(
      (draft) =>
        draft.sourceUrl === candidate.sourceUrl ||
        semanticOverlap(draft.pitchAngle, candidate.angle) >= 0.6,
    )
  ) {
    reasons.push("near-duplicate of a draft from the last 30 days");
  }

  const postCutoff = daysAgo(now, 7);
  const recentPosts = posts.filter((post) => post.postedAt >= postCutoff);
  if (
    recentPosts.some(
      (post) =>
        post.url === candidate.sourceUrl ||
        semanticOverlap(post.firstLine, candidate.angle) >= 0.6,
    )
  ) {
    reasons.push("near-duplicate of a published post from the last 7 days");
  }

  const sameTopicRecent = recentPosts.some(
    (post) =>
      post.topicFamily === candidate.topicFamily &&
      semanticOverlap(post.firstLine, candidate.angle) >= 0.1,
  );
  if (sameTopicRecent && !hasNewArtifact(candidate.evidencePoints)) {
    reasons.push("same-topic sequel without a new artifact");
  }

  if (
    candidate.sourceType === "news" &&
    (!candidate.opinionWedge.trim() || candidate.evidencePoints.length < 2)
  ) {
    reasons.push("thin news recap");
  }

  return dedupe(reasons);
}

export function semanticOverlap(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / Math.min(a.size, b.size);
}

export function hasNewArtifact(evidencePoints: string[]): boolean {
  return evidencePoints.some((point) => {
    if (
      /\b(no|without|missing|lack|lacks)\b.{0,30}\b(code|repo|commit|benchmark|dataset|experiment|prototype|demo|artifact|measurement|trace|writeup|report|results?)\b/i.test(
        point,
      )
    ) {
      return false;
    }
    return /\b(code|repo|commit|benchmark|dataset|experiment|prototype|demo|artifact|measurement|trace|writeup|report|results?|shipped|built|tested|ran)\b/i.test(
      point,
    );
  });
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function tokenSet(input: string): Set<string> {
  const stop = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "is",
    "are",
    "it",
    "this",
    "that",
    "today",
    "yesterday",
    "about",
    "from",
    "same",
    "new",
  ]);
  return new Set(
    input
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !stop.has(token)),
  );
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
