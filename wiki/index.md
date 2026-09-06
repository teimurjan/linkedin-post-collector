---
page: index
kind: index
title: Wiki index
status: active
last_revised: 2026-09-02
---

# Wiki

Accumulated conclusions about what reaches on this account. The skills in
`.agents/skills/` read this directory instead of carrying learned facts as prose.

**The division of labor: the CLI owns counts, the wiki owns causes.**
`bun run post-patterns` is the mechanical ground truth over `posts/` — medians,
sample sizes, cohorts, streaks. It recomputes from scratch every run and is never
wrong about arithmetic. This wiki holds the *conclusions* those counts support, each
carrying the corpus fingerprint it was written against so drift is detectable rather
than invisible.

Pages cite evidence as explicit post paths, never as a family query. That makes every
claim verifiable against `post-patterns --json` (`postIndex`), and immune to the
`topic_family` classifier, which mislabels.

Read [[log]] for the chronological record of what changed and why. The substantive
pages are [[audience]] (news lane) and [[experience]] (experience lane). The two are
never mixed: `bun run post-patterns` scopes every number with `--lane`, and a claim
computed across both is a claim nobody can recompute.

Pages cross-link with `[[slug]]` wikilinks. The connections carry as much of the
knowledge as the pages do, so a page nothing links to is a lint warning, not just an
untidy one.

## Conventions

- `confidence` is bounded by `evidence_n`: `high` needs 8+, `medium` 4+, `low` 2+, a
  single post is `anecdote`.
- `posts_covered` and `corpus_median_at_revision` record the corpus the page was
  written against. When they fall behind, the page is stale by arithmetic.
- Never cite a claim whose `confidence` is `anecdote`.
- A page that has never been tested against a miss is weaker than one that has. Where
  a claim has counter-evidence, it is listed.

<!-- BEGIN catalog -->
| Page | Kind | Confidence | Evidence | Covers | Revised |
|---|---|---|---|---|---|
| [audience](audience.md) | audience | medium | n=21 | 56 posts | 2026-09-02 |
| [experience](experience.md) | audience | low | n=5 | 56 posts | 2026-09-02 |
<!-- END catalog -->

## Not built yet

Deliberately absent, in the order they would come next:

- `plays/` — repeatable post shapes with a win/loss record, replacing the winner
  anecdotes still hardcoded in `post-writer`.
- `hooks/` — hook frames discovered inductively, so `post-critic`'s frame gate has
  something real to compare against. It is currently inert: the classifier defines one
  frame template and no recent post matches it.
- `imagery.md` — the concept/metaphor ledger. `post-image` already cites an "imagery
  memory" that does not exist.
- `families/_taxonomy.md` — a warning label for the `topic_family` axis, if the axis
  survives at all.

No `voice.md`: `tone-samples/` is already the canonical voice reference per
`post-writer`, and a second source would recreate the problem this wiki fixes.
