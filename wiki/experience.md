---
page: experience
kind: audience
title: What reaches in the experience lane
status: provisional
confidence: low
evidence_n: 5
lane: experience
evidence_posts:
  - posts/2025/12-09-i-finally-get-to-share-something-i-ve-been-working-on-for-we.md
  - posts/2026/08-06-eleven-of-my-last-twenty-commits-say-chore-uptodate-an-agent.md
  - posts/2026/04-21-most-llm-memory-demos-you-see-are-benchmarked-on-50-session.md
  - posts/2026/05-28-four-linkedin-posts-lost-in-a-row-same-shape-every-time-toda.md
  - posts/2025/02-28-i-m-thrilled-to-share-one-of-our-biggest-milestones-yet-at-r.md
# Shipped-work posts that landed at or below the process-report cluster. They are why
# this page makes no claim that shipping something is enough.
counter_posts:
  - posts/2026/08-28-i-shipped-an-image-differ-the-speed-was-the-easy-part-visual.md
  - posts/2026/06-17-single-thread-no-parallelism-3-8x-faster-than-libspng-i-buil.md
counter_evidence:
  - post: posts/2026/08-28-i-shipped-an-image-differ-the-speed-was-the-easy-part-visual.md
    impressions: 143
    shape: launch of the owner's own shipped software
  - post: posts/2026/06-17-single-thread-no-parallelism-3-8x-faster-than-libspng-i-buil.md
    impressions: 242
    shape: the owner's own benchmarked PNG encoder
posts_covered: 56
corpus_median_at_revision: 439
patterns_generated_at: 2026-09-02
last_revised: 2026-09-02
revised_by: wiki-curator
supersedes: []
# Lane-scoped, from `bun run post-patterns --lane experience`. Twins every number
# quoted in the body.
lane_stats:
  n: 18
  median: 362
  p25: 210
  p75: 733
  min: 76
  max: 1271
  median_minus_top: 330
  cohort_2to7d_n: 3
  cohort_2to7d_median: 282
  cohort_1to4w_n: 6
  cohort_1to4w_median: 226
  above_400_n: 8
  above_400_threshold: 400
# The bottom five of the lane, which is where four of this page's five charted posts
# sit. Twins the numbers in "What the five posts show".
bottom_five:
  - impressions: 76
    post: posts/2025/02-28-i-m-thrilled-to-share-one-of-our-biggest-milestones-yet-at-r.md
  - impressions: 143
    post: posts/2026/08-28-i-shipped-an-image-differ-the-speed-was-the-easy-part-visual.md
  - impressions: 181
    post: posts/2026/05-28-four-linkedin-posts-lost-in-a-row-same-shape-every-time-toda.md
  - impressions: 200
    post: posts/2026/04-21-most-llm-memory-demos-you-see-are-benchmarked-on-50-session.md
  - impressions: 210
    post: posts/2026/08-06-eleven-of-my-last-twenty-commits-say-chore-uptodate-an-agent.md
# The five posts relocated here from [[audience]] on 2026-09-02, with the subject
# shape each one represents. These are the page's whole evidence base.
observed:
  - post: posts/2025/12-09-i-finally-get-to-share-something-i-ve-been-working-on-for-we.md
    impressions: 1271
    shape: launch of the owner's own shipped software (Avatune)
    note: the lane maximum
  - post: posts/2026/08-06-eleven-of-my-last-twenty-commits-say-chore-uptodate-an-agent.md
    impressions: 210
    shape: the owner's own commit log
  - post: posts/2026/04-21-most-llm-memory-demos-you-see-are-benchmarked-on-50-session.md
    impressions: 200
    shape: the owner's own benchmarking niche
  - post: posts/2026/05-28-four-linkedin-posts-lost-in-a-row-same-shape-every-time-toda.md
    impressions: 181
    shape: the owner's own LinkedIn posting performance
  - post: posts/2025/02-28-i-m-thrilled-to-share-one-of-our-biggest-milestones-yet-at-r.md
    impressions: 76
    shape: a company milestone announcement
    note: the lane minimum
---

# What reaches in the experience lane

The experience lane is the owner's own operation: an app they run, a number they
measured, a function they built instead of hiring, a lesson the sell side taught them.
It is defined by `headcount-zero-positioning.md` and drafted by `experience-post-cycle`.

This page exists because [[audience]] was calibrated on news posts and had five
experience posts cited in its tiers. Those five were moved here on 2026-09-02. The
lanes are analyzed separately (`bun run post-patterns --lane experience`), so a number
computed across both is a number nobody can recompute.

Catalogued in [[index]]. Revision history in [[log]].

## The lane's own scale

n=18, median 362 impressions, p25 210, p75 733, range 76–1271. Drop the top post and
the median is 330. The whole lane fits inside the bottom third of the news lane's
range, and its maximum (1,271) would rank below the news lane's t1 floor.

**That comparison is the one thing this page forbids.** A news post's reach says
nothing about an experience post's. The lane has a different room — the owner's own
following rather than a standing crowd around a public artifact — and its numbers are
only meaningful against each other.

## What the five posts show

Ordered by reach, they fall into a shape the news-lane tier model does not describe:

| Shape | Impressions |
|---|---|
| Launch of the owner's own shipped software | 1271 |
| The owner's own commit log | 210 |
| The owner's own benchmarking niche | 200 |
| The owner's own LinkedIn posting performance | 181 |
| A company milestone announcement | 76 |

The launch is 6x the next post and is the lane maximum. The three middle posts cluster
tightly at 181–210, right at the lane's p25 of 210. The milestone announcement is the
lane minimum and the smallest post in the whole archive.

**The tempting reading is wrong, and the lane's other thirteen posts say so.** The
obvious conclusion from this table — that the lane rewards a thing the owner built and
punishes a report on the owner's own process — does not survive contact with the rest of
the cohort. The 08-28 image-differ post is shipped software and landed at 143, below
every process report on this page. The 06-17 PNG-encoder post is shipped software with a
3.8x benchmark in the hook and landed at 242. Both are recorded as `counter_posts`.
Shipping something is not sufficient, and the 1,271 launch is one post.

What survives is the narrower, negative half: **four of this page's five posts sit in the
lane's bottom five, and three of those four are reports on the owner's own process or
metrics** — the commit log (210), the benchmarking setup (200), the posting retrospective
(181). The milestone announcement (76) is the floor and is the one post of the five with
no technical artifact in it at all. `evidence_n: 5`, `confidence: low`: this is a floor
observation about one shape, not a theory of the lane.

[[audience]] independently reached the same exclusion from the news side: it records that
a firsthand line about the owner's *process* does not promote a subject, citing the
commit-log post. That is the same underlying post, so it is agreement, not confirmation.

## What this page cannot say yet

- **Nothing about pillars.** `headcount-zero-positioning.md` defines four
  (`replaced-a-hire`, `numbers-from-a-company-of-one`, `didnt-teach-me`,
  `nights-and-weekends`). None of these five posts was drafted against a pillar — they
  predate the axis and were labelled post-hoc. Mapping them now would be inventing
  evidence. The first experience-lane retro that carries a `pillar` starts that work.
- **Nothing with a tier model.** Five posts across five different shapes cannot produce
  bands. Do not import [[audience]]'s t0/t1/t2 here; the tiers measure a standing public
  audience, which is not what this lane draws on.
- **Nothing about receipts.** `post-critic` zeroes `specificity` on an experience post
  with no number. That rule comes from the dossier, not from this corpus, and this page
  has not tested it. The 06-17 counter-post is the first thing to check against it: it
  led with a 3.8x benchmark and still landed at 242.
- **Nothing about the lane's upper half.** Eight of the eighteen posts clear 400
  impressions and not one of them is charted here, because none had a retro to ingest.
  Every claim above is drawn from the bottom of the lane.

## Open questions

- What separates the 1,271 launch from the 143 launch? Both are the owner shipping
  software. This is the lane's central open question and nothing on this page answers it.
- Is the process-report floor real, or is it three posts that were separately weak? The
  three cluster at 181–210 against a lane median of 362, which is suggestive at n=3 and
  nothing more.
- What do the eight posts above 400 have in common? The lane's entire upper half is
  uncharacterized, and until a retro covers one, this page describes only how the lane
  fails.
