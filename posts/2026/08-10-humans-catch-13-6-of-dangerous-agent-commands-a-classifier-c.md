---
urn: 'urn:li:activity:7492565507951493120'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7492565507951493120/'
posted_at: '2026-08-10T13:00:22.231Z'
impressions: 147
likes: null
comments: null
shares: null
scraped_at: '2026-08-21T06:16:08.121Z'
---
Humans catch 13.6% of dangerous agent commands. A classifier catches 89%.

That's Anthropic's own number, from testing 1053 people on Claude Code's prompts. Starting August 14, the classifier becomes the default for Pro, Max, and Team plans, checking every tool call against your project's boundary instead of asking you first. I run this pipeline on Claude Code subagents. That default just changed under me too.

But a classifier only judges the boundary it's told exists. Meta, Anthropic, and OpenAI each disclosed a breach this month. A misconfigured sandbox gave the agent access to the open internet it was never supposed to have. No bad command needed.

That's the layer LeadDev's numbers describe: 81% of teams give coding agents write access, only 7% keep them read-only. That decision gets made once, long before any classifier checks a single command.

Check what your agent can already reach. Auto mode won't.
