---
urn: 'urn:li:activity:7490034267058790400'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7490034267058790400/'
posted_at: '2026-08-03T13:22:07.374Z'
impressions: 4743
likes: 6
comments: null
shares: null
scraped_at: '2026-08-10T09:42:05.440Z'
concept_path: concepts/2026-08-03-typescript-7-is-11x-faster-your-linter-still/prompt.md
---
TypeScript 7 is 11x faster. Your linter still can't run it.

Microsoft recently shipped TypeScript 7.0, a native Go compiler port. VS Code's build time drops from 125.7 seconds to 10.6. Slack's CI type-checking goes from 7.5 minutes to 1.25.

The compiler shipped without a stable programmatic API. typescript-eslint can't touch it. Neither can the Vue, Svelte, Astro, or Angular tooling reading your TypeScript right now. That API lands in 7.1, not today's release.

I ship JS tooling on npm, so a compiler jump that outruns its own ecosystem isn't abstract to me. My linter and my framework integrations wait on a point release before any of that speed reaches my builds.

Microsoft's own advice is to adopt 6.0 first anyway, since 7.0 turns every deprecation into a hard error. The compiler moved. Your toolchain hasn't caught up yet.

---

## Comments

**Ralph C.**

> try ox lint

