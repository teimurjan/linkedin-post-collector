---
page: audience
kind: audience
title: Standing-audience tiers for scoring reach_ceiling
status: active
confidence: medium
evidence_n: 24
# The page's own predictive use has failed once. Kept here, not buried in prose.
counter_posts:
  - posts/2026/08-10-humans-catch-13-6-of-dangerous-agent-commands-a-classifier-c.md
posts_covered: 50
corpus_median_at_revision: 439
patterns_generated_at: 2026-08-17
last_revised: 2026-08-17
revised_by: wiki-curator
supersedes: []
# Family medians quoted in the body, so they can be rechecked against
# `bun run post-patterns` rather than drifting silently.
context_stats:
  agents_n: 18
  agents_median: 310
  agents_min: 163
  agents_max: 128280
  security_n: 13
  security_median: 408
  other_n: 4
  other_median: 3472
  # The scrape-age cohort both prospectively-scored posts are compared against.
  cohort_2to7d_n: 5
  cohort_2to7d_median: 393
# Thresholds for promoting this page's confidence. See "Confidence" below.
promotion_review:
  pre_scored_posts_required: 8
  pre_scored_posts_so_far: 2
  pre_scored_held: 1
  pre_scored_missed: 1
  t2_miss_below: 1000
  t0_beat_above: 3000
tiers:
  - id: t2-universal
    score: 2
    label: A named artifact every working developer already knows, unprompted
    observed_n: 7
    observed_median: 32731
    observed_min: 5144
    observed_max: 128280
    exemplars:
      - post: posts/2026/05-29-linus-torvalds-spent-the-week-telling-people-to-stop-sending.md
        impressions: 128280
        subject: Linus Torvalds / the kernel
      - post: posts/2026/07-01-google-s-tabfm-beats-tuned-xgboost-without-training-on-your.md
        impressions: 108960
        subject: XGBoost
      - post: posts/2026/07-15-your-dependency-bot-should-be-three-days-late-github-just-ch.md
        impressions: 34287
        subject: dependency bots / Dependabot
      - post: posts/2026/07-10-rewrite-it-in-rust-used-to-be-a-joke-this-week-it-shipped-th.md
        impressions: 32731
        subject: Rust
      - post: posts/2026/06-01-everyone-read-4b-params-i-read-0-93-gigabytes-bonsai-image-4.md
        impressions: 7360
        subject: model parameter counts
      - post: posts/2026/08-13-a-16-year-old-sqlite-bug-cost-tailscale-19-corrupted-databas.md
        impressions: 6565
        subject: SQLite
      - post: posts/2026/08-03-typescript-7-is-11x-faster-your-linter-still-can-t-run-it-mi.md
        impressions: 5144
        subject: TypeScript
  - id: t1-subcommunity
    score: 1
    label: A namable sub-community with an active audience, or the owner's own shipped work
    observed_n: 5
    observed_median: 2192
    observed_min: 1271
    observed_max: 3570
    firsthand_promotion: true
    exemplars:
      - post: posts/2026/03-11-solidjs-v2-beta-is-out-and-it-quietly-changes-how-async-ui-w.md
        impressions: 3570
        subject: SolidJS
      - post: posts/2026/06-29-a-job-application-goes-in-nothing-comes-back-the-screener-th.md
        impressions: 3082
        subject: AI hiring screens
      - post: posts/2026/05-17-vercel-labs-dropped-a-new-systems-language-called-zero-the-p.md
        impressions: 2192
        subject: Vercel Zero
      - post: posts/2026/07-17-grok-build-uploaded-a-file-it-refused-to-read-cereblab-ran-g.md
        impressions: 1380
        subject: Grok Build
      - post: posts/2025/12-09-i-finally-get-to-share-something-i-ve-been-working-on-for-we.md
        impressions: 1271
        subject: Avatune (own shipped work)
  - id: t0-vendor-paper-or-self
    score: 0
    label: One vendor's product, one paper, one configuration nobody else is in, or the owner's own metrics
    observed_n: 12
    observed_median: 192
    observed_min: 76
    observed_max: 236
    exemplars:
      - post: posts/2026/05-22-google-is-sunsetting-gemini-cli-and-gemini-code-assist-on-ju.md
        impressions: 236
        subject: one vendor's product sunset
      - post: posts/2026/05-20-yesterday-i-posted-about-teampcp-and-637-malicious-npm-versi.md
        impressions: 211
        subject: a sequel to the owner's own prior post
      - post: posts/2026/08-06-eleven-of-my-last-twenty-commits-say-chore-uptodate-an-agent.md
        impressions: 201
        subject: the owner's own commit log
      - post: posts/2026/05-21-alibaba-launched-qwen-3-7-max-yesterday-and-called-it-the-ag.md
        impressions: 200
        subject: one vendor's model release
      - post: posts/2026/04-21-most-llm-memory-demos-you-see-are-benchmarked-on-50-session.md
        impressions: 200
        subject: a benchmarking niche
      - post: posts/2026/04-29-it-only-knows-the-world-up-to-1930-no-internet-no-wwii-no-mo.md
        impressions: 198
        subject: one novelty model
      - post: posts/2026/07-23-openai-s-benchmark-agents-escaped-and-stole-the-answers-open.md
        impressions: 185
        subject: one paper
      - post: posts/2026/05-25-a-new-paper-benchmarks-llm-coding-agents-on-100-back-end-tas.md
        impressions: 184
        subject: one paper
      - post: posts/2026/05-28-four-linkedin-posts-lost-in-a-row-same-shape-every-time-toda.md
        impressions: 181
        subject: the owner's own posting performance
      - post: posts/2026/06-19-vercel-just-bet-your-agent-is-a-directory-not-code-they-open.md
        impressions: 163
        subject: one vendor's agent format
      - post: posts/2026/08-10-humans-catch-13-6-of-dangerous-agent-commands-a-classifier-c.md
        impressions: 135
        subject: one classifier result
      - post: posts/2025/02-28-i-m-thrilled-to-share-one-of-our-biggest-milestones-yet-at-r.md
        impressions: 76
        subject: the owner's own company milestone
disputed:
  - subject: Claude Code auto mode becoming the default
    post: posts/2026/08-10-humans-catch-13-6-of-dangerous-agent-commands-a-classifier-c.md
    scored_at_ideation: 2
    outcome_tier: 0
    published_impressions: 135
    trigger: t2_miss_below
    resolution: assignment error, not a tier-band error
    resolved_by: 72h retro on the draft slug 2026-08-10-humans-catch-136-of-dangerous-agent-commands
    note: >-
      The brief argued its 2 from how much the topic was being discussed, not from
      how many people already know the subject. Landed inside t0's band. The bands
      held; the procedure for reaching them did not, so "How to assign a tier" gained
      the heat-is-not-size rule rather than the tiers being redefined.
---

# Standing-audience tiers

`reach_ceiling` asks how large the crowd already standing around a topic is, before
the post exists. This page is where that score comes from. Read it, match the
candidate's subject to a tier, name the exemplar it most resembles, and score the
tier's `score`.

Catalogued in [[index]]. Revision history in [[log]].

## Why subject, not topic family

`topic_family` does not separate winners from losers in this corpus. `agents` is the
largest family (n=18) with a median of 310 against a corpus median of 439, and it
contains both the best post (128,280) and several of the worst — a 787x range inside
one label. `security` (n=13, median 408) contains the #3 post and one of the worst.
The classifier that assigns these labels is a first-match-wins keyword cascade, so
`TypeScript 7 is 11x faster` is filed as `security` because the body says "npm" once.

Subject recognizability does separate them, and the bands do not overlap:

| Tier | n | Median | Range |
|---|---|---|---|
| t2 | 7 | 32731 | 5144 – 128280 |
| t1 | 5 | 2192 | 1271 – 3570 |
| t0 | 12 | 192 | 76 – 236 |

t0's ceiling (236) sits below t1's floor (1271). t1's ceiling (3570) sits below t2's
floor (5144).

## How to assign a tier

The question is not "is this important" or "would a builder find it interesting."
It is: **when you name the subject in five words, does the reader already know what
you are talking about?**

- **t2** — the subject is a thing the reader has used, fought with, or has an opinion
  about already. Rust, SQLite, TypeScript, Dependabot, the kernel, parameter counts.
  The room is assembled before the post exists.
- **t1** — the subject has a real, namable audience, but not everyone is in it.
  SolidJS. Vercel Zero. A specific vendor's tool that a sub-community actually uses.
  The owner's own shipped work lands here too: it is niche by raw audience, but
  credibility and an existing follower base give it a floor a stranger's niche topic
  would not have.
- **t0** — one vendor's product nobody else is in, one paper, one benchmark result,
  one configuration, or the owner's own metrics and process. A sharp wedge does not
  rescue this. Every t0 post in the corpus landed between 76 and 236 impressions,
  several of them with clean craft and a real argument.

A firsthand artifact promotes t0 to t1 when the artifact is a real technical thing
another builder could run or learn from. It does **not** promote a post whose subject
is the owner's own posting process or metrics — three of the twelve t0 posts are
exactly that, and they are the worst-performing shape in the corpus.

Promotion is the only thing firsthand signal does here. It is **not** required at t2: the
SQLite/Tailscale post carried `experience_hook: none` and still published at 6565, and
`post-patterns` reports the news-without-firsthand flag as discredited at 0.76x across
25 posts. Firsthand work buys a floor under a small subject. It does not add reach to a
subject that already has a room, and its absence is not a fault to score against a draft.

### Heat is not size

The one prospective miss on this page failed here, so the rule is worth stating on its
own: **how much a topic is being discussed says nothing about how many people already
know the subject.** The two are easy to confuse because the evidence for heat is loud
and quantified — front-page score, comment count, three vendors shipping in one week —
while standing-audience size has no metric attached and has to be judged.

A `2` has to be argued from the subject line, not from the news cycle around it. If the
case for the score cites thread activity, coverage breadth, or how many labs shipped
something adjacent, it is a heat argument and the score is unsupported. Rewrite the
subject in five words and check it against a tier exemplar instead. "Claude Code auto
mode default" scored a 2 on heat and landed at 135; the tier exemplars would have put it
at 0, next to "one vendor's model release" and "one vendor's agent format".

The asymmetry is worth internalizing: heat is a property of the week, tier is a property
of the subject. Heat decays in days. A subject the reader has fought with stays known
for years, which is why every t2 exemplar here is a tool, not an event.

**The controlled pair.** Both prospectively-scored posts so far landed three days apart,
and the rubric could not tell them apart: identical total score of 12, identical `risk`
label, both pre-scored `reach_ceiling: 2`. The SQLite/Tailscale post published at 6565
and the auto-mode post at 135, against a 2-to-7-day cohort median of 393. A 49x spread
with matching scores on every recorded axis.

The subject is the only variable that separates them. SQLite is a thing the reader has
used; "auto mode default" is a setting in one vendor's product. This is the closest the
corpus has to a natural experiment on the tier model, and it is why the model survives a
prospective miss: the miss and the hold came from the same rubric on the same week, and
only the tier assignment predicted the outcome.

## Confidence and how this page earns more

`confidence: medium`, and the caveat matters: **these tiers were assigned after the
impressions were known.** Clean separation on a post-hoc labelling of 24 posts is a
hypothesis, not a validated model. The next 10 posts are the actual test, because
they get a tier at ideation time, before publishing.

Raise confidence to `high` only when at least 8 posts have been tier-scored *before*
publishing and the bands still hold. If a pre-scored t2 lands under 1000, or a
pre-scored t0 clears 3000, record it in `disputed` and revise the tier definitions
rather than the post's tier.

`promotion_review` tracks that count. One post scored prospectively so far, and it
missed — which is a warning about the assignment procedure, not yet about the model,
since the miss landed inside a band rather than between them. `confidence` stays
`medium`.

## Disputes

When the ideator or critic believes a subject's tier is wrong, it scores its way and
records the disagreement here rather than silently overriding. Each entry names the
subject, the tier the page assigns, the tier the skill argued for, the reason, and
the source file. `disputed` entries are resolved against the published number once a
retro exists — which is how this page gets calibrated instead of just getting longer.

One entry so far, and it came from the page's own `t2_miss_below` trigger rather than
from a skill objecting in advance: a subject pre-scored `2` published at 135. It is
recorded as an assignment error, not a band error, because the post landed inside t0's
observed range rather than outside every band. That distinction is the whole reason the
trigger exists — a pre-score that misses tells you either the tiers are wrong or the
route to them is, and only the published number can say which.

Only 24 of 50 posts carry a tier so far: the unambiguous top and bottom. The middle
26 are unassigned on purpose. Assigning them requires the same judgment call the
tiers exist to make, and doing it in bulk from known outcomes would inflate
`evidence_n` without adding evidence.

## Open questions

Things this page cannot yet answer, which the next retros should settle:

- Does firsthand work promote a t0 subject to t1 reliably, or only when the artifact is something another builder can run? Still unshown in the positive direction — there is no post where a runnable firsthand artifact lifted a t0 subject out of the band. The negative half now has two exemplars: process-level firsthand lines that did not promote (the commit-log post and the auto-mode post). So the rule's exclusion is evidenced and its promotion is not.
- Where does a t2 subject with a dull wedge land? Every t2 exemplar here also had a sharp take, so the tier's floor is untested.
- Is there a tier above t2 (a cross-cutting moment rather than a known artifact), or is the Linus post just t2's ceiling? n=1 either way.
