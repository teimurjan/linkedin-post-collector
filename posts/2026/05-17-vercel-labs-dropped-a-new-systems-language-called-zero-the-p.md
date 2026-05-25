---
urn: 'urn:li:activity:7461715487169728512'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7461715487169728512/'
posted_at: '2026-05-17T09:53:24.111Z'
impressions: 2192
likes: 12
comments: 4
shares: 1
scraped_at: '2026-05-25T06:58:42.010Z'
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

**Alasdair Allan**

> Your instinct that the toolchain ideas get copied before the language gets adopted is probably right. I've been cataloguing the full field: https://negroniventurestudios.com/2026/05/20/three-camps-alike-in-dignity/
>  
> Nineteen projects now, and the "compiler output as agent API" pattern is converging independently across them. Vera ships structured diagnostics, Aver has token-budgeted context export, AILANG has MCP tools. The diagnostics idea isn't unique to Zero.
>  
> But I'd push back on "you could bolt the same JSON output onto rustc tomorrow." You could bolt the diagnostics. You can't bolt the design constraints. Rust's grammar has a thousand valid ways to express the same thing. Zero and Vera (https://veralang.dev) both constrain that decision space deliberately. That's a language decision, not a tooling decision, and it's the part that compounding buys you.
>  
> Your prediction about adoption being brutal is the right concern. The existential question is whether LLMs get good enough at existing languages to make the whole category unnecessary.

↳ **Alasdair Allan**

>> Teimur Gasanov ...and following on from that essay I've started a public catalogue of every language designed for AI agents to write. So far 21 projects across the three camps it describes, https://agentlanguages.dev.

**Nikola Katsarov**

> Check this: https://github.com/escapeboy/boruna

