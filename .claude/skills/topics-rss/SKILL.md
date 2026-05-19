---
name: topics-rss
description: Fetch the latest entries from all configured RSS/Atom newsletters and blogs (SWE + AI feeds — JavaScript Weekly, TLDR AI, Import AI, Pragmatic Engineer, Simon Willison, OpenAI Blog, etc.). Use when the user wants "newsletter signals", "what did newsletters publish this week", or curated long-form ideas for a LinkedIn post. Returns JSON.
---

# topics-rss

Fetches every feed listed in `src/config.ts` in parallel and returns the
latest entries. Feeds are tagged `"ai"` or `"swe"` — pass `--tag` to filter.

## Run

```sh
bun src/cli/rss.ts --limit 5            # 5 latest per feed, both tags
bun src/cli/rss.ts --limit 5 --tag ai   # AI feeds only
bun src/cli/rss.ts --limit 5 --tag swe  # SWE feeds only
```

`--limit` is items **per feed** (default 5).

## Output shape

```json
[
  {
    "source": "rss",
    "title": "Issue #710: Bun 1.x lands…",
    "url": "https://example.com/issue/710",
    "publishedAt": "2026-05-15T00:00:00.000Z",
    "body": "First 500 chars of stripped HTML",
    "author": "JavaScript Weekly",
    "extra": { "feed": "JavaScript Weekly", "tag": "swe" }
  }
]
```

## Notes

- Per-feed errors are swallowed (one bad feed doesn't kill the run).
- Digest-style newsletters (JavaScript Weekly, Node Weekly, …) return one
  entry per issue, not per article inside the issue. To dig into an
  issue, fetch the linked `url` separately.
- To edit which feeds get queried, change `NEWSLETTERS` in `src/config.ts`.

## When to use

- "What did newsletters drop this week?"
- "Pull AI feed signals" / "SWE feed signals"
- For a combined HN + Lobsters + RSS briefing, use `topics-briefing`.
