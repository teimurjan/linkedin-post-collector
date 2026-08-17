---
draft_file: drafts/2026-05-26-an-agent-wrote-my-first-retrieval-system.md
published_url: https://www.linkedin.com/feed/update/urn:li:activity:7465039149860020224/
published_at: 2026-05-26T14:00:27.047Z
topic_family: agents
source_type: opinion
hook_type: result
impressions_24h: 121
impressions_72h: null
likes_72h: 3
comments_72h: 1
shares_72h: null
metrics_age: ~17h (re-scraped 2026-05-27T06:57Z; not yet a settled 72h reading)
corpus_median_impressions: 414
beat_median_impressions: false
beat_peer_group: false
discussion_validated: true
hook_matched_body: true
decision: modify
summary: Strong experience-first execution and a clean hook-to-body match, but reach stayed weak (121 imp at ~17h, under the 414 median and tied with the prior weak agents post). The single comment landed exactly on the intended angle, so this reads as a distribution problem, not a content one.
---

## Metrics caveat

Two scrapes: 36 imp at ~2.5h (16:37Z) and 121 imp / 3 likes at ~17h (next-day
06:57Z). So the post is climbing slowly, not dead — but the curve is shallow and
still well under the 414 corpus median. Numbers are frozen at scrape time; a true
72h reading hasn't been taken yet, though the trajectory is unlikely to clear median.

## Did it beat median impressions?

No. 121 at ~17h vs a corpus median of 414 — roughly 3-4x under and tracking flat.
Within the `agents` family it's essentially tied with the prior weak peer (123), at
the bottom of the group.

## Did it outperform similar topic_family + source_type posts?

No. This is now the second agents post in a row to underperform (123, then 121). The top
agents post in the archive (Vercel Zero, 2192 imp) was a news-anchored announcement
with a concrete artifact people could go look at. This post offered a worldview
("count your delete ratio") rather than a thing — and worldview-only takes are
proving fragile in early distribution.

## Did comments validate the intended angle?

In quality, yes; in volume, no. The one commenter (Ahmed Nadar) quoted the exact
wedge back — "the delete ratio framing is the one I am keeping" — and extended it
with his own Rails/BM25 example. That is a perfect angle validation from a real
builder. But one comment is not a discussion; the reach never reached enough people
for a thread to form.

## Was the hook accurate to the body?

Yes. "An agent wrote my first RAG in a minute. The one I shipped took eighteen
experiments." is delivered exactly: the 18 experiments, the 11 failed checkpoints,
BM25 beating embeddings. No bait. One drift worth noting: the draft said "retrieval
system," the published hook said "RAG." Leading with an acronym narrows the cold
audience LinkedIn samples first, and that may have throttled the initial push.

## Decision: modify

Do not blame the experience-first strategy — it worked. The post had a real
first-person story, news as evidence (Lawson + Hotz + Sloptember), and the one
person who saw it got the point. The failure is upstream of the writing: reach.

Two compounding reach problems to fix:

1. **Acronym/jargon hook on cold distribution.** "RAG" in the first four words asks
   the casual scroller to already be an AI-infra person. Keep the draft's plainer
   "retrieval system" (or "search") in the hook; save "RAG/BM25" for the body where
   the committed reader rewards specificity.

2. **Back-to-back agents skepticism.** Two consecutive agents-fatigue posts both
   died. The "both sides are counting the wrong thing" meta-frame is the weaker
   sibling of a stance — it's clever but unshareable. Next agents post should anchor
   to a concrete artifact (a benchmark table, a repo, a number people can argue with)
   the way the 2192-imp Zero post did, and space it away from the last skeptic take.

**One thing to repeat:** the BM25-beat-embeddings, 11-of-18-failed detail is the
strongest line and the commenter cited it — lead future posts with the concrete
result, not the worldview built on top of it.

**One thing to stop:** opening on an acronym. Plain-language hook, jargon in the body.
