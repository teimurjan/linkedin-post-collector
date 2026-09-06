---
urn: 'urn:li:activity:7495827006744489984'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7495827006744489984/'
posted_at: '2026-08-19T13:00:24.139Z'
impressions: 100588
likes: 57
comments: 29
shares: null
scraped_at: '2026-09-01T10:41:25.368Z'
concept_path: concepts/2026-08-19-cursor-built-a-github-competitor-that-still-runs/prompt.md
---
Cursor built a GitHub competitor that still runs on GitHub.

On August 17 Cursor shipped Origin, its own code hosting, to every paid plan. GitHub went down the same day, so it read like a replacement. Then you read the notes. For synced repos, GitHub stays the source of truth, and your checks still run GitHub Actions. The challenger runs on the rails of the thing it is challenging.

Git hosting was never the lock-in. Every git host is a GitHub alternative. None is a replacement. What holds you is the network: the pull requests, the Actions, the identity, every integration that assumes a github.com URL. You can copy the storage in an afternoon. Not the gravity.

So Origin is not about hosting. Cursor put your code, your PRs, and your agents in one place. That is the loop, and the agent sits inside it. An AI coding company does not want your git storage. It wants the surface your agent works on.

---

## Comments

**Atharva Pandey**

> Hot take: I feel like all the people complaining about GitHub do not understand the scale at which GitHub is handling all of these commits and pushes of code. In the agentic era, where code has become much cheaper, people are pushing random around it so it's very heavy and very expensive.
> I feel like the way GitHub has tried to handle it is still quite respectable. People are just way too quick to judge it. I feel like any new platform, probably even alternative platforms like Codeberg or even this Origin, are not even handling a fraction of the load that GitHub handles. I think it should be respected enough while everyone keeps scribbling about it.

↳ **Robert F.**

>> Atharva Pandey I also would have accepted "that time a GTA6 event killed the site". 
>> 
>> Really set myself up for failure there.

**Ian Daley**

> If you are big into actions and possess the skills you should use Gitea. Especially if you care about your code not being used for LLM training.

↳ **Ian Daley**

>> Teimur Gasanov external work has its own repos and most of the time it's on Github. So... we do what we must. But anything internal exists on our own infra.

**Charlie Punchatz**

> This conflates Origin’s migration path with Origin itself. GitHub remains the source of truth for mirrored repositories, which Cursor recommends as a way to adopt Origin without a flag-day migration. But Origin also supports native repositories where Origin is the source of truth, and a GitHub mirror can be detached to become one.
> 
> So Origin isn’t “running on the rails of GitHub.” Cursor recommends mirroring for users heavily invested in GitHub, or who aren’t comfortable cutting over immediately but still want the benefits of Origin. Mirroring isn’t new; GitLab, for example, has supported it for years.
> 
> There’s a good point here about the gravity around GitHub—CI, PRs, identity, integrations—but compatibility during a migration isn’t the same thing as architectural dependence.

↳ **Teimur Gasanov**

>> Charlie Punchatz Fair on the distinction, native repos with Origin as the source of truth is a real thing and I was loose there. Still, mirroring is the path Cursor recommends because the PRs, identity and integrations already live on github.com, which is the gravity you land on at the end.

**Michael Cochran 🦀**

> Gitlab ce is an option too. Self hosted if you want it air gapped.

↳ **Teimur Gasanov**

>> Michael Cochran 🦀 Yeah, GitLab's the one that ships the whole network and not just the git. Air-gapped is the real case for it.

**Steffen Rudkjøbing**

> If you want a European alternative to github or.. origin, you can try gitoro.com
> 
> It is running on OVH hardware, has NO US exposure and gitoro is running on gitoro ;D

↳ **Steffen Rudkjøbing**

>> Remo K. Thats fair. Codeberg is for open source projects only, I think. 
>> 
>> Gitoro was initially written by me in python, but now it is rewritten in go mainly with the help of ai. That is how things are built now, love it or hate it. That said, the landing page could use a human touch! (I am just terrible at marketing).

**Matthew Adams**

> Cold take, run forgejo with runners on Kube with ceph or another distributed fs and be professional about it if you need private repos.

↳ **Teimur Gasanov**

>> Matthew Adams That is the honest version of it. The tradeoff is you now own the Kube and the ceph on top of the git, which is fine if you have the person for it.

**Nelson Spence**

> For now. I believe they're using the rip-and-replace strategy.

↳ **Teimur Gasanov**

>> Nelson Spence That's the read. Start on GitHub's rails, then swap the network out under people. If they pull that off it's the whole game.

**Remo K.**

> "none is a replacement"
> Forgejo/Codeberg, Gitea??

↳ **Teimur Gasanov**

>> Remo K. Fair, I overstated the API part, and the permissions key is a good example. What I meant is that it is Actions shaped at all. The workflow model got copied even where the routes did not.

**Stratos Papafotiou**

> When i first got the email i thought that it's a smart move, github was not meant to withstand so much data/traffic and cursor is solving a problem, filling an actual market gap. 
> 
> Then i saw they are using github 🤦

**Eric Kimminau**

> Sure for repo but I will NEVER use GitHub copilot again.

