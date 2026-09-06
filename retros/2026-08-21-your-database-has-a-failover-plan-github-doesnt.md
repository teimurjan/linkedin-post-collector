---
draft_file: drafts/2026-08-21-your-database-has-a-failover-plan-github-doesnt.md
source_post: posts/2026/08-21-your-database-has-a-failover-plan-github-doesn-t-on-august-1.md
topic_family: other
source_type: news
reach_tier: t2-universal
reach_ceiling_at_ideation: 2
published_url: 'https://www.linkedin.com/feed/update/urn:li:activity:7496551943868395521/'
published_at: '2026-08-21T13:01:02.618Z'
impressions_72h: 1746
impressions_24h: null
likes_72h: 14
comments_72h: 3
shares_72h: null
cohort: 2 to 7 days
cohort_median_at_run: 876
beat_median_impressions: true
beat_peer_group: false
discussion_validated: true
hook_matched_body: true
decision: modify
summary: Same subject, same week, same pre-score as the 100k Cursor post, and 1.7% of its reach. A t2 subject the account covered two days earlier pays for the room twice.
wiki_candidate: A t2 subject discounts toward t1 reach when it is the account's second post on that subject inside a week — the standing room was already spent on the first post.
wiki_pages: [audience]
wiki_ingested: true
---

# Your database has a failover plan. GitHub doesn't.

1,746 impressions against a 2-to-7-day cohort median of 876 — 2.0x, so it beat its cohort.
It also landed below t2's observed floor (5,154), inside t1's band (1,271–3,570), on a
subject pre-scored `reach_ceiling: 2`.

It does not trip the page's `t2_miss_below: 1000` dispute trigger. Recording it as a
near-miss rather than a dispute.

## The controlled pair

This post and the 08-19 Cursor post are the closest thing the archive has to a matched
experiment, and it is a tighter pair than the SQLite/auto-mode one already on the audience
page — because here the *subject is the same*.

| | 08-19 Cursor | 08-21 failover |
|---|---|---|
| Subject | GitHub | GitHub |
| Tier at ideation | t2-universal | t2-universal |
| `reach_ceiling` | 2 | 2 |
| Idea score | 11 | 11 |
| `risk` | rehash | rehash |
| `experience_hook` | none | none |
| Source event | Aug 17 outage + Origin launch | Aug 17 outage postmortem |
| Impressions | 100,064 | 1,746 |

Every recorded axis matches. The reach differs 57x. So the separating variable is not on
the rubric.

## What actually separated them

The failover post was the account's **second post on August 17 GitHub in three days**. The
room that assembled for the Cursor post had already had this conversation. `risk: rehash`
was on the brief both times and was only true the second time — and nothing in the pipeline
noticed, because the ideator dedups against *recent drafts and posts by angle*, and these
two angles are genuinely different. The subject was not.

The corpus already carries one exemplar of this: the 05-20 TeamPCP sequel at 211
impressions, filed on the audience page as "a sequel to the owner's own prior post." That
was read as a t0 subject. This pair says the discount is not about the tier of the sequel's
subject — it is a discount applied *to* the tier, and a t2 subject absorbing it lands about
where t1 does.

Two alternatives I can't fully rule out at n=1:

- **Prescriptive second-person shape.** This post argues at the reader ("you have never
  rehearsed") and closes on an instruction. But `Your dependency bot should be three days
  late` is the same shape at 34,287, so prescriptive is not the fault.
- **Distribution variance.** 100,064 is an outlier by any measure, and a single
  algorithmically-amplified post can't anchor a ratio. The honest framing is that the
  failover post performed like an ordinary good post and the Cursor post did not — which
  still leaves the sequel discount as the best available explanation for why the second
  one didn't inherit the first one's room.

The craft was fine. The hook matched the body, the numbers were real (1.4B→2.9B commits,
eight hours, the vendor's own postmortem), and Jacob Blankenship's thread engaged the DR
angle directly — RogueDB has already pulled deploys off GitHub and is planning a
self-hosted git server with failover. Three comments is thin validation but it is the
right three.

## Decision: modify

Add a subject-level cooldown to ideation, separate from the existing angle-level dedup:
if the account has published on the same *named subject* within seven days, cap
`reach_ceiling` at 1 regardless of the subject's tier. The second post pays for a room the
first one already used.
