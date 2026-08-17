---
name: post-retro
description: Run the 72-hour retrospective on a published draft and save the conclusion in retros/. Use when the user says "retro this post", "review how this performed", or wants to update the draft lifecycle after publishing.
---

# post-retro

Run this 72 hours after a draft is published.

## Office UI sync

This is the **analyst** stage — emit `end` once the retro file is written, per [office-emit-end](../office-emit-end.md).

## Inputs to read first

1. The published draft in `drafts/YYYY-MM-DD-<slug>.md`
2. **The matching published post under `posts/`** — this is where the metrics come from. Match by prefix, since archive slugs are longer than draft slugs:
   ```sh
   find "posts/${base:0:4}" -maxdepth 1 -name "${base:5}*.md" | head -1
   ```
3. `bun run post-patterns` — for the scrape-age cohort, the validated anti-patterns, and the family distribution
4. `wiki/audience.md` — for the subject tier
5. Any comment summary or performance notes the user provides

## Preconditions

**One metric is required: `impressions`, read from the published post's frontmatter.** Do not ask the user for it. Everything else is optional and usually absent — across the existing retros, `impressions_24h` is filled on 3 of 17, shares on 7, comments on 9, because LinkedIn's engagement counts mostly fail to scrape. Record whatever the post file carries and leave the rest `null`.

Only ask the user for a number when the post file has no `impressions` at all. Never block a retro on an engagement field.

## Comparison baseline

Compare against the **scrape-age cohort** from the `## Impressions by scrape age` section, not the pooled corpus median. Impressions freeze at first scrape, so a 72-hour number measured against a median that mixes fresh and mature posts is biased against itself. Name the cohort you used.

## Questions to answer

Every retro must answer:

1. Did the post beat its **scrape-age cohort** median? (Name the cohort and its median.)
2. What **subject tier** was it, per `wiki/audience.md`, and did it land inside that tier's observed band?
3. Was the hook accurate to the body?
4. Did comments validate the intended discussion angle, **if comment data exists**? Answer `null` when it does not — do not infer engagement from silence, since the metric usually failed to scrape.
5. Should this pattern be repeated, modified, or blocked?

### Naming the failure

Name the cause in terms of **subject tier and room size** first. Do not reach for the flags in the `## Tested and discredited` list — "news without firsthand signal", "no concrete numbers", and "announcement hook" have all been tested against the corpus and do not mark weaker posts; two of them mark *stronger* ones. Only cite a flag that appears under `## Validated anti-patterns`.

If the honest answer is "the craft was fine and the room was small," say that. It is the most common real cause in this archive and the hardest to see from inside a draft.

## Output artifact

Save one markdown file to `retros/YYYY-MM-DD-<slug>.md` with YAML frontmatter:

```yaml
---
draft_file: drafts/YYYY-MM-DD-<slug>.md
source_post: posts/YYYY/MM-DD-<archive-slug>.md
topic_family: security
source_type: news
reach_tier: t0-vendor-paper-or-self
published_url: ...
published_at: ...
impressions_72h: 190
impressions_24h: null
likes_72h: null
comments_72h: null
shares_72h: null
cohort: 2 to 7 days
cohort_median_at_run: 393
beat_median_impressions: false
beat_peer_group: false
discussion_validated: null
hook_matched_body: true
decision: modify
summary: Firsthand hook and a clean wedge, at half the cohort median. The failure was room size, not craft.
wiki_candidate: A firsthand hook cannot carry a t0 subject the audience is not already in.
wiki_pages: [audience]
wiki_ingested: false
---
```

`topic_family` is recorded for bookkeeping only. It comes from a keyword cascade that mislabels, and it carries no reach signal — never build the conclusion on it.

The body should explain the decision in a few short paragraphs and name one concrete thing to repeat, modify, or stop.

## Handing the lesson to the wiki

A retro's prose is read by people, not by code: `post-patterns` surfaces only `decision` and `summary`, at most three summaries per decision. So a lesson left in the body reaches nothing, and past the ninth retro even the summary stops surfacing.

Set three fields so the conclusion survives:

- `wiki_candidate` — the lesson as **one claim**, phrased so it could be true or false about future posts. Not a description of this post.
- `wiki_pages` — which wiki pages it bears on (`audience`, or a page that should exist and does not).
- `wiki_ingested: false` — always. `wiki-curator` flips it after absorbing the claim.

Do not edit `wiki/` yourself. Writing a claim into a page requires reconciling it against every other page and appending to `wiki/log.md`; that is `wiki-curator`'s job, and doing it from here would race the postmortem sweep, which writes several files in one run.
