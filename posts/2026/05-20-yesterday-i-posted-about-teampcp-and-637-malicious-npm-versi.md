---
urn: 'urn:li:activity:7462900840442310656'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7462900840442310656/'
posted_at: '2026-05-20T16:23:34.354Z'
impressions: 199
likes: 3
comments: null
shares: null
scraped_at: '2026-05-25T06:58:38.391Z'
---
Yesterday I posted about TeamPCP and 637 malicious npm versions. Today the same group is claiming GitHub itself. Roughly 4000 internal repos, on sale for $50k.

It's the same crew that hit Trivy (one CVE touched 1,000+ orgs including Cisco), Checkmarx, and LiteLLM. They are not picking one target a year. They are working through the supply chain stack in order.

If you want to guess where they go next, the obvious surface is the registries that look like npm but have smaller security teams. PyPI, crates.io, RubyGems.

After that, the registries we've started trusting without thinking. HuggingFace for model weights pulled straight into pipelines. The VS Code and JetBrains extension marketplaces that auto-update inside your editor. The GitHub Actions marketplace, where one compromised action ships into thousands of CI runs that already hold your secrets.

None of this is exotic. It's the same preinstall-hook playbook in a different store.

Pin versions. Run untrusted installs in containers with no bind mounts. Scope tokens to one task and one repo. Get that done this week. The next writeup is already being drafted somewhere, and the win is not being in it.
