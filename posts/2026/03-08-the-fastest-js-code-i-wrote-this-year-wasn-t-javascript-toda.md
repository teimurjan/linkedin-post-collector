---
urn: 'urn:li:activity:7436414641854918656'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7436414641854918656/'
posted_at: '2026-03-08T14:16:52.521Z'
impressions: 667
likes: 2
comments: null
shares: null
scraped_at: '2026-05-13T11:10:21.789Z'
---
The fastest JS code I wrote this year… wasn’t JavaScript.

Today I published the deeper story.

It starts with a simple problem: pure JavaScript was becoming the bottleneck for large image comparisons.

I experimented with multiple approaches and benchmarks and eventually ported the core algorithm to Rust.

Along the way, I looked at existing tools like odiff. It's very fast, but typically used through spawned processes or long-running helpers to avoid that overhead.

The interesting part for me was the interface layer.

Instead of spawning binaries or running a server, the library uses N-API to let Node call the Rust implementation directly. That removes the process overhead and makes batch diffing much cheaper.

If you like performance deep dives, the full write-up is here:
https://lnkd.in/dDP58i6q

Also, thanks to HackerNoon for selecting it as a Top Story.
