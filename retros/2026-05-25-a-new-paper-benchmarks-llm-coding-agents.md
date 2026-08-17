---
draft_file: drafts/2026-05-25-a-new-paper-benchmarks-llm-coding-agents.md
topic_family: agents
source_type: paper
hook_type: claim
published_url: https://www.linkedin.com/feed/update/urn:li:activity:7464656714479616000/
published_at: 2026-05-25T12:40:47.347Z
impressions_24h: null
impressions_72h: 160
likes_72h: 2
comments_72h: null
shares_72h: null
metrics_age: ~64h (single scrape on 2026-05-28T05:36Z; just shy of a true 72h reading but close enough that the curve is set)
corpus_median_impressions: 414
peer_group_median_impressions: 172
beat_median_impressions: false
beat_peer_group: false
discussion_validated: false
hook_matched_body: true
decision: block
summary: 160 impressions, 2 likes, no comments — the lowest agents post in the recent run and under both the 414 corpus median and the 172 agents-family bottom median. A paper recap with no firsthand reproduction. The wedge ("constraint decay") is good; the shape is wrong.
---

## Metrics caveat

One scrape at ~64h. 160 imp / 2 likes / null comments / null shares. Nulls almost
certainly mean the scraper didn't pick reactions up rather than literal zero, but
at this volume the engagement is structurally low either way.

## Did it beat median impressions?

No. 160 vs the 414 corpus median is roughly 2.5x under. Worse, it's the lowest of
the three consecutive agents posts (160 < 172 < 200) and now sits second-to-last in
the entire archive after the off-brand Roll token post (76). The agents bottom-cluster
median is 172; this one is below even that.

## Did it outperform similar topic_family + source_type posts?

No. There are no other `agents + paper` posts in the corpus to compare against
directly, but as an agents-family post it underperforms both the family median
(172 bottom, 2192 top) and every recent peer. The pattern is now three consecutive
agents misses: Qwen 3.7 Max (196), the RAG retrospective (172), this one (160) —
a downward trajectory.

## Did comments validate the intended angle?

No — zero comments scraped, and no comment summary supplied. The "constraint decay"
wedge is genuinely strong and should have pulled at least one back-end engineer into
the thread. Silence at 64h is the signal: the post did not reach enough builders
for a discussion to start.

## Was the hook accurate to the body?

Yes. "A new paper benchmarks LLM coding agents on 100 back-end tasks across 8 web
frameworks and finds something the leaderboard versions don't" is delivered: the
30-point drop, FastAPI/Django breaking, constraint decay named. No bait. The hook
is just too research-summary-shaped to compete on cold distribution — it announces
a paper instead of a stake.

## Decision: block

Not the wedge — the shape. Three compounding issues:

1. **Paper recap with no firsthand reproduction.** This is the same anti-pattern
   that killed the 05-22 Antigravity post: news/paper without a firsthand signal.
   The author didn't run the benchmark, didn't hit constraint decay on a real
   project, didn't have a Django migration story. The wedge is borrowed from the
   paper, so the post adds framing but no evidence. The postmortem corpus has now
   logged this anti-pattern four times.

2. **Third agents post in eleven days, all weak.** 196, 172, 160 — same family,
   same downward arc. The audience signal is clear: back-to-back agents takes
   without artifacts are getting throttled. Spacing matters now.

3. **Hook announces a paper, not a stake.** "A new paper benchmarks…" trains the
   scroller to expect a recap. The much stronger line is buried halfway down:
   *"The phenomenon has a name now. Constraint decay."* That sentence is the
   post. Leading with it would have given the cold reader a thing to fight about
   in the first three words.

**One thing to repeat:** the "constraint decay" framing itself. Name a thing,
make it portable. That is the line a reader can quote back. Keep it for a future
post — attached to a firsthand experience (a real Django project that broke an
agent), not a paper summary.

**One thing to stop:** posting paper / benchmark summaries as standalone takes.
The corpus is now telling the same story from two angles (news recaps and paper
recaps both die without firsthand signal). Until the next agents post anchors to
the author's own work, this lane is closed.
