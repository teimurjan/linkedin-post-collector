---
urn: 'urn:li:activity:7496551943868395521'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7496551943868395521/'
posted_at: '2026-08-21T13:01:02.618Z'
impressions: 1895
likes: 14
comments: 3
shares: null
scraped_at: '2026-09-01T10:41:29.571Z'
concept_path: concepts/2026-08-21-your-database-has-a-failover-plan-github-doesnt/prompt.md
---
Your database has a failover plan. GitHub doesn't.

On August 17, GitHub was down for almost eight hours. Not just repo browsing. Authentication, Actions, pull requests, the API, and Copilot all went with it. The postmortem blames a capacity failure in one Central US data center. Monthly commits went from 1.4 billion in April to 2.9 billion in August, and the infrastructure ran out of room.

GitHub is your deploy pipeline, not just a place to keep code. CI runs there. Releases go out from there. Package installs pull from there. Your team logs in through it. When it is down, most teams cannot cut a release at all.

You have rehearsed a database failover. You have never once rehearsed eight hours without GitHub.

That outage was the fire drill you keep skipping. Write the runbook before the next one, not during it.

---

## Comments

**Jacob Blankenship**

> RogueDB has ripped out reliance on GitHub because of the frequent outages. Deployments run on a local machine given the required permissions are granted to the account. 
> 
> This doesn't solve people being able to sync commits and branches. That will be the next step with a private git server running with backups and automatic failovers.

↳ **Jacob Blankenship**

>> Teimur Gasanov no most teams would not be able to do that. Corporate world always had laptops as proxies to virtual machines that were also locked down, or they use Codespaces with all their eggs in one basket.

