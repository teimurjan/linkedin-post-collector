---
urn: 'urn:li:activity:7473721249303592960'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7473721249303592960/'
posted_at: '2026-06-19T13:00:00.860Z'
impressions: 163
likes: null
comments: null
shares: null
scraped_at: '2026-07-10T10:39:39.359Z'
---
Vercel just bet your agent is a directory, not code.

They open-sourced eve this week. An agent isn't an orchestration graph anymore. It's a folder. agent.ts for the model, instructions.md for the prompt, one file per tool, one file per channel.

Why does that matter? The filesystem is the contract. A connection is a file pointing at an MCP server, and eve brokers the auth so the model never touches your credentials.

The real payoff is durability. Every session runs as a workflow. It survives a crash, a cold start, a mid-deploy restart, and resumes where it stopped. The hand-glued stack in your repo does not do that.

This isn't a toy. Agents went from 3% to over half of Vercel's own deploys in six months.

The directory is the bet. Watch who copies it.
