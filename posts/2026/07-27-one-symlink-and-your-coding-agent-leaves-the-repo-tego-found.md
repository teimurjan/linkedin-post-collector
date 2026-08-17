---
urn: 'urn:li:activity:7487492285597650945'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7487492285597650945/'
posted_at: '2026-07-27T13:01:11.766Z'
impressions: 435
likes: 3
comments: null
shares: null
scraped_at: '2026-08-17T10:33:54.710Z'
concept_path: >-
  concepts/2026-07-27-one-symlink-and-your-coding-agent-leaves-the-repo/prompt.md
---
One symlink, and your coding agent leaves the repo.

Tego found it in Claude Code 2.1.215. A memory import pointing at ./link gets classified by that lexical path, so it reads as local and skips the external-import warning. The read then follows the symlink to wherever it really points. Two earlier CVEs closed this same class in other code paths. This one was still open when it went public.

I keep my agent setup as markdown in a repo, and those files get pulled into context every run. That is the exact path this hits. Clone a repo, open it, done. No prompt injection, no network step.

The approval screen shows you intent. What the filesystem hands back is a separate thing, and nothing is checking it.

Check your clones for symlinks before you open them.
