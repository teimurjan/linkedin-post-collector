# Wiki log

Append-only. Newest entries at the bottom. One entry per ingest, query-filed-back, or
lint pass. Entry headings follow `## [YYYY-MM-DD] <op> | <title>` so the log stays
greppable: `grep "^## \[" wiki/log.md | tail -5`.

Every entry names the corpus fingerprint it was written against, what changed, and
what it contradicted. The `contradicted:` line is required even when the answer is
`none` — without it, an ingest can quietly overwrite a claim and leave no trace.

## [2026-08-17] ingest | seed the wiki with the standing-audience tier model

- corpus: 50 posts, median 439 (435 with the top post removed)
- trigger: manual — review of the post-generation skills against the LLM-wiki pattern
- changed:
  - wiki/audience.md — created, `confidence: medium`, `evidence_n: 24`
  - wiki/index.md — created
  - wiki/log.md — created
- claim added: subject recognizability separates reach in this corpus; three
  non-overlapping bands across 24 posts (t0 max 236 < t1 min 1271, t1 max 3570 < t2
  min 5144)
- contradicted: `post-ideator` held that `topic_family: other` is a tell for
  `reach_ceiling` 0 or 1. `other` (n=4, median 3472) contains the #4 and #6 posts;
  the claim is backwards and was cut. Also corrected the "55-impression post" cited
  six times across three skills: no post in the corpus has 55 impressions. The
  navel-gazing post it referred to is at 181, and the corpus worst is 76 (a company
  milestone announcement), a different failure mode.

## [2026-08-17] ingest | retro 2026-08-10 auto-mode classifier

- corpus: 50 posts, median 439
- trigger: retros/2026-08-10-humans-catch-136-of-dangerous-agent-commands.md (decision: modify)
- changed:
  - wiki/audience.md — first `disputed` entry (Claude Code auto mode default, pre-scored 2, published 135, `t2_miss_below` trigger); `counter_posts` seeded with the same post; `promotion_review` gained `pre_scored_posts_so_far: 1` / `pre_scored_missed: 1`; body gained the "Heat is not size" rule under "How to assign a tier"
- claim added: a `reach_ceiling` of 2 argued from topical heat does not hold; the score
  has to be argued from subject recognizability, and a process-level firsthand line does
  not promote a t0 subject
- evidence_n: unchanged at 24 — the post was already a t0 exemplar, so this ingest adds
  a prospective test, not a new data point
- contradicted: nothing on the page. The tier bands predicted this post correctly (135
  sits inside t0's 76-236); what failed was the ideator's route to the score. Recorded
  as an assignment error so the bands are not revised on a procedure fault. `confidence`
  held at `medium` rather than lowered, because the miss is inside a band, not between two.

## [2026-08-17] ingest | retro 2026-08-13 sqlite-tailscale

- corpus: 50 posts, median 439
- trigger: retros/2026-08-13-a-16-year-old-sqlite-bug-cost-tailscale.md (decision: repeat)
- changed:
  - wiki/audience.md — `promotion_review` now 2 prospective posts, 1 held / 1 missed;
    `context_stats` gained the 2-to-7-day cohort (n=5, median 393) both scored posts are
    measured against; body gained "The controlled pair" under "Heat is not size" and a
    paragraph stating firsthand signal is not required at t2; the firsthand open question
    was split into its evidenced half and its unevidenced half
- claim added: a t2 subject reaches multi-thousand impressions with no firsthand signal,
  so firsthand work buys a floor under a small subject rather than reach on a large one;
  and a `reach_ceiling: 2` argued from subject recognizability holds where the same score
  argued from heat did not
- evidence_n: unchanged at 24 — already a t2 exemplar; this ingest adds the prospective
  hold, not a new data point
- contradicted: nothing on this page, but it weakens the standing of `experience_hook` as
  a reach lever, which the ideator and critic still treat as one. The pair is the useful
  part: same rubric, same week, matching scores of 12, 6565 vs 135. Recorded rather than
  used to raise `confidence`, which stays `medium` at 2 of 8 prospective posts.
