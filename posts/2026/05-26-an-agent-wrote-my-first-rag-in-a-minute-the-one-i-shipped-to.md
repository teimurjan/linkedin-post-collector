---
urn: 'urn:li:activity:7465039149860020224'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7465039149860020224/'
posted_at: '2026-05-26T14:00:27.047Z'
impressions: 296
likes: 3
comments: 1
shares: null
scraped_at: '2026-06-01T05:44:01.162Z'
concept_path: concepts/2026-05-26-an-agent-wrote-my-first-retrieval-system/prompt.md
---
An agent wrote my first RAG in a minute. The one I shipped took eighteen experiments.

The fast version looked finished. Embeddings, a vector store, the stack everyone reaches for. It would have passed a demo.

The one that shipped runs on BM25, a ranking function from 1994. It beat the fancier setups across most of my agent-memory benchmarks. Eleven of those eighteen checkpoints failed before I got there. Nothing about the quick first answer would have told me to keep checking.

Nolan Lawson wrote this week about using AI to write better code more slowly. He runs Claude, Codex, and Bugbot in parallel to review a single PR, ranks the bugs by severity, then fixes them. He is blunt that this does not make him faster. You surface old bugs, you wander into writing the tests you skipped.

The same week, the timeline filled with the opposite. George Hotz calling coding agents one of the costliest mistakes in software. Posts about an eternal Sloptember of generated junk.

Both sides are counting the wrong thing. One counts lines shipped per hour, the other counts slop. The number that actually predicts quality is how much of the agent's first answer you were willing to delete.

If your agent is making you faster, you are probably keeping too much of what it hands you. The leverage was never the minute it took to generate. It was having a draft cheap enough to throw away eighteen times.

---

## Comments

**Ahmed Nadar**

> The delete ratio framing is the one I am keeping. Solo on a Rails civic app in Toronto with Claude Code and the eighteen experiments version is every feature worth shipping. BM25 over embeddings is a perfect example: the constraint was retrieval quality in production, not stack legibility in a demo. The agent running fast is cheap. The judgment about which answer to throw away is the part that stays expensive.

