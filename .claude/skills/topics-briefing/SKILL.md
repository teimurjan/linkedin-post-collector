---
name: topics-briefing
description: Generate a weekly SWE+AI topic briefing (HN + Lobsters + RSS newsletters merged) for LinkedIn post ideation. Use whenever the user asks "what should I post about", "LinkedIn topic candidates", "weekly briefing", "topic ideas this week", or wants a single markdown brief to paste into their LinkedIn Claude project. Combines all three sources in one run.
---

# topics-briefing

The headliner skill of this folder. Runs HN, Lobsters, and the RSS
newsletter list in parallel and emits a single markdown briefing grouped
by source. Designed to be pasted directly into a LinkedIn-post Claude
project as context for the week's ideation.

## Run

```sh
# Stdout (default)
bun src/cli/briefing.ts --limit 20

# Archive a dated briefing the post-ideator skill can read later
bun src/cli/briefing.ts --limit 20 --out "briefings/$(date +%Y-%m-%d).md"

# Raw JSON instead of markdown
bun src/cli/briefing.ts --limit 20 --json --out "briefings/$(date +%Y-%m-%d).json"
```

- `--limit N` — items per source (default 20). RSS uses `max(3, N/5)` per feed.
- `--out path` — write to file (otherwise stdout).
- `--json` — emit merged JSON instead of formatted markdown.

## Output (markdown)

```markdown
# Topics briefing — 2026-05-18

## Hacker News (20)
- [Title](url) — ★142 · 87 comments · username · 2026-05-18
- ...

## Lobsters (20)
- [Title](url) — ★42 · 17 comments · alice · 2026-05-18
- ...

## Newsletters & blogs (50)
- [Issue title](url) — JavaScript Weekly · 2026-05-15
- ...
```

## Workflow

1. Run the briefing weekly via `/loop weekly /briefing` so each run lands at `briefings/YYYY-MM-DD.md`.
2. The `post-ideator` skill reads the newest file in `briefings/` automatically.
3. Older files stay in the repo as a record of what was trending when.

## When to use

Trigger phrases:
- "give me topic candidates for this week"
- "weekly briefing" / "topics briefing"
- "what should I post about on LinkedIn"
- "fetch all sources"

Per-source errors are logged to stderr but don't abort the run — you'll
get whatever sources came back successfully.
