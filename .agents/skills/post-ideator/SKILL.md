---
name: post-ideator
description: Find LinkedIn post angles that can reach technical builders right now, but only when the angle is specific, differentiated, and defensible. Use when the user says "what should I post about", "pitch me ideas", "give me post angles", "find a topic", "ideate a post", or asks for fresh material without supplying a thought. Returns 3 to 5 scored idea briefs and writes shortlisted ones into ideas/YYYY-MM-DD.md.
---

# post-ideator

Your job is to find candidate angles for a LinkedIn post and present them as compact briefs. You are not drafting yet.

The selection criterion is **popular + defensible + personal**. A hot topic alone is not enough. The post needs a concrete detail, a real opinion wedge, a reason technical builders would care, and a genuine first-hand entry point for the owner. Experience-first posts are the archive's top performers; third-party recaps with no personal angle are its worst.

## Inputs to read first

1. **Latest briefing** (required): `ls briefings/*.md | sort | tail -1` and read it. This is the canonical signal for this week.
2. **`bun run post-patterns`** (required): this is the archive learning layer. Use it to understand winners, anti-patterns, and what topic/source combinations are saturated.
3. **Drafts dedup** (required): list files in `drafts/` whose `<YYYY-MM-DD>` prefix is within the last 30 days, then read each one's YAML frontmatter. Collect every `source_url` and `pitch_angle`. Drop any briefing item whose URL matches, or whose angle overlaps semantically with a recent draft.
4. **Recent published posts** (dedup): `ls posts/$(date +%Y)/*.md | sort | tail -10` and skim titles plus opening lines. Reject near-duplicates of any published post from the last 7 days.
5. **`bun run top-posts --n 10`**: this is the quick scoreboard for what already earned reach.

There is **no `cv.md`** in this project. Do not look for one. Do not apply lane filters tied to the user's background.

## The owner's real experience

The published corpus is the only record of what the owner has genuinely done. Read it to learn their real domains (what they have built, shipped, measured, or used firsthand). Build experience-led angles only on that ground truth, and never invent a first-hand story. For each candidate, name the owner's honest entry point in an `experience_hook`. If a hot topic has no genuine personal angle, either pivot to the adjacent thing they have actually done, or keep it as a flagged, reach-capped news take and say so. Inventing experience is never allowed.

## Scoring rubric

Score each candidate angle from `0` to `2` on every axis:

- `heat`: active attention now
- `specificity`: concrete number, name, or event
- `differentiation`: non-obvious angle, not a recap
- `builder_fit`: relevant to senior engineers or tooling builders
- `discussion_potential`: likely to trigger real replies, not passive agreement

Only pitch items scoring `>= 7/10`.

Use the briefing for heat:

- **HN items**: prefer high `★score` and high `comments`.
- **Lobsters items**: use lower thresholds, but same logic.
- **Newsletters and blogs**: prefer primary sources over digest-style summaries.
- **Exa fresh news**: treat as a freshness tiebreaker, not the whole case.

## Hard rejection rules

- Reject near-duplicates of any draft from the last 30 days.
- Reject near-duplicates of any published post from the last 7 days.
- Reject same-topic sequel posts unless there is a new artifact: experiment, code, dataset, benchmark, or strong prediction.
- Reject pure news recap angles with no opinion wedge.
- Reject third-party news recaps with no genuine first-hand entry point for the owner, unless the topic is hot enough to stand as a tight low-jargon take. When you keep one on that basis, mark its `experience_hook` as `none — reach-capped news take`.

## Recency preference

The briefing is bucketed by recency. When multiple candidates pass the rubric and the rejection rules, prefer fresher ones: **Today > Last 3 days > Earlier this week**.

## Output format

Return 3 to 5 numbered idea briefs. Each item should be compact, but include all of these fields:

```md
1.
angle: ...
source_title: ...
source_url: ...
briefing_date: YYYY-MM-DD
why_now: ...
opinion_wedge: ...
experience_hook: <the owner's genuine first-hand entry point, or "none — reach-capped news take">
evidence_points:
- ...
- ...
risk: generic | rehash | too niche | thin evidence
```

Do not draft the posts. Do not propose hashtags.

After presenting the list, write the shortlisted ideas into `ideas/YYYY-MM-DD.md` with YAML frontmatter entries:

```yaml
---
idea_id: 2026-05-21-01
source_url: ...
source_title: ...
briefing_date: 2026-05-21
topic_family: security
source_type: news
angle: ...
why_now: ...
opinion_wedge: ...
experience_hook: ...
evidence_points:
  - ...
  - ...
status: shortlisted
---
```

## On user pick

When the user picks a brief (by number, idea id, or "do #2"), invoke the **post-writer** skill with the chosen idea brief as the raw material. Pass enough context for the writer to preserve the brief faithfully:

- `angle`
- `source_url`
- `source_title`
- `briefing_date`
- `topic_family`
- `source_type`
- `why_now`
- `opinion_wedge`
- `experience_hook`
- `evidence_points`

The post-writer handles voice, structure, and draft frontmatter. Your job ends at handoff.

## If input is ambiguous

If the user said "ideate" with no further direction, pick from the strongest items in the freshest bucket that still clear the defensibility bar. Do not ask a clarifying question for a default ideation run.
