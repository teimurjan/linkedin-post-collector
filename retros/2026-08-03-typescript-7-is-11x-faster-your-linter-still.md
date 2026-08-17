---
draft_file: drafts/2026-08-03-typescript-7-is-11x-faster-your-linter-still.md
topic_family: security
source_type: news
published_url: 'https://www.linkedin.com/feed/update/urn:li:activity:7490034267058790400/'
published_at: '2026-08-03T13:22:07.374Z'
impressions_24h: null
impressions_72h: 1140
likes_72h: 5
comments_72h: null
shares_72h: null
beat_median_impressions: true
beat_peer_group: true
discussion_validated: false
hook_matched_body: true
decision: modify
summary: 'Beat the corpus median 2.6x and the only same-family news peer, but the like rate was thin and the classifier does not credit the "I ship npm tooling" line as real firsthand signal — it is a stake-claim, not a result.'
---

## Numbers

1140 impressions against a 443 corpus median (n=47) — 2.6x. Within the security family it is the second-best post behind "Your dependency bot should be three days late" (34,287, a launch story with a universal adopt/reject audience) and clears the family's other news post, the symlink writeup, at 419. Only one scrape snapshot exists (`impressions_24h` was never captured), so 1140 is treated as the settled figure. 5 likes on 1140 impressions is a 0.44% like rate — below the corpus's stronger posts — and comments never scraped, so the discussion question is unanswered rather than answered false.

## What worked

The wedge held up under scrutiny: "a 10x compiler nobody's tooling can adopt yet is a benchmark win and an ecosystem stall at the same time" is a specific, falsifiable claim, and the post backs it with the concrete detail that the stable API ships in 7.1, not 7.0. The hook ("11x faster. Your linter still can't run it.") sets up exactly the tension the body resolves — no overclaim, no bait-and-switch.

## What to change

The draft's brief carried an `experience_hook` ("ships JS/TS tooling on npm"), and the body used it — "I ship JS tooling on npm, so a compiler jump that outruns its own ecosystem isn't abstract to me." The deterministic classifier still scores this post as `hasFirsthandSignal: false`, and that's the right call: it's a proximity claim, not a result. It says the author has a stake, not what happened when they touched TS7. The corpus's single largest recurring failure mode is news posts without firsthand signal (6 postmortems flag it), and this post is architecturally in that bucket even though the wedge itself scored well. A firsthand line needs a number or an outcome — "I ran our build against the 7.0 preview and the linter step failed with X" — not a claim of relevance.

## Decision: modify

Keep the ecosystem-adoption-gap wedge and the accurate hook — both are doing real work and the reach proves the angle has a room. Next time this pattern recurs (a fast-follow release with a tooling/API gap), replace the proximity line with an actual firsthand artifact: run the thing, hit the gap yourself, report the specific failure. That's the difference between this post's 2.6x and the corpus's 74x-plus repeat winners, which pair a sharp wedge with a firsthand number every time.
