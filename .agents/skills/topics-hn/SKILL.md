---
name: topics-hn
description: Fetch top stories from Hacker News (filtered to actual stories) for LinkedIn topic ideation. Use when the user wants "top HN stories", "what's on HN", "fetch Hacker News", or fresh tech signals for a post. Returns JSON entries with title, url, score, comments, author.
---

# topics-hn

Pulls the current HN top stories via the public Firebase API and returns
clean JSON suitable for LinkedIn post ideation.

## Run

```sh
bun src/briefing/cli/hn.ts --limit 30
```

`--limit` is items returned after filtering to `type === "story"` (default 30).
Only stories with `type === "story"` come back — no jobs, polls, or comments.

## Output shape

```json
[
  {
    "source": "hackernews",
    "title": "Show HN: ...",
    "url": "https://example.com/post",
    "score": 142,
    "commentCount": 87,
    "author": "username",
    "publishedAt": "2026-05-18T08:30:00.000Z",
    "body": "self-post HTML (optional)",
    "extra": {
      "hnId": 38123456,
      "permalink": "https://news.ycombinator.com/item?id=38123456"
    }
  }
]
```

## When to use

- "Give me HN top stories" / "what's hot on HN today"
- Topic mining for a LinkedIn post
- Cross-reference with Lobsters via `topics-lobsters`

For a multi-source briefing in one go, prefer `topics-briefing` instead.
