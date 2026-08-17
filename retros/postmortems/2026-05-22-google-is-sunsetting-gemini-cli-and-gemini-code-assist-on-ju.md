---
kind: postmortem
source_post: posts/2026/05-22-google-is-sunsetting-gemini-cli-and-gemini-code-assist-on-ju.md
topic_family: agents
source_type: news
hook_type: announcement
impressions: 183
likes: null
comments: null
shares: null
corpus_median_at_run: 415
beat_median: false
likely_failure_modes:
  - news posts without firsthand signal
  - announcement hook that reads like recap
  - second-hand sourcing (Pragmatic Engineer, "early users report") instead of own use
decision: modify
summary: A vendor-news read on Google retiring Gemini CLI/Code Assist into Antigravity 2.0 with a sharp lock-in thesis but zero firsthand migration experience; modify by anchoring on your own tool migration pain.
generated_at: 2026-05-26T06:00:00.000Z
---

The post tried to read Google's forced sunset of Gemini CLI and Gemini Code Assist into Antigravity 2.0 as a lock-in story — arguing the dependency moved from the editor to the agent harness.

It landed at 183 impressions against a 415 median (~44%), in the bottom quartile with no recorded likes or comments.

It exhibits the corpus's most repeated anti-pattern: news without firsthand signal. The hook restates Google's announcement ("Google is sunsetting Gemini CLI and Gemini Code Assist on June 18"), so it reads as a recap of a press release rather than a builder's take. The supporting evidence is all second-hand — "The Pragmatic Engineer headline calls it...", "Early users report bugs, poor UX, and a token burn rate they didn't budget for" — the author never says they used Antigravity, attempted the migration, or hit the missing feature parity. The lock-in thesis in the final paragraphs is the post's strongest asset but arrives as abstract analysis, not lived experience.

Topic family is effectively `agents`/dev-tooling (the heuristic filed it under security), which is not saturated by the author's own posts that week, so timing isn't the issue.

The single thing to change: lead with a firsthand migration moment — a workflow you (or a team you know) actually ran on Code Assist and now have to rebuild on a harness with no feature parity and a four-week deadline — then generalize to the editor-to-harness lock-in point. Same topic worth retrying; ground it in use, not in others' reports.
