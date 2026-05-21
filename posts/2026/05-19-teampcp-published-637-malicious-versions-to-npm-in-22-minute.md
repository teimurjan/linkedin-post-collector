---
urn: 'urn:li:activity:7462503797555220483'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7462503797555220483/'
posted_at: '2026-05-19T14:05:51.953Z'
impressions: 168
likes: null
comments: 2
shares: null
scraped_at: '2026-05-20T15:25:35.169Z'
---
TeamPCP published 637 malicious versions to npm in 22 minutes, across 317 packages, including size-sensor and echarts-for-react. Both pull more than four million monthly downloads each.

The preinstall hook drains everything it can reach. AWS keys, SSH keys, GitHub PATs, npm tokens, Kubernetes service accounts, Vault tokens, database strings. Then it commits the loot to public GitHub repos under stolen credentials and disguises the exfil as Python requests.

It also drops a daemon called kitty-monitor, hijacks Claude Code via SessionStart hooks, and worms across other projects on the same machine.

Your device should not run npm install. Not for client work, not for OSS, not for a quick demo. Every install should happen inside a container with no bind mounts and no Docker socket exposed.

Containers are still not a sandbox, but containers remove things like `~/.aws`, `~/.ssh` plus the Claude session class of compromise. That is most of what these attacks are after.

You don't audit the package you're installing. You audit 137 transitive dependencies you have never heard about. The right question isn't whether you trust the package. It's whether your laptop should be in the blast radius at all.

---

## Comments

**Oleg Puzanov**

> npm install -g npm@latest --min-release-age=7 at least
> 
> but better to pin every stable version

↳ **Teimur Gasanov**

>> Oleg Puzanov Thanks for flagging it. It would indeed work for Mini Shai-Hulud. Unfortunately there are players like PhantomRaven that sat on npm for 2-4 months before anyone noticed. Pinning is the way to go, until you start contributing to an OSS project where you have zero control over the deps list 😅

