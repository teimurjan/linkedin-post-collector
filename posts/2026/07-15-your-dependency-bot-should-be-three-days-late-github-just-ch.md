---
urn: 'urn:li:activity:7483143454173065218'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7483143454173065218/'
posted_at: '2026-07-15T13:00:29.557Z'
impressions: 34287
likes: null
comments: null
shares: 2
scraped_at: '2026-08-06T06:28:40.430Z'
concept_path: concepts/2026-07-15-your-dependency-bot-should-be-three-days-late/prompt.md
---
Your dependency bot should be three days late.

GitHub just changed Dependabot's default. New version releases must sit on the registry for three days before it opens a pull request. Security updates still arrive immediately. Teams can override the window.

That is deliberate latency. I ship JS tooling on npm, and the same machinery that distributes a fix can distribute a compromised release before maintainers or users see the damage. Fast was treated as automatically safe. It isn't.

You still patch known vulnerabilities now. Routine upgrades can wait while the ecosystem takes the first hit. GitHub made that tradeoff across every supported ecosystem because most teams never configure release age themselves.
If your update bot treats a security fix and a package released ten minutes ago the same way, change the policy.
