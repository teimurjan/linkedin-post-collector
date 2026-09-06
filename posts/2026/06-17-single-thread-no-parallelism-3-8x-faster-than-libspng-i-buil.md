---
urn: 'urn:li:activity:7472996515586965504'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7472996515586965504/'
posted_at: '2026-06-17T13:00:10.877Z'
impressions: 242
likes: 4
comments: null
shares: null
scraped_at: '2026-07-06T05:34:37.631Z'
lane: experience
---
Single thread, no parallelism, 3.8x faster than libspng.

I build BlazeDiff, a screenshot diffing tool. At some point the diff stopped being the slow part. Almost all the wall-clock time was I/O: decoding the two PNGs and writing the result.

libspng via FFI was the fastest decoder I'd found. So I wrote my own, SIMD-first, mirroring how spng reads bytes. Same output, rejects the same malformed inputs, just faster. Decode 1.4x. Encode 2.2x stored, 3.8x compressed at 94% of spng's file size.

None of it came from threads. It came from doing less memory work. Whole-buffer inflate instead of per-scanline gating. Defiltering fused in-place with RGBA expansion. Branchless Paeth. Hand-written NEON for the encode filter.

40M+ differential-fuzz runs against spng, zero divergences. Full PngSuite conformance.

When you think you need more cores, check your memory traffic first.
