---
draft_file: drafts/2026-06-09-you-can-drop-a-raw-llama-model-into-an-iphone.md
topic_family: other
source_type: news
published_url: https://www.linkedin.com/feed/update/urn:li:activity:7470097470501466112/
published_at: 2026-06-09T13:00:24.667Z
impressions_24h: null
impressions_72h: 296
likes_72h: 2
comments_72h: 0
shares_72h: 0
beat_median_impressions: false
beat_peer_group: true
discussion_validated: false
hook_matched_body: true
decision: block
summary: Sub-median reach with zero comments — the news-without-firsthand-signal anti-pattern again. Strong wedge, wrong shape.
---

# Retro: You can drop a raw Llama model into an iPhone app now

**Reach.** 296 impressions, 2 likes, 0 comments, 0 shares (single ~65h snapshot; no separate 24h reading). That lands under the 414 corpus median, so it did not beat median. Against the directly comparable `other + news` peer it cleared the floor — the closest match (the "1930 model" news take) sat at 198 — but that's beating the bottom of the distribution, not the news band that matters. The same WWDC cycle had a 7360-impression news winner; this never approached it.

**Discussion.** Zero comments means the wedge — "the most closed AI stack just opened at the model layer" — never got tested. The whole point of the post was to provoke an argument about Apple going model-agnostic, and nobody bit. Discussion not validated.

**Hook-to-body.** Clean match. The hook promises you can drop a raw Llama model into an iPhone app, and the body delivers exactly that mechanism (Core AI loads your own weights, no format conversion, auto-routes on-device vs cloud). No bait-and-switch here. The content was honest; the format was the problem.

**Decision: block.** This is the news-without-firsthand-signal pattern that has now failed four times in postmortems and was flagged again in the latest pattern report. A sharp wedge on a third-party announcement, with no firsthand artifact — nothing I built, ran, or measured against Core AI — reads as commentary, and commentary on someone else's keynote doesn't earn distribution or pull comments. The wedge itself was good and worth keeping; the shape was wrong.

**One concrete thing to stop:** Stop shipping news takes where my only relationship to the story is "I read the docs." If I want to post on Core AI, the entry fee is firsthand: actually load a Llama checkpoint through the new Swift API, hit one real wall, and lead with that result. No artifact, no post.
