---
urn: 'urn:li:activity:7491116007546339328'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7491116007546339328/'
posted_at: '2026-08-06T13:00:34.404Z'
impressions: 209
likes: null
comments: null
shares: null
scraped_at: '2026-08-21T06:16:06.662Z'
---
Eleven of my last twenty commits say chore: uptodate.

An agent wrote most of that code. I described what I wanted in a chat window, it worked, I committed. The message is something I typed in two seconds after the fact. Everything about why the code looks like that lives in a conversation git never saw.

Zed put DeltaDB into early access this week to go after exactly that. It records every operation between commits and gives each one a stable identity, then links the change back to the agent conversation that produced it. From any line, find the thread. It virtualizes the worktree too, so a new agent branch is close to free.

I am not sure I want my chat logs sitting in version control forever. But git blame is answering a question I stopped needing answered. Would you want the conversation in the repo?
