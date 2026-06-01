---
name: post-retro
description: Run the 72-hour retrospective on a published draft and save the conclusion in retros/. Use when the user says "retro this post", "review how this performed", or wants to update the draft lifecycle after publishing.
---

# post-retro

Run this 72 hours after a draft is published.

## Inputs to read first

1. The published draft in `drafts/YYYY-MM-DD-<slug>.md`
2. `bun run post-patterns`
3. Any known comment summary or performance notes the user provides

## Preconditions

The draft frontmatter should include:

- `published_url`
- `published_at`
- `impressions_24h`
- `impressions_72h`
- `likes_72h`
- `comments_72h`
- `shares_72h`

If these are missing, ask for the missing metrics or tell the user exactly which fields still need to be filled in.

## Questions to answer

Every retro must answer:

1. Did the post beat median impressions?
2. Did it outperform similar `topic_family + source_type` posts?
3. Did comments validate the intended discussion angle?
4. Was the hook accurate to the body?
5. Should this pattern be repeated, modified, or blocked?

## Output artifact

Save one markdown file to `retros/YYYY-MM-DD-<slug>.md` with YAML frontmatter:

```yaml
---
draft_file: drafts/YYYY-MM-DD-<slug>.md
topic_family: security
source_type: news
published_url: ...
published_at: ...
impressions_24h: 1200
impressions_72h: 1800
likes_72h: 45
comments_72h: 7
shares_72h: 3
beat_median_impressions: true
beat_peer_group: false
discussion_validated: true
hook_matched_body: true
decision: modify
summary: Strong reach, but the comment thread drifted away from the intended angle.
---
```

The body should explain the decision in a few short paragraphs and name one concrete thing to repeat, modify, or stop.

## Live office sync

This skill is the **analyst** stage. Follow the shared protocol in [office-sync](../office-sync.md) to emit it to the owner's Post Office dashboard.
