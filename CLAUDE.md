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
   `topics-briefing` skill. Each one merges HN + Lobsters + RSS (last 7
   days only) plus an appended Exa fresh-news section, bucketed into
   Today / Last 3 days / Earlier this week. Typically refreshed via
   `/loop weekly /briefing`. The newest file is the current-news context.
2. **`drafts/YYYY-MM-DD-<slug>.md`** (gitignored) — local working drafts
   written by `post-writer`. Each starts with YAML frontmatter
   (`source_url`, `source_title`, `pitch_angle`, `briefing_date`,
   `drafted_at`); the next ideation run reads the last 30 days of these
   to dedup against angles already in progress.
3. **Skills in `.claude/skills/`**:
   - `topics-hn`, `topics-lobsters`, `topics-rss`, `topics-briefing` — source fetchers.
   - `post-ideator` — picks 3 to 5 angles from the briefing by popularity
     (HN/Lobsters scores, primary-source weight, recency), dedups against
     recent drafts and posts. No CV, no lane filter.
   - `post-writer` — drafts in the owner's voice, calling `bun run top-posts`
     to match patterns and skimming recent `posts/` for tone.

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
- There is no `cv.md` in this project. The ideator picks by popularity, and the writer grounds in the post corpus only — don't invent personal experience for the owner.
