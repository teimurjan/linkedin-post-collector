---
kind: postmortem
source_post: posts/2026/06-17-single-thread-no-parallelism-3-8x-faster-than-libspng-i-buil.md
topic_family: performance
source_type: build_log
hook_type: result
impressions: 113
likes: 3
comments: null
shares: null
corpus_median_at_run: 413
beat_median: false
likely_failure_modes:
  - narrow-interest topic with a small standing audience
  - deep-systems specifics that gate out non-specialist readers
decision: modify
summary: A genuinely strong firsthand SIMD codec build-log that under-reached at 113 — not a craft miss but a narrow-topic ceiling; PNG-decoder internals have a tiny standing audience.
generated_at: 2026-06-29T12:00:00.000Z
---

The post tried to share a firsthand performance win: rewriting a PNG decoder SIMD-first for BlazeDiff and beating libspng (decode 1.4x, encode up to 3.8x) by cutting memory traffic rather than adding threads.

It landed at 113 impressions against the 413 corpus median — about 27% of median — with 3 likes and no comments.

This is the rare miss that is **not** a content or honesty problem. The post has everything the patterns report rewards: a concrete result hook with named numbers, deep firsthand signal (40M+ differential-fuzz runs, full PngSuite conformance, branchless Paeth, hand-written NEON), and a hook that matches the body exactly. The cap is **audience size**. Per the reach model, reach ≈ standing-audience size × wedge sharpness, and a wedge cannot conjure a room. PNG-codec internals, whole-buffer inflate, and NEON defiltering are a niche systems curiosity — the standing audience that can parse "defiltering fused in-place with RGBA expansion" is small, so even a perfect post hits a low ceiling.

The single concrete change is to raise the topic's altitude without losing the firsthand artifact. Same work, but lead with the transferable lesson the post already buries in its last line — "when you think you need more cores, check your memory traffic first" — and frame the codec as the proof, not the subject. A memory-traffic-vs-parallelism post reaches every backend and systems engineer; a PNG-decoder post reaches the people who write codecs. Keep the numbers and the fuzzing rigor; trade the codec headline for the principle.
