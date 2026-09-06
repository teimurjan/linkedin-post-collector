---
urn: 'urn:li:activity:7458513912838242304'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7458513912838242304/'
posted_at: '2026-05-08T13:51:29.308Z'
impressions: 282
likes: 4
comments: null
shares: null
scraped_at: '2026-05-13T11:10:17.389Z'
lane: experience
---
Eighteen retrieval experiments on agent memory, and the boring algorithm won.

I just published the writeup. The short version: BM25, a ranking function from 1994, beat the fancier embedding setups across most of the conversational memory benchmarks I ran. Cross-encoder reranking on top added another 35%.

This isn't a "vectors are dead" take. But if you're building agent memory and reaching for FAISS by default, the priors might be wrong. Lexical match is doing more work than people give it credit for.

The other thing I dug into is retrieval-induced forgetting in clustered memory. When you retrieve one item from a cluster, related items get suppressed. It's a real effect on long-term conversational memory, +6.5% NDCG@10, statistically significant. It also doesn't generalize to ad-hoc IR. Worth being honest about.

All of this fed into a tool I now use every day: Lethe. Plugins for Claude Code and Codex, native Rust, JS and Python bindings, a CLI via brew, and a TUI. 11 of the 18 checkpoints failed or were null. The 7 that worked are what the tool runs on.

Curious if anyone running production agent memory has seen the same BM25 pattern, or if it falls apart at your scale.

Links in the comments.

---

## Comments

**Teimur Gasanov**

> Article: https://hackernoon.com/experimental-results-from-a-self-improving-retrieval-system-for-conversational-memory Repo: https://github.com/teimurjan/lethe

