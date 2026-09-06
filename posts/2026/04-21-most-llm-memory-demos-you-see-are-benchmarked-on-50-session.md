---
urn: 'urn:li:activity:7452369597468655616'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7452369597468655616/'
posted_at: '2026-04-21T14:56:10.368Z'
impressions: 200
likes: 2
comments: null
shares: null
scraped_at: '2026-05-13T11:10:16.650Z'
lane: experience
---
Most LLM memory demos you see are benchmarked on 50-session databases. Random baseline: 10%. The real problem, searching 200k turns, is around 2000x harder.

I wanted to know what actually works at that scale, so I ran an experiment and wrote it up.

The pitch was simple. Human memory is one of the most studied systems we have, so why not borrow from it? I picked the immune system as the metaphor. Antibodies mutate, get selected, survive if they bind well. Embeddings could do the same: mutate useful ones, prune dead ones, let memory "evolve" toward what the agent actually needs.

Four experiments, two datasets. NDCG@10 on turn-level retrieval over the full 199,509-turn LongMemEval S corpus. Needle in a 200k haystack, no warm-up, no per-query database shrinking.

It didn't work. The mutations drifted, selection pressure was too noisy, and the baseline vector search quietly beat every variant. But the negative result is clean and reproducible, which is more than I can say for most memory demos floating around.

I don't think the biological framing is worthless though. I've got mocks of a different approach where parts of the pipeline do hold up, and I'll write about that separately once I have numbers.

For now: here's the one that broke, with the actual evals. Link in comments.

---

## Comments

**Teimur Gasanov**

> Post: https://hackernoon.com/i-tried-to-make-llm-memory-evolve-like-antibodies-heres-what-broke

