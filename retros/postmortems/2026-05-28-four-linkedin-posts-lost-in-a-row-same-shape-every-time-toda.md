---
kind: postmortem
source_post: posts/2026/05-28-four-linkedin-posts-lost-in-a-row-same-shape-every-time-toda.md
topic_family: other
source_type: build_log
hook_type: claim
impressions: 181
likes: null
comments: 1
shares: null
corpus_median_at_run: 443
beat_median: false
likely_failure_modes:
  - navel-gazing about my own posting process
  - narrow-interest topic with thin builder relevance
  - bolted-on news tail competing with the main wedge
decision: modify
summary: An experience-first build log about hardening a post critic landed at 41% of median because the LinkedIn-process framing narrowed an otherwise reusable gate design.
generated_at: 2026-08-03T12:25:30.000Z
---

The post tried to turn four losing LinkedIn posts into a builder lesson by showing two hard-zero rules added to the agent that critiques drafts.

It landed at 181 impressions against a 443 corpus median: 262 impressions below median, or 41% of it. Its single comment only supplied the promised source link.

The hook matches the body, and the post includes a real artifact plus a tested claim that the rule would have killed all four misses. The reach ceiling came from framing the artifact around the author's LinkedIn losing streak, a narrow meta-topic. May was also crowded with agent posts and adjacent agent-news takes, while the SQLite `AGENTS.md` tail introduced another borrowed story that competed with the gate mechanism.

Keep the hard-zero gate, but apply it to a builder problem: an agent that rejects work matching a logged production-failure pattern. Drop the LinkedIn scoreboard and SQLite tangent so the reusable control mechanism is the whole post.
