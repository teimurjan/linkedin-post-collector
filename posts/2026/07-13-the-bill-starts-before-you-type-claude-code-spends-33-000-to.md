---
urn: 'urn:li:activity:7482418644459851776'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7482418644459851776/'
posted_at: '2026-07-13T13:00:21.455Z'
impressions: 289
likes: null
comments: null
shares: null
scraped_at: '2026-08-06T06:28:36.940Z'
concept_path: >-
  concepts/2026-07-13-claude-code-spends-33000-tokens-before-your-prompt/prompt.md
---
The bill starts before you type.
Claude Code spends 33,000 tokens before your prompt.

Systima put Claude Code and OpenCode on the same model, machine, and tasks. Claude started at about 32.8k tokens, OpenCode at 6.9k. In Claude, tool schemas alone were 24k. Add a real 72 KB instruction file and both pick up another 20k per request. Five MCP servers add about 5k to 7k more.

Then the multi-step task flipped it. Claude finished in three requests and 121k input tokens. OpenCode took nine requests and 132k. Smaller bootstrap, paid more often.

Do not choose a coding agent from one empty-turn screenshot. Measure the fixed context tax, cache stability, and model round trips across work you actually ship. Their test was small, with two model families used only in selected lanes. The method is the useful part. What do you track: tokens per turn or tokens per completed task?
