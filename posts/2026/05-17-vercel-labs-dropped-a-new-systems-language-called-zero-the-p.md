---
urn: 'urn:li:activity:7461715487169728512'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7461715487169728512/'
posted_at: '2026-05-17T09:53:24.111Z'
impressions: 1585
likes: 10
comments: 1
shares: 1
scraped_at: '2026-05-18T11:06:09.854Z'
---
Vercel Labs dropped a new systems language called Zero. The pitch: “the programming language for agents.”

My first reaction was that this is mostly tooling dressed up as a language. Capability-based I/O, no mandatory GC, explicit effects, tiny binaries. None of that is new. Rust, Zig, and Roc have been in this space for years. The actual novelty is zero check --json with stable diagnostic codes and typed repair metadata. That’s a CLI decision, not a language decision.

You could bolt the same JSON output onto rustc tomorrow.

But the framing is what makes me keep the tab open. Agents write a meaningful share of code, so optimizing the toolchain for machine-readability stops being cosmetic. Stable error codes, fix plans, and structured graph output become the API agents actually use. Most existing compilers treat that surface as an afterthought.

The bet is that being agent-native from day one compounds, the same way TypeScript’s editor integration compounded against Flow.

I’m skeptical it pays off as a language. Adoption is brutal, and “small native binaries” is a crowded fight. But the toolchain ideas are the part worth watching. I’d bet the JSON diagnostic format gets copied long before the language itself gets used in production.
Repo’s at vercel-labs/zero if you want to poke at it.

---

## Comments

**Nikola Katsarov**

> Check this: https://github.com/escapeboy/boruna

