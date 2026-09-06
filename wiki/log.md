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

## [2026-08-21] ingest | retro 2026-08-17 stop-reporting-merge-rate

- corpus: 52 posts, median 506 (was 50 / 439 at last revision)
- trigger: retros/2026-08-17-stop-reporting-how-much-code-your-ai-writes.md (decision: repeat)
- changed:
  - wiki/audience.md — counter_posts +1 (08-17 merge-rate, a t0 subject at 749); fingerprint
    posts_covered 50 -> 52, corpus_median_at_revision 439 -> 506, last_revised -> 2026-08-21;
    context_stats agents 18/310 -> 20/373, other_median 3472 -> 3886; body family-median
    citations refreshed to match; "Heat is not size" gains the t0-overshoot note
- claim added: a t0 vendor metric can clear its band when the wedge reframes a discourse the
  audience is already arguing — recorded as a bounded counter-example, not a scoring rule
- confidence: unchanged at medium — the overshoot (749) is below the page's own
  t0_beat_above: 3000 trigger, so the tier holds; one post does not move the floor
- contradicted: the crispness of t0's 236 ceiling. Not the tier model itself — 749 sits in the
  t0–t1 gap, below every dispute trigger. Recorded as counter-evidence with an explicit warning
  that "my wedge reframes a discourse" must not become a heat-loophole for scoring t0 subjects up.

## [2026-08-25] ingest | retro 2026-08-19 cursor-origin-runs-on-github

- corpus: 53 posts, median 569
- trigger: retros/2026-08-19-cursor-built-a-github-competitor-that-still-runs.md (decision: repeat)
- changed:
  - wiki/audience.md — t2 exemplars +1 (Cursor/GitHub 100064, pre_scored), observed_n 7 -> 8, observed_median 32731 -> 33509; evidence_n 24 -> 25; promotion_review pre_scored_posts_so_far 2 -> 3, pre_scored_held 1 -> 2
  - wiki/audience.md — open question "is there a tier above t2" closed in the body; t2's range now spans 5154-128280 with two six-figure tool subjects
  - wiki/audience.md — rescrape drift corrected: SQLite exemplar 6565 -> 7411, band_overshoot 749 -> 867, corpus_median_at_revision 506 -> 569, cohort_2to7d_median 393 -> 876
- claim added: the 100k band sits inside t2, not above it — the Linus post is t2's ceiling, not a separate tier
- contradicted: none

## [2026-08-25] ingest | retro 2026-08-21 github-failover-plan

- corpus: 53 posts, median 569
- trigger: retros/2026-08-21-your-database-has-a-failover-plan-github-doesnt.md (decision: modify)
- changed:
  - wiki/audience.md — new `sequel_discount` frontmatter block and "The sequel discount" body section (confidence: low, evidence_n 2)
  - wiki/audience.md — counter_posts +1 (08-21 failover, a pre-scored t2 that landed at 1746, below t2's 5154 floor)
  - wiki/audience.md — promotion_review gains pre_scored_near_miss: 1, pre_scored_posts_so_far 3 -> 4; the post cleared t2_miss_below (1000) so it is not a dispute
- claim added: a t2 subject discounts toward t1 reach when it is the account's second post on that subject inside seven days — cap reach_ceiling at 1
- contradicted: none directly, but it qualifies "tier is a property of the subject" — the first modifier this page has ever applied to a tier after assignment. The tier bands are unchanged; only the assignment procedure gains a cap.

## [2026-09-02] ingest | session summary — six lessons absorbed, lane bleed resolved

- corpus: 56 posts, median 439 (news n=38 median 664, experience n=18 median 362)
- trigger: six retro/postmortem lessons carrying `wiki_ingested: false`, swept oldest first
- changed:
  - wiki/audience.md — recomputed news-only, two new failure modes recorded, fingerprint refreshed
  - wiki/experience.md — created to hold the five experience-lane posts that were miscited on [[audience]]
  - wiki/index.md — catalog regenerated, [[experience]] linked from the body
- claim added: see the per-lesson entries that follow this one
- contradicted: [[audience]]'s published tier bands, which were computed over a pool mixing both lanes. Details in the per-lesson entries below.

## [2026-09-02] ingest | postmortem 2026-05-25 paper-benchmark

- corpus: 56 posts, median 439
- trigger: retros/postmortems/2026-05-25-a-new-paper-benchmarks-llm-coding-agents-on-100-back-end-tas.md (decision: block)
- changed:
  - wiki/audience.md — none. The claim ("a paper recap without a reproduction stays inside the t0 band") is already what the t0 tier says, and the post is already a t0 exemplar at 184.
- claim added: none — reinforces an existing claim
- contradicted: none

## [2026-09-02] ingest | postmortem 2026-06-19 vercel-agent-directory

- corpus: 56 posts, median 439
- trigger: retros/postmortems/2026-06-19-vercel-just-bet-your-agent-is-a-directory-not-code-they-open.md (decision: block)
- changed:
  - wiki/audience.md — none structurally. The claim ("a contrarian wedge does not raise a t0 subject's ceiling") restates the tier's own "a sharp wedge does not rescue this"; the post is already a t0 exemplar at 163.
- claim added: none — reinforces an existing claim
- contradicted: none

## [2026-09-02] ingest | postmortem 2026-07-23 openai-benchmark-escape

- corpus: 56 posts, median 439
- trigger: retros/postmortems/2026-07-23-openai-s-benchmark-agents-escaped-and-stole-the-answers-open.md (decision: modify)
- changed:
  - wiki/audience.md — new `frame_reuse_watch` frontmatter block (confidence: anecdote, evidence_n 1) and a paragraph under "The sequel discount"
  - wiki/audience.md — t0 exemplar impressions corrected 121 -> 185 (the postmortem's prior revision carried a pre-rescrape number)
- claim added: reusing a *frame* within seven days may take the same discount as reusing a subject — the 07-23 containment post ran the 07-17 frame six days later, 1380 -> 185
- contradicted: nothing on the page, but it is deliberately kept OUT of `sequel_discount`, whose evidence_n of 2 depends on subject identity. Folding it in would have inflated that count with a different effect.

## [2026-09-02] ingest | postmortem 2026-08-10 auto-mode classifier (second pass)

- corpus: 56 posts, median 439
- trigger: retros/postmortems/2026-08-10-humans-catch-13-6-of-dangerous-agent-commands-a-classifier-c.md (decision: modify)
- changed:
  - wiki/audience.md — "On firsthand signal" section rewritten; `firsthand_flag` frontmatter block added
  - wiki/audience.md — 08-10 impressions corrected 135 -> 163 across the t0 exemplar and the `disputed` entry (rescrape drift)
  - wiki/audience.md — `firsthand_promotion` on t1 changed `true` -> `unevidenced`
- claim added: a firsthand line without a number does not lift a post out of the news-without-firsthand band
- contradicted: **yes.** The page asserted "post-patterns reports the news-without-firsthand flag as discredited at 0.77x across 27 posts" and told skills not to score its absence. Under `--lane news` that flag is a **validated anti-pattern** (n=25, 443 vs 750, 0.59x); the 0.76x/n=29 reading is the unscoped one, which mixes lanes. The lane-scoped number governs a news draft. The page now carries both, twinned in frontmatter.

## [2026-09-02] ingest | postmortem 2026-08-25 windows-paint

- corpus: 56 posts, median 439
- trigger: retros/postmortems/2026-08-25-windows-paint-bakes-a-server-issued-guid-into-your-pixels-xu.md (decision: block)
- changed:
  - wiki/audience.md — t0 exemplars +1 (72), observed_n 12 -> 9 (see the lane-bleed entry below), observed_min 76 -> 72, observed_median 192 -> 185
  - wiki/audience.md — t2 label changed from "every working developer already knows" to "the reader has used or fought with"; new "Famous is not used" section
  - wiki/audience.md — new `sub_band_watch` block (confidence: anecdote) and "Below the band" section
  - wiki/audience.md — `disputed` +1 (resolved), counter_posts +1, promotion_review pre_scored_posts_so_far 4 -> 5, pre_scored_missed 1 -> 2
- claim added: recognizability is not the property that builds a room — having used the artifact is. A pre-scored t2 argued from name recognition (Microsoft Paint) landed at 72, the lowest post in the lane and below every band.
- contradicted: the t2 label's own wording. "Every working developer already knows" was satisfied by this subject and still produced the worst post in the corpus, so the label was the defect, not its application.

## [2026-09-02] ingest | retro 2026-08-25 windows-paint

- corpus: 56 posts, median 439
- trigger: retros/2026-08-25-windows-paint-bakes-a-server-issued-guid-into-your-pixels.md (decision: block)
- changed:
  - wiki/audience.md — none beyond the postmortem entry above; the retro carries the same claim from the draft side and adds no separate evidence
- claim added: none — same claim, already absorbed
- contradicted: none

## [2026-09-02] lint-fix | lane bleed on audience.md, and wiki/experience.md created

- corpus: 56 posts, median 439 (news n=38 median 664, experience n=18 median 362)
- trigger: recomputing t0's `observed_*` for the ingests above was impossible without resolving this first
- changed:
  - wiki/audience.md — five experience-lane posts removed from the tiers: 12-09 Avatune (1271, t1), 08-06 commit log (210, t0), 04-21 memory benchmarks (200, t0), 05-28 posting performance (181, t0), 02-28 company milestone (76, t0)
  - wiki/audience.md — recomputed news-only: t1 n=5 -> 4, median 2192 -> 2637, min 1271 -> 1380; t0 n=12 -> 9, median 192 -> 185, min 76 -> 163 -> 72 (72 arriving from the windows-paint ingest). t2 unchanged at n=8, median 33509.
  - wiki/audience.md — impressions refreshed after rescrape drift: 08-19 100064 -> 100588, 08-13 7411 -> 7416, 08-21 1746 -> 1895, 08-17 867 -> 874, 08-10 135 -> 163
  - wiki/audience.md — t1's "or the owner's own shipped work" clause removed; its only evidence was the Avatune post, now on [[experience]]
  - wiki/audience.md — fingerprint 53/569 -> 56/439, evidence_n 25 -> 21, `lane: news` added
  - wiki/experience.md — created, `status: provisional`, `confidence: low`, evidence_n 5, holding the relocated posts and the lane's own stats
  - wiki/index.md — catalog regenerated, [[experience]] linked
- claim added: the experience lane's whole range (76–1271) sits below the news lane's t1 floor, and its five charted posts split into shipped software (1271) versus reports on the owner's own process (181–210)
- contradicted: **yes.** [[audience]] presented t0's floor as 76 and t1's floor as 1271; both numbers came from experience-lane posts and were never valid for a news draft. The news-only t0 floor before windows-paint was 163. Every band this page has published since it was written was computed over a mixed pool.
