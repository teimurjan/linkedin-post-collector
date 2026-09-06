---
urn: 'urn:li:activity:7404136028078485504'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7404136028078485504/'
posted_at: '2025-12-09T12:33:11.289Z'
impressions: 1271
likes: null
comments: null
shares: 2
scraped_at: '2026-05-13T11:10:21.647Z'
lane: experience
---
I finally get to share something I’ve been working on for weeks: Avatune, an open-source avatar system with in-browser AI.

This started as a small experiment in training lightweight ML models in Python and porting them to TensorFlow.js. It turned into a full avatar engine that’s friendly to SSR and works across every major frontend framework.

The part I’m most proud of is how much of it runs natively in the browser. Upload a photo, and Avatune will predict hair color, skin tone, hair length, and facial hair presence on the fly. The models are trained on CelebA and FairFace and quantized down to a couple of megabytes, so they stay fast without feeling heavy.

Everything renders as native SVG. No canvas tricks, no hydration issues, no surprises when running in Next.js, SvelteKit, or Nuxt. And every framework gets its own real component: React, Vue, Svelte, React Native, and Vanilla JS.

I ended up building a small toolchain around it too: Turborepo, Bun, Rspack, and a set of custom Rsbuild plugins to fix SVG mask collisions. Two of those plugins are now open source because they kept helping with other SVG-heavy projects.

If you want to try it out:
- Website: https://avatune.dev
- GitHub: https://lnkd.in/eFngWt_m

The ML models are still experimental, so I’d love feedback on accuracy and strange edge cases. And if you like training attribute predictors, PRs are very welcome.
