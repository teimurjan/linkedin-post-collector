---
name: post-ideator
description: Find LinkedIn post angles that can reach technical builders right now, but only when the angle is specific, differentiated, and defensible. Use when the user says "what should I post about", "pitch me ideas", "give me post angles", "find a topic", "ideate a post", or asks for fresh material without supplying a thought. Returns 3 to 5 scored idea briefs and writes shortlisted ones into ideas/YYYY-MM-DD.md.
---

# post-ideator

Your job is to find candidate angles for a LinkedIn post and present them as compact briefs. You are not drafting yet.

## Office UI sync

This is the **ideator** stage — emit `end` once `ideas/<YYYY-MM-DD>.md` is written, per [office-emit-end](../office-emit-end.md).

The selection criterion is **externally relevant + sharp wedge + defensible**. A hot topic alone is not enough, and neither is a personal story alone. The post needs a concrete detail, a real opinion wedge, and a reason a builder who has never heard of the owner would care.

**Reach model.** Reach = **size of the standing audience** × a sharp differentiated wedge × a front-loaded hook × a non-saturated topic. The first term is the one most often missed. "A stranger builder *would* care if they read it" is not the same as "a crowd is already standing around this topic." A wedge multiplies the room it lands in; it cannot conjure a room. The sharpest take on a topic only a few thousand people will ever touch still lands in a near-empty room.

Every winner in the archive sits in one of three shapes, each with a built-in crowd:

1. **A hot cross-cutting moment the whole dev world is already watching** — Linus vs. AI patches (125,890): the audience was assembled before the post existed.
2. **A mainstream tool or language with a large user base** — SolidJS v2 (3570), Vercel Zero "language for agents" (2192), the TeamPCP npm supply-chain attack (876). News/observation posts with **no** firsthand reproduction; they won on a big standing audience plus a sharp take.
3. **The owner's own shipped work** — Avatune (1271), BlazeDiff-in-Rust (415), tiny-models-in-browser. Firsthand is not high-ceiling by raw audience; it earns its floor through *credibility and a built-in follower base*, which keeps a niche topic defensible. Firsthand is one way to earn the wedge — not the goal in itself.

The failed mold is the mirror image: a **niche systems/numbers curiosity with no standing crowd and no firsthand anchor** — VRAM-as-swap, the back-end-agents benchmark paper (184), Qwen 3.7 Max (200), the param-count-vs-footprint post. Each had a defensible wedge and still lost, because the room was tiny before the wedge ever landed. The archive's single worst shape (55 impressions) is the same failure taken further: a maximally firsthand post about a topic — the owner's own posting streak — that no stranger cares about *and* no crowd surrounds.

## Inputs to read first

1. **Latest briefing** (required): `ls briefings/*.md | sort | tail -1` and read it. This is the canonical signal for this week.
2. **`bun run post-patterns`** (required): this is the archive learning layer. Use it to understand winners, anti-patterns, and what topic/source combinations are saturated.
3. **Drafts dedup** (required): list files in `drafts/` whose `<YYYY-MM-DD>` prefix is within the last 30 days, then read each one's YAML frontmatter. Collect every `source_url` and `pitch_angle`. Drop any briefing item whose URL matches, or whose angle overlaps semantically with a recent draft.
4. **Recent published posts** (dedup): `ls posts/$(date +%Y)/*.md | sort | tail -10` and skim titles plus opening lines. Reject near-duplicates of any published post from the last 7 days.
5. **`bun run top-posts --n 10`**: this is the quick scoreboard for what already earned reach.

There is **no `cv.md`** in this project. Do not look for one. Do not apply lane filters tied to the user's background.

## The owner's real experience

The published corpus is the only record of what the owner has genuinely done. Read it to learn their real domains (what they have built, shipped, measured, or used firsthand). Build experience-led angles only on that ground truth, and never invent a first-hand story. For each candidate, name the owner's honest entry point in an `experience_hook`. If a hot topic has no genuine personal angle, it can still be a strong post when it carries a sharp differentiated wedge (see the Reach model) — name the wedge in `opinion_wedge` and set `experience_hook` to "none — wedge-driven news take". Only cooling/saturated families require a firsthand artifact (see the Cooldown rule). Inventing experience is never allowed.

## External-value gate (pre-filter, runs before scoring)

Before scoring any candidate, ask one question: **would a builder who has never heard of the owner, and does not care about the owner's LinkedIn metrics, find this useful or interesting?**

Reject outright — do not score, do not shortlist — any idea whose primary subject is the owner's own content machine: posting performance, the posting/critic/ideator pipeline, a posting losing or winning streak, follower counts, or any "here's how I run my LinkedIn" meta. This is navel-gazing. It reads as firsthand and scores well on discussion potential, but the audience is technical builders, not the owner's content ops. This is exactly the shape that produced the worst post in the corpus (55 impressions).

`source_type: build_log` is valid **only** when the build is a real technical product or tool other builders could use, run, or learn from (BlazeDiff, Avatune, GEPA-on-Qwen, a benchmark, a migration). A build log about the post pipeline itself fails this gate.

## Scoring rubric

Score each candidate angle from `0` to `2` on every axis:

- `heat`: active attention now
- `specificity`: concrete number, name, or event
- `differentiation`: non-obvious angle, not a recap
- `builder_fit`: relevant to a stranger builder (senior engineer or tooling builder) who does not know the owner — measures *quality* of fit, not size of audience
- `reach_ceiling`: how large is the crowd *already standing around this topic*, independent of how good the wedge is. This is not "would one builder care" (that's `builder_fit`) — it is "how many are watching before the post exists."
  - `0` = a niche systems/numbers curiosity, one-off trick, or single-paper result. The standing audience is only the few who hit this exact scenario. No mainstream tool, no cross-cutting moment, no firsthand anchor. (VRAM-as-swap, the back-end-agents benchmark, Qwen 3.7 Max, param-count-vs-footprint.)
  - `1` = a real sub-community topic (a specific popular framework or domain with an active audience), **or** a niche topic carried by a genuine firsthand artifact that supplies credibility and a built-in following.
  - `2` = a mainstream tool/language with a large user base, a hot cross-cutting moment the whole dev world is already watching, or a major release everyone is debating.
- `discussion_potential`: likely to trigger real replies, not passive agreement

Only pitch items scoring `>= 8/12`, with these gates:

- **`reach_ceiling` is a gate.** If `reach_ceiling` is `0`, drop the candidate regardless of the total. A sharp wedge cannot rescue a small room — this is exactly the trap that shipped VRAM-as-swap and the param-count post. A topic classified `topic_family: other` (fits no performing family) is a strong tell that `reach_ceiling` is `0` or `1`; justify it explicitly before scoring it higher.
- **`builder_fit` is a gate.** If `builder_fit` is `0` or `1`, drop the candidate regardless of the total. A high total carried by `heat` and `discussion_potential` on a topic a stranger builder doesn't care about is the trap that shipped the 55-impression post.
- **Discussion bait doesn't count.** `discussion_potential` earned by personal vulnerability, confession, or meta-drama ("I failed N times", "here's what's wrong with my process") scores `0` on that axis. Count only discussion that comes from an arguable *technical* stake.

Use the briefing for heat:

- **HN items**: prefer high `★score` and high `comments`.
- **Lobsters items**: use lower thresholds, but same logic.
- **Newsletters and blogs**: prefer primary sources over digest-style summaries.
- **Exa fresh news**: treat as a freshness tiebreaker, not the whole case.

## Hard rejection rules

- Reject near-duplicates of any draft from the last 30 days.
- Reject near-duplicates of any published post from the last 7 days.
- Reject same-topic sequel posts unless there is a new artifact: experiment, code, dataset, benchmark, or strong prediction.
- Reject pure news recap angles with no opinion wedge — a flat summary that adds nothing.
- A third-party news / paper / opinion item **with** a sharp differentiated wedge is a valid, strong angle even without a firsthand entry point. SolidJS, Vercel Zero, and TeamPCP all won this way. Do not reject these. What underperformed (1930-knowledge, Qwen 3.7, Antigravity, constraint-decay) was not "news without firsthand" — it was news with a *weak or buried* wedge, on topics in already-cooling families. The fix is a sharper wedge and a non-saturated topic, not a mandatory personal anchor. Firsthand becomes mandatory only when the topic is in a cooling/saturated family (see the Cooldown rule). Set `experience_hook` to "none — wedge-driven news take" when there is no honest firsthand angle.
- **Cooldown rule.** If a `topic_family` appears in `bun run post-patterns` under `## Cooling families` (three or more consecutive sub-median posts), any new idea in that family must include a firsthand artifact in `experience_hook`: the owner's own benchmark, code, migration story, measured result, or direct usage. No artifact, no pitch. This overrides heat — a topic that has just lost three times in a row is colder than the briefing thinks.

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
experience_hook: <the owner's genuine first-hand entry point, or "none — wedge-driven news take">
reach_ceiling: <0 | 1 | 2> — <one line naming the standing audience: which crowd is already watching this topic>
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
reach_ceiling: 2
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
