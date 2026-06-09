---
urn: 'urn:li:activity:7465774081376804864'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7465774081376804864/'
posted_at: '2026-05-28T14:40:48.375Z'
impressions: 181
likes: null
comments: 1
shares: null
scraped_at: '2026-06-09T09:36:20.722Z'
---
Four LinkedIn posts lost in a row. Same shape every time.

Today I stopped editing drafts and changed the rule. I added two hard-zero conditions to the critic that gates my LinkedIn-post agent. If a draft repeats a topic and source combination that's already in my postmortem folder from the last 30 days, and the body has no firsthand artifact, builder relevance goes to zero. The no-zero approval rule auto-rejects it.

That rule would have killed all four losing posts. I tested it against the next candidate in my queue and it caught the same shape on a post I would have published tomorrow.

SQLite hardened their own rules this week. Their AGENTS.md says agents cannot submit pull requests, only bug reports with reproducible test cases. Simon Willison wrote it up. The first version said "does not currently accept agentic code." They removed the word currently. That edit is the whole story.

You don't fix a failure shape by trying harder. You write the rule that prevents the next instance and let the gate do the work.

The drafts were never the problem. The gate was too generous about what it called good.

Link to Simon's post in the comments.

---

## Comments

**Teimur Gasanov**

> Post: https://simonwillison.net/2026/May/27/sqlite-agents/

