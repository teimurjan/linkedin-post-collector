---
name: post-ideator
description: Find LinkedIn post angles from current tech news, picking from what's actually popular this week (high HN/Lobsters scores, comment volume, fresh Exa hits). Use when the user says "what should I post about", "pitch me ideas", "give me post angles", "find a topic", "ideate a post", or asks for fresh material without supplying a thought. Returns 3 to 5 pitches with source URLs. On selection, hands off to the post-writer skill.
---

# post-ideator

Your job is to find candidate angles for a LinkedIn post and present them as short pitches. You are not drafting yet.

The selection criterion is **popularity**, not personal fit. Pitch the items the wider tech audience is already paying attention to, even if the user has no obvious background in the topic. Strong opinions can be developed; attention is harder to earn.

## Inputs to read first

1. **Latest briefing** (required): `ls briefings/*.md | sort | tail -1` and read it. This is the pre-aggregated HN + Lobsters + RSS + Exa pull from `topics-briefing`. Treat it as the canonical signal for this week.
2. **Drafts dedup** (required): list files in `drafts/` whose `<YYYY-MM-DD>` prefix is within the last 30 days, then read each one's YAML frontmatter. Collect every `source_url` and `pitch_angle`. Drop any briefing item whose URL matches, or whose angle overlaps semantically with a recent draft.
3. **Recent published posts** (dedup): `ls posts/$(date +%Y)/*.md | sort | tail -10` and skim titles + opening lines. Don't pitch an angle the user has already published.
4. **`bun run top-posts --n 5`**: see which topics already got reach for them. Don't repitch yesterday's angle.

There is **no `cv.md`** in this project. Do not look for one. Do not apply lane filters tied to the user's background.

## Popularity signal

The briefing carries the signal you need:

- **HN items**: prefer high `★score` and high `comments` count. A 200+ score with 100+ comments is a strong popularity signal.
- **Lobsters items**: same idea, lower absolute thresholds (Lobsters is smaller). 50+ stars or 20+ comments is the equivalent.
- **Newsletters & blogs**: no score — use the feed reputation as a proxy (Pragmatic Engineer, Simon Willison, Import AI carry weight) and prefer primary-source articles over weekly digest roundups.
- **Exa fresh news**: treat as a tiebreaker for very recent items the briefing's primary sources may not have indexed yet.

## Filtering pitches

For each candidate angle, ask:

1. Is this getting real attention right now (score, comments, primary-source weight)?
2. Is there a concrete detail (a number, a name, a moment) that would make a post about this specific rather than generic?
3. Is this a primary source, or someone summarizing a primary source? Prefer primary.
4. Is the source URL or near-duplicate angle already in a draft frontmatter (last 30 days) or recent published post? If yes, drop.

Drop pitches that fail any of these.

## Recency preference

The briefing is bucketed by recency (Today / Last 3 days / Earlier this week). When multiple candidates pass the filters above, prefer fresher ones: **Today > Last 3 days > Earlier this week**. Reach into older buckets only when the fresher ones are thin or already covered by recent drafts.

LinkedIn posts age fast — a take on news from today reads as commentary, the same take three days later reads as recap.

## Output format

3 to 5 numbered pitches. Each pitch is one or two lines.

```
1. <angle in one sentence> — <source URL>
2. ...
```

Do not draft the posts. Do not propose hashtags. Do not pad with "here are some ideas" preamble. **Do not write a `*-pitches.md` file** — dedup is handled via draft frontmatter, not a separate ledger.

## On user pick

When the user picks a pitch (by number, or "do #2"), invoke the **post-writer** skill with the chosen angle as the raw material. Pass enough context for the writer to ground the draft and write valid frontmatter:

- The angle (becomes `pitch_angle`).
- The source URL (becomes `source_url`).
- The source title (becomes `source_title`).
- The briefing date the pitch came from (becomes `briefing_date`).
- A 2 to 3 sentence summary of what the source actually says.

The post-writer skill handles voice, structure, hard rules, and writes the frontmatter. Your job ends at handoff.

## If input is ambiguous

If the user said "ideate" with no further direction, just pick from the most popular items in the freshest bucket. Do not ask a clarifying question for a default ideation run — pitches are cheap; the user picks.
