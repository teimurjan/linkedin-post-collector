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
