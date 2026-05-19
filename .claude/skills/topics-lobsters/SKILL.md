---
name: topics-lobsters
description: Fetch the Lobsters (lobste.rs) hottest list for LinkedIn topic ideation. Use when the user wants "fetch Lobsters", "lobste.rs hottest", or a curated SWE-heavy alternative to HN signals. Returns JSON entries with title, url, score, comments, tags.
---

# topics-lobsters

Pulls the current Lobsters hottest list and returns clean JSON. Lobsters
skews more SWE-focused than HN and includes useful per-story `tags`.

## Run

```sh
bun src/cli/lobsters.ts --limit 25
```

`--limit` defaults to 25 (one page). The script auto-paginates if you
ask for more.

## Output shape

```json
[
  {
    "source": "lobsters",
    "title": "Some article title",
    "url": "https://example.com/external",
    "score": 42,
    "commentCount": 17,
    "author": "alice",
    "publishedAt": "2026-05-18T12:00:00.000-07:00",
    "body": "Plain-text submitter note (optional)",
    "extra": {
      "tags": ["rust", "performance"],
      "permalink": "https://lobste.rs/s/abc123/..."
    }
  }
]
```

For self-posts the `url` falls back to the Lobsters permalink so you
always have something clickable.

## When to use

- "What's hot on Lobsters" / "fetch Lobsters topics"
- Filter by tag downstream (e.g. `rust`, `ai`, `performance`)
- For a multi-source briefing, use `topics-briefing` instead.
