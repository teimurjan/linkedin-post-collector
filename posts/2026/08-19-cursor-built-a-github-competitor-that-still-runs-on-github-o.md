---
urn: 'urn:li:activity:7495827006744489984'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7495827006744489984/'
posted_at: '2026-08-19T13:00:24.139Z'
impressions: 14812
likes: 21
comments: 8
shares: null
scraped_at: '2026-08-21T06:16:07.093Z'
concept_path: concepts/2026-08-19-cursor-built-a-github-competitor-that-still-runs/prompt.md
---
Cursor built a GitHub competitor that still runs on GitHub.

On August 17 Cursor shipped Origin, its own code hosting, to every paid plan. GitHub went down the same day, so it read like a replacement. Then you read the notes. For synced repos, GitHub stays the source of truth, and your checks still run GitHub Actions. The challenger runs on the rails of the thing it is challenging.

Git hosting was never the lock-in. Every git host is a GitHub alternative. None is a replacement. What holds you is the network: the pull requests, the Actions, the identity, every integration that assumes a github.com URL. You can copy the storage in an afternoon. Not the gravity.

So Origin is not about hosting. Cursor put your code, your PRs, and your agents in one place. That is the loop, and the agent sits inside it. An AI coding company does not want your git storage. It wants the surface your agent works on.

---

## Comments

**Ian Daley**

> If you are big into actions and possess the skills you should use Gitea. Especially if you care about your code not being used for LLM training.

↳ **Ian Daley**

>> Teimur Gasanov where we can yes. Gitea on AWS EC2 with EC2 runners and daily snapshots. More reliable and cheaper than Github... plus the LLM monster won't eat your code.

**Michael Cochran 🦀**

> Gitlab ce is an option too. Self hosted if you want it air gapped.

↳ **Teimur Gasanov**

>> Michael Cochran 🦀 Yeah, GitLab's the one that ships the whole network and not just the git. Air-gapped is the real case for it.

**Nelson Spence**

> For now. I believe they're using the rip-and-replace strategy.

↳ **Teimur Gasanov**

>> Nelson Spence That's the read. Start on GitHub's rails, then swap the network out under people. If they pull that off it's the whole game.

**Steffen Rudkjøbing**

> If you want a European alternative to github or.. origin, you can try gitoro.com
> 
> It is running on OVH hardware, has NO US exposure and gitoro is running on gitoro ;D

