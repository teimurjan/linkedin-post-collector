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

The standing-audience model lives in `wiki/audience.md`: three tiers keyed on **subject
recognizability**, each with its observed impression band and its exemplar posts. Read that
page rather than reasoning about reach from intuition. Do not restate its contents here — it
gets revised as posts accumulate, and a copy in this file would go stale silently.

If `wiki/` is absent (fresh clone), fall back to the top and bottom bucket sections of
`bun run post-patterns` and say so explicitly in your output, so the user knows the reach
scores are ungrounded that run.

## Inputs to read first

1. **Latest briefing** (required): `ls briefings/*.md | sort | tail -1` and read it. This is the canonical signal for this week.
2. **`bun run post-patterns`** (required): the mechanical ground truth over the archive — medians, sample sizes, anti-patterns, cooling streaks. Two cautions when reading it. The top/bottom bucket sections cover only the quartiles, so a family there can show `n=2`; every bucket now prints its sample size and marks thin ones `too few to cite`. Respect that marker. And `topic_family` labels come from a keyword cascade that mislabels, so treat the family axis as bookkeeping, not signal.
2.5. **`wiki/audience.md`** (required when `wiki/` exists): the accumulated judgment layer. `post-patterns` gives you counts; the wiki gives you the conclusions those counts support, each carrying its own `confidence` and `evidence_n`. Never cite a claim whose `confidence` is `anecdote`.
3. **Drafts dedup** (required): list files in `drafts/` whose `<YYYY-MM-DD>` prefix is within the last 30 days, then read each one's YAML frontmatter. Collect every `source_url` and `pitch_angle`. Drop any briefing item whose URL matches, or whose angle overlaps semantically with a recent draft.
4. **Recent published posts** (dedup): `ls posts/$(date +%Y)/*.md | sort | tail -10` and skim titles plus opening lines. Reject near-duplicates of any published post from the last 7 days.
5. **`bun run top-posts --n 10`**: this is the quick scoreboard for what already earned reach.

There is **no `cv.md`** in this project. Do not look for one. Do not apply lane filters tied to the user's background.

## The owner's real experience

The published corpus is the only record of what the owner has genuinely done. Read it to learn their real domains (what they have built, shipped, measured, or used firsthand). Build experience-led angles only on that ground truth, and never invent a first-hand story. For each candidate, name the owner's honest entry point in an `experience_hook`. If a hot topic has no genuine personal angle, it can still be a strong post when it carries a sharp differentiated wedge (see the Reach model) — name the wedge in `opinion_wedge` and set `experience_hook` to "none — wedge-driven news take". Only cooling/saturated families require a firsthand artifact (see the Cooldown rule). Inventing experience is never allowed.

## External-value gate (pre-filter, runs before scoring)

Before scoring any candidate, ask one question: **would a builder who has never heard of the owner, and does not care about the owner's LinkedIn metrics, find this useful or interesting?**

Reject outright — do not score, do not shortlist — any idea whose primary subject is the owner's own content machine: posting performance, the posting/critic/ideator pipeline, a posting losing or winning streak, follower counts, or any "here's how I run my LinkedIn" meta. This is navel-gazing. It reads as firsthand and scores well on discussion potential, but the audience is technical builders, not the owner's content ops. Three of the twelve `t0` posts in `wiki/audience.md` are exactly this shape, including the owner's posting-streak post at 181 impressions.

`source_type: build_log` is valid **only** when the build is a real technical product or tool other builders could use, run, or learn from (BlazeDiff, Avatune, GEPA-on-Qwen, a benchmark, a migration). A build log about the post pipeline itself fails this gate.

## Scoring rubric

Score each candidate angle from `0` to `2` on every axis:

- `heat`: active attention now
- `specificity`: concrete number, name, or event
- `differentiation`: non-obvious angle, not a recap
- `builder_fit`: relevant to a stranger builder (senior engineer or tooling builder) who does not know the owner — measures *quality* of fit, not size of audience
- `reach_ceiling`: how large is the crowd *already standing around this topic*, independent of how good the wedge is. This is not "would one builder care" (that's `builder_fit`) — it is "how many are watching before the post exists." **Do not score this from intuition.** Look the subject up in `wiki/audience.md`, name the matching `tiers[].id`, name the single exemplar the candidate most resembles, and take that tier's `score`. Put the tier id and the exemplar in the brief's `reach_ceiling` line so the reasoning is auditable.
  - If you think the page assigns the wrong tier for this subject, score it your way **and** record the disagreement in the `reach_ceiling` line as `disputed: <page tier> -> <your tier>, because <reason>`. Never silently override a tier. Disputes get resolved against the post's actual number at retro time, which is how the tier model gets calibrated instead of just getting longer.
- `discussion_potential`: likely to trigger real replies, not passive agreement

Only pitch items scoring `>= 8/12`, with these gates:

- **`reach_ceiling` is a gate.** If `reach_ceiling` is `0`, drop the candidate regardless of the total. A sharp wedge cannot rescue a small room. Every `t0` post in the archive landed between 76 and 236 impressions, several of them with clean craft and a real argument. **`topic_family` carries no reach signal** — never adjust `reach_ceiling` on family grounds. `other` in particular is the classifier's residue bucket, not a family, and it contains two of the archive's top six posts.
- **`builder_fit` is a gate.** If `builder_fit` is `0` or `1`, drop the candidate regardless of the total. A high total carried by `heat` and `discussion_potential` on a topic a stranger builder doesn't care about is the trap that shipped the worst posts in the archive — a company milestone announcement (76) and the owner's own posting-streak post (181).
- **Discussion bait doesn't count.** `discussion_potential` earned by personal vulnerability, confession, or meta-drama ("I failed N times", "here's what's wrong with my process") scores `0` on that axis. Count only discussion that comes from an arguable *technical* stake.

Carry the computed total (out of 12) through to the output — print it in the numbered brief and store it in the idea's frontmatter as `score: <n>`. Downstream tools (`post-cycle`'s interactive pick) read it rather than recomputing it.

Use the briefing for heat:

- **HN items**: prefer high `★score` and high `comments`.
- **Lobsters items**: use lower thresholds, but same logic.
- **Newsletters and blogs**: prefer primary sources over digest-style summaries.
- **Exa fresh news**: treat as a freshness tiebreaker, not the whole case.

## Format: text, carousel, or decision-tree

Most ideas are single-narrative **text** posts. Two other formats fit specific angle shapes:

- **`carousel`** — a multi-slide side-by-side comparison of 3 to 6 concrete, namable tools/options (notebook apps, runtimes, frameworks, hosting providers) where the comparison itself *is* the wedge, not a prose argument. Mark `format: carousel` only when it compares 3 to 6 specific options a reader chooses between and the payload is the per-option pros/cons, not a single linear claim.
- **`decision-tree`** — a single flowchart that routes the reader to a recommendation by their constraints ("which X should you use", "when to reach for Y vs Z"). Mark `format: decision-tree` only when the angle is genuinely a *decision* with 3 to 5 distinct branches keyed on real conditions (team size, latency budget, data ownership, scale), and the routing logic is the wedge.

Both still clear both gates: a comparison or decision earns `reach_ceiling` only when the options have a real standing audience, and `builder_fit` only when a stranger builder is actually making that choice.

Default to `format: text`. A carousel or decision-tree is a presentation choice, never a way to rescue a thin angle — score it on the same rubric and gates as any other idea.

## Hard rejection rules

- Reject near-duplicates of any draft from the last 30 days.
- Reject near-duplicates of any published post from the last 7 days.
- Reject same-topic sequel posts unless there is a new artifact: experiment, code, dataset, benchmark, or strong prediction.
- Reject pure news recap angles with no opinion wedge — a flat summary that adds nothing.
- A third-party news / paper / opinion item **with** a sharp differentiated wedge is a valid, strong angle even without a firsthand entry point. Every `t2` exemplar in `wiki/audience.md` won this way. Do not reject these. What underperformed was not "news without firsthand" — it was news about a `t0` subject: one vendor's product, one paper, one benchmark result. The fix is a bigger room, not a mandatory personal anchor. Set `experience_hook` to "none — wedge-driven news take" when there is no honest firsthand angle.
- **Cooldown rule.** `## Cooling families` in `bun run post-patterns` is a **trigger for review, not a gate.** The report flags a family when 3 of its last 4 posts fall below its own p25, on at least 6 posts of record — but the family classifier mislabels, so confirm the streak is about a real shared topic before acting on it. When it is real, any new idea in that family needs a firsthand artifact in `experience_hook`: the owner's own benchmark, code, migration story, measured result, or direct usage. When the streak is a classifier artifact, say so in your output and ignore it. An unreviewed streak must not block an idea.

## Recency preference

The briefing is bucketed by recency. When multiple candidates pass the rubric and the rejection rules, prefer fresher ones: **Today > Last 3 days > Earlier this week**.

## Output format

Return 3 to 5 numbered idea briefs. Each item should be compact, but include all of these fields:

```md
1.
angle: ...
score: 9/12
source_title: ...
source_url: ...
briefing_date: YYYY-MM-DD
why_now: ...
opinion_wedge: ...
experience_hook: <the owner's genuine first-hand entry point, or "none — wedge-driven news take">
reach_ceiling: <0 | 1 | 2> — <tier id from wiki/audience.md> · resembles <exemplar subject> · <one line naming the crowd already watching>. Append "disputed: <page tier> -> <your tier>, because ..." only when you disagree with the page.
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
format: text
angle: ...
score: 9
why_now: ...
opinion_wedge: ...
experience_hook: ...
reach_ceiling: 2
reach_tier: t2-universal
wiki_rev: 2026-08-17
risk: generic | rehash | too niche | thin evidence
evidence_points:
  - ...
  - ...
status: shortlisted
---
```

`reach_tier` is the tier id from `wiki/audience.md`; `wiki_rev` is that page's
`last_revised`. Together they record which version of the reach model scored this idea, so
a later retro can tell whether a miss came from the model or from the pick.

## On user pick

When the user picks a brief (by number, idea id, or "do #2"), invoke the **post-writer** skill with the chosen idea brief as the raw material. Pass enough context for the writer to preserve the brief faithfully:

- `angle`
- `source_url`
- `source_title`
- `briefing_date`
- `topic_family`
- `source_type`
- `format` (`text`, `carousel`, or `decision-tree`; omit or `text` for the prose path)
- `why_now`
- `opinion_wedge`
- `experience_hook`
- `evidence_points`

The post-writer handles voice, structure, and draft frontmatter. Your job ends at handoff.

## If input is ambiguous

If the user said "ideate" with no further direction, pick from the strongest items in the freshest bucket that still clear the defensibility bar. Do not ask a clarifying question for a default ideation run.
