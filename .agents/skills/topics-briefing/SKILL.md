---
name: topics-briefing
description: Generate a weekly SWE+AI topic briefing (HN + Lobsters + RSS newsletters + Exa fresh news, merged and bucketed by recency) for LinkedIn post ideation. Use whenever the user asks "what should I post about", "LinkedIn topic candidates", "weekly briefing", "topic ideas this week", or wants a single markdown brief to paste into their LinkedIn Claude project. Combines all four sources in one run.
---

# topics-briefing

The headliner skill of this folder. Pulls HN, Lobsters, the RSS newsletter
list, and Exa fresh-news, and emits a single markdown briefing grouped
by source and bucketed by recency (Today / Last 3 days / Earlier this week).
Designed to be pasted directly into a LinkedIn-post Claude project as
context for the week's ideation.

The Bun CLI cannot call MCP tools, so this skill orchestrates a two-step
flow: the CLI handles HN + Lobsters + RSS, then the skill appends an Exa
section via the `mcp__exa__web_search_exa` tool.

## Workflow

1. **Run the CLI** to fetch HN, Lobsters, and RSS into the briefing file:

   ```sh
   bun src/briefing/cli/briefing.ts --limit 20 --out "briefings/$(date +%Y-%m-%d).md"
   ```

   The CLI:
   - Filters RSS to items from the last 7 days (drops everything older).
   - Buckets each section into Today (≤24h), Last 3 days (24–72h), Earlier this week (72h–7d).
   - Omits empty buckets.

2. **Call Exa** for fresh tech news:

   - Tool: `mcp__exa__web_search_exa`
   - Query: `"latest software engineering and AI news this week"`
   - `numResults`: 15
   - Drop any result older than 7 days. Bucket the rest with the same 24h/72h/7d windows.

3. **Append the Exa section** to the briefing file under `## Exa — fresh news (N)`, with `### Today (N)` / `### Last 3 days (N)` / `### Earlier this week (N)` subheaders that mirror the CLI sections. Each item:

   ```
   - [Title](url) — exa · 2026-05-19
   ```

   Use the Edit tool to append; do not rewrite the rest of the file.

## Output (markdown)

```markdown
# Topics briefing — 2026-05-19

## Hacker News (23)
### Today (8)
- [Title](url) — ★142 · 87 comments · alice · 2026-05-19
### Last 3 days (10)
- ...
### Earlier this week (5)
- ...

## Lobsters (...)
### Today (...)
- ...

## Newsletters & blogs (...)
### Today (...)
- ...

## Exa — fresh news (...)
### Today (...)
- [Title](url) — exa · 2026-05-19
```

## CLI flags

- `--limit N` — items per source for HN/Lobsters (default 20). RSS uses a small fixed per-feed cap after the time filter.
- `--out path` — write to file (otherwise stdout).
- `--json` — emit merged JSON instead of formatted markdown (skips bucketing; Exa step is not run in JSON mode).

## Cadence

- Run the briefing weekly via `/loop weekly /briefing` so each run lands at `briefings/YYYY-MM-DD.md`.
- The `post-ideator` skill reads the newest file in `briefings/` automatically.
- Older files stay in the repo as a record of what was trending when.

## When to use

Trigger phrases:
- "give me topic candidates for this week"
- "weekly briefing" / "topics briefing"
- "what should I post about on LinkedIn"
- "fetch all sources"

Per-source errors are logged to stderr but don't abort the run — you'll
get whatever sources came back successfully. If Exa fails, append a
single line under the section noting the failure and continue.

## Live office sync

This skill is the **scout** stage. Follow the shared protocol in
[office-sync](../office-sync.md) to emit it to the owner's Post Office dashboard.
