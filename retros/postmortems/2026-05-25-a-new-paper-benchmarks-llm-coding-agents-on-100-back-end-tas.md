---
kind: postmortem
source_post: posts/2026/05-25-a-new-paper-benchmarks-llm-coding-agents-on-100-back-end-tas.md
topic_family: agents
source_type: news
hook_type: announcement
impressions: 184
likes: 2
comments: null
shares: null
corpus_median_at_run: 443
beat_median: false
likely_failure_modes:
  - news posts without firsthand signal
  - announcement hook that reads like recap
  - paper recap with no firsthand reproduction in a saturated family
decision: block
summary: A strong constraint-decay wedge wrapped in an unreproduced paper recap landed at 42% of median; block agents + paper recap until an artifact justifies it.
generated_at: 2026-08-03T12:25:30.000Z
---

The post tried to surface “constraint decay”: coding agents losing roughly 30 assertion-pass-rate points as framework and architecture requirements accumulate.

It landed at 184 impressions against a 443 corpus median: 259 impressions below median, or 42% of it. It earned 2 likes and no comments.

The hook announces a paper instead of leading with the claim. Every useful number—the 100 tasks, 8 frameworks, 30-point loss, and data-layer defect finding—comes from someone else's benchmark, and the body adds a second borrowed ClickHouse source rather than a reproduction. May already contained several agent posts and launch or news recaps, so the topic family was saturated and this one brought no firsthand artifact.

Block the agents + paper-recap-news combination until the author runs the test. Reproduce one constrained FastAPI or Django task, stack requirements, and publish the resulting pass-rate curve; then the constraint-decay wedge has owned evidence.
