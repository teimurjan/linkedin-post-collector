# LinkedIn Post Collector

A content-generation pipeline for the owner's LinkedIn presence, built on top of a personal post archive.

The repo has two halves: an **archive** (scraped corpus of the owner's past posts) and a **pipeline** (Claude Code skills that produce new posts grounded in that archive).

## Archive — `posts/YYYY/MM-DD-<slug>.md`

One file per original post. Newest dates have the most recent posts.
Read these to answer questions about content, topics, performance.

YAML frontmatter:

```yaml
urn: urn:li:activity:...          # stable LinkedIn ID
url: https://www.linkedin.com/... # canonical post URL
posted_at: 2026-05-13T14:22:00.000Z
impressions: 1234 | null          # null = couldn't be scraped
likes: 42 | null
comments: 7 | null
shares: 3 | null
scraped_at: 2026-05-13T15:00:00.000Z
```

Body below the frontmatter is the post text plus a `## Comments` section
with threaded replies.

## Pipeline

Three pieces work together inside Claude Code:

1. **`briefings/YYYY-MM-DD.md`** — dated source briefings written by the
   `topics-briefing` skill (HN + Lobsters + RSS, merged). Typically refreshed via
   `/loop weekly /briefing`. The newest file is the current-news context.
2. **`cv.md`** (gitignored) — the owner's CV. Grounds voice and filters
   topics to lanes they actually have a take on. May be absent; skills
   degrade gracefully.
3. **Skills in `.claude/skills/`**:
   - `topics-hn`, `topics-lobsters`, `topics-rss`, `topics-briefing` — source fetchers.
   - `post-ideator` — finds 3 to 5 angles from briefing + Exa search, filters by `cv.md`, hands off.
   - `post-writer` — drafts in the owner's voice, calling `bun run top-posts` to match patterns.

The owner never publishes auto-generated drafts blind. The writer outputs
post text for review; nothing writes to LinkedIn from this repo.

## Engagement analyzer

```sh
bun run top-posts            # markdown report (default)
bun run top-posts --json     # programmatic
```

Powered by `src/analyze.ts`. Computes:

- Top N by impressions.
- Top N by engagement score (`likes + 3·comments + 5·shares`).
- Bottom 5 by impressions (anti-patterns).
- Corpus stats: median impressions, median length, opening-line word counts in the top quartile.

Posts with `null` impressions are excluded from rankings.

## Where NOT to read

- `.auth/` — browser profile + cookies. Never read, never quote. Gitignored.
- `node_modules/` — dependencies.
- `cv.md` — owner-personal, gitignored.
- `src/` — scraper + CLI implementation; only relevant if the user asks
  about the tooling itself, not the post corpus.

## Typical questions this repo can answer

- "Which of my posts got the most impressions?" → `bun run top-posts`.
- "What topics get the most engagement?" → cluster `posts/**/*.md` bodies, weight by `likes + 3·comments + 5·shares`.
- "How has my post frequency changed?" → count files per month under `posts/`.
- "What did I post about in May 2026?" → list `posts/2026/05-*.md`.
- "What should I post about this week?" → invoke the `post-ideator` skill.
- "Turn this thought into a post" → invoke the `post-writer` skill.

## Caveats

- Archive analytics are frozen at first-scrape time. The scraper only adds new posts; it never refreshes old ones.
- Posts with unparseable numbers have `null` for that field — exclude them from averages.
- Only original posts are collected. Reshares, comments, and articles are out of scope.
- `cv.md` may be missing. When it is, the writer leans entirely on corpus patterns and the ideator skips lane-filtering.
