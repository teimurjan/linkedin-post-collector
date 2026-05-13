---
urn: 'urn:li:activity:7406693209541869568'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7406693209541869568/'
posted_at: '2025-12-16T13:54:30.860Z'
impressions: 733
likes: null
comments: 2
shares: null
scraped_at: '2026-05-13T11:10:27.702Z'
---
I’ve been pretty quiet about BlazeDiff lately.

Mostly because I went deep into Rust and SIMD, and shipped BlazeDiff v2. It’s now the fastest single-threaded image diff I could find.

On 4K images (5600×3200):
BlazeDiff: ~327ms
odiff (Zig): ~1215ms

About 3.7× faster. Binaries are ~3× smaller too. Rust + SIMD helped a lot (NEON on ARM, SSE on x86). A new block-based approach enhanced it further. Instead of running expensive logic on every pixel, BlazeDiff does a cheap first pass to figure out 𝘸𝘩𝘦𝘳𝘦 differences might be, and only then runs the heavy perceptual diff there.

For JS users, it’s still simple:
npm install @blazediff/bin

Prebuilt binaries, full TypeScript API, no native builds. And the pure JS version is still there if you need it.

https://lnkd.in/edFqkiTe

---

## Comments

**Mohit Lohani**

> Awesome Teimur Gasanov 
> What do you think of using this as a diff tool that can compare the visual regressions like Chromatic?

↳ **Teimur Gasanov**

>> Mohit Lohani It can be an engine for a tool like Chromatic. I guess they have an in-house algorithm for that and curious if it’s faster. The least I can do (and I am going to do) within the BlazeDiff is to add Jest/Vitest/Cypress/Bun matchers to work out of the box locally.

