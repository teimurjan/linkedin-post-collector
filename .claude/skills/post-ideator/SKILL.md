---
name: post-ideator
description: Find LinkedIn post angles from current tech news in the user's lanes (Rust, Zig, TypeScript, performance, on-device AI, devtools, RAG, agentic dev). Use when the user says "what should I post about", "pitch me ideas", "give me post angles", "find a topic", "ideate a post", or asks for fresh material without supplying a thought. Returns 3 to 5 pitches with source URLs. On selection, hands off to the post-writer skill.
---

# post-ideator

Your job is to find candidate angles for a LinkedIn post and present them as short pitches. You are not drafting yet.

## Inputs to read first

1. **Latest briefing**: `ls briefings/` and read the newest `YYYY-MM-DD.md` if present. This is the pre-aggregated HN + Lobsters + RSS pull from `topics-briefing`. Treat it as already-vetted current signal.
2. **`cv.md`** (if present): use it to filter — would the user have a real take on this? If not, skip it. Stay in their lanes.
3. **`bun run top-posts --n 5`**: see which topics already got reach for them. Don't repitch yesterday's angle.

## Search policy

Use **Exa** as the primary search tool, web search as backup or for verification.

- Tool: `mcp__exa__web_search_exa`
- Look for: HackerNews / Lobsters / GitHub releases / technical blogs / X threads from the last 7 to 14 days.
- Filter: primary sources only. Avoid generic tech-news roundups and SEO content.
- Lanes: Rust, Zig, TypeScript, performance engineering, on-device AI, developer tooling, RAG, agentic development.
- Out of bounds: frontend frameworks (beyond what's in `cv.md`), AI policy, management advice.

You don't always need Exa. If the latest briefing already contains 3+ strong angles, use it directly. Reach for Exa when:
- The briefing is stale (>3 days old).
- A pitch hinges on a specific release or controversy you need to verify.
- The user asked for "what's trending this week".

## Filtering pitches

For each candidate angle, ask:
1. Would the user have a real, earned take on this given their background?
2. Is there a concrete detail (a number, a name, a moment) that would make a post about this specific rather than generic?
3. Is this a primary source, or someone summarizing a primary source?

Drop pitches that fail any of the three.

## Output format

3 to 5 numbered pitches. Each pitch is one or two lines.

```
1. <angle in one sentence> — <source URL>
2. ...
```

Do not draft the posts. Do not propose hashtags. Do not pad with "here are some ideas" preamble.

## On user pick

When the user picks a pitch (by number, or "do #2"), invoke the **post-writer** skill with the chosen angle as the raw material. Pass enough context for the writer to ground the draft:

- The angle.
- The source URL.
- A 2 to 3 sentence summary of what the source actually says.

The post-writer skill handles voice, structure, and the hard rules. Your job ends at handoff.

## If input is ambiguous

If the user said "ideate" with no further direction, default to the lanes in `cv.md` (or all lanes if `cv.md` is missing). Do not ask a clarifying question for a default ideation run — pitches are cheap; the user picks.
