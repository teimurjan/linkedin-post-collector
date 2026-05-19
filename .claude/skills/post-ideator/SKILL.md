---
name: post-ideator
description: Find LinkedIn post angles from current tech news in the user's lanes (Rust, Zig, TypeScript, performance, on-device AI, devtools, RAG, agentic dev). Use when the user says "what should I post about", "pitch me ideas", "give me post angles", "find a topic", "ideate a post", or asks for fresh material without supplying a thought. Returns 3 to 5 pitches with source URLs. On selection, hands off to the post-writer skill.
---

# post-ideator

Your job is to find candidate angles for a LinkedIn post and present them as short pitches. You are not drafting yet.

## Inputs to read first

1. **Latest briefing** (required): `ls briefings/*.md | sort | tail -1` and read it. This is the pre-aggregated HN + Lobsters + RSS pull from `topics-briefing`. Treat it as the canonical signal for this week.
2. **Previous pitches** (dedup): `ls briefings/*-pitches.md | sort | tail -3` and read them. These are angles already pitched in the last 2 to 3 cycles. Do not repitch any source URL or near-duplicate angle.
3. **Recent posts** (dedup): `ls posts/$(date +%Y)/*.md | sort | tail -10` and skim titles + opening lines. Don't pitch an angle the user has already published.
4. **`cv.md`** (if present): use it to filter — would the user have a real take on this? If not, skip it. Stay in their lanes.
5. **`bun run top-posts --n 5`**: see which topics already got reach for them. Don't repitch yesterday's angle.

## Source policy

**Default: latest briefing only.** If the newest briefing is ≤7 days old, source pitches exclusively from it. The briefing is exhaustive (HN + Lobsters + RSS) and was curated for these lanes — using Exa on top adds noise and burns the routine's value.

Lanes (drop pitches outside these): Rust, Zig, TypeScript, performance engineering, on-device AI, developer tooling, RAG, agentic development.
Out of bounds: frontend frameworks (beyond what's in `cv.md`), AI policy, management advice.

Only reach for Exa (`mcp__exa__web_search_exa`) when:
- The newest briefing is >7 days old (stale).
- A specific pitch from the briefing needs a primary-source URL the briefing didn't link.
- The user explicitly asks to "search the web" or "look beyond the briefing".

When using Exa, look for primary sources only — HackerNews items, Lobsters threads, GitHub releases, technical blogs, X threads. Avoid SEO roundups and "top 10" content.

## Filtering pitches

For each candidate angle, ask:
1. Would the user have a real, earned take on this given their background?
2. Is there a concrete detail (a number, a name, a moment) that would make a post about this specific rather than generic?
3. Is this a primary source, or someone summarizing a primary source?
4. Is the source URL or angle already in a recent `*-pitches.md` or `posts/` entry? If yes, drop.

Drop pitches that fail any of these.

## Output format

3 to 5 numbered pitches. Each pitch is one or two lines.

```
1. <angle in one sentence> — <source URL>
2. ...
```

Do not draft the posts. Do not propose hashtags. Do not pad with "here are some ideas" preamble.

## Archive pitches for next-run dedup

After printing the pitches, also write them to `briefings/<latest-briefing-date>-pitches.md` so the next run can read and dedup against them. Format:

```markdown
# Pitches — <briefing date>

Sourced from: briefings/<briefing-file>.md

1. <angle> — <url>
2. ...
```

If the file already exists (re-run on the same briefing), overwrite it.

## On user pick

When the user picks a pitch (by number, or "do #2"), invoke the **post-writer** skill with the chosen angle as the raw material. Pass enough context for the writer to ground the draft:

- The angle.
- The source URL.
- A 2 to 3 sentence summary of what the source actually says.

The post-writer skill handles voice, structure, and the hard rules. Your job ends at handoff.

## If input is ambiguous

If the user said "ideate" with no further direction, default to the lanes in `cv.md` (or all lanes if `cv.md` is missing). Do not ask a clarifying question for a default ideation run — pitches are cheap; the user picks.
