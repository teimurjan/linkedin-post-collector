---
urn: 'urn:li:activity:7467923125427429376'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7467923125427429376/'
posted_at: '2026-06-03T13:00:20.404Z'
impressions: 1085
likes: null
comments: 4
shares: null
scraped_at: '2026-06-10T06:22:37.287Z'
concept_path: concepts/2026-06-03-deno-just-hit-76-node-compatibility-ignore-the/prompt.md
---
Deno just hit 76% Node compatibility. Ignore the number.

A single compatibility percentage is a vanity metric. The 76% that works is the easy part: the common path everyone already tests. The 24% left over is native addons, obscure built-ins, and the way a process actually shuts down. That is where real apps live.

I ship JS tooling on npm. The gap between runs in a demo and survives in production is almost never the happy path. It is one weird native dependency. One assumption about how the process exits.

So 76% reads as almost there and behaves like not yet. The headline tells you how much is covered. Your migration breaks on what is left.

Don't port against the percentage. Port against your own dependency tree. The boring 24% decides whether you ship.

---

## Comments

**Stepan Orda**

> I wouldn't switch existing projects to Deno or Bun, but starting a new project with them is totally fine.

↳ **Stepan Orda**

>> Teimur Gasanov That was a publicity stunt, and they bought Bun specifically for that reason. If you have that good of a test coverage to make this kind of migration possible, most likely you don't really need it.

**Dmitry Belyaev**

> Why not to run integration tests in deno and see if it works for you?

