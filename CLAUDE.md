# LinkedIn Post Collector

A personal archive of the owner's LinkedIn original posts with engagement analytics, used to answer questions about what content performs well.

## Where to read

- `posts/YYYY/MM-DD-<slug>.md` — one file per original post, newest dates have the most recent posts. Read these to answer questions about content, topics, performance.
- Each post file has YAML frontmatter:
  ```yaml
  urn: urn:li:activity:...        # stable LinkedIn ID
  url: https://www.linkedin.com/... # canonical post URL
  posted_at: 2026-05-13T14:22:00.000Z
  impressions: 1234 | null         # null = couldn't be scraped
  likes: 42 | null
  comments: 7 | null
  shares: 3 | null
  scraped_at: 2026-05-13T15:00:00.000Z
  ```
  The body below the frontmatter is the post text as it appeared on LinkedIn.

## Where NOT to read

- `.auth/` — browser profile + cookies. Never read, never quote. Gitignored.
- `node_modules/` — dependencies.
- `src/` — scraper implementation; only relevant if the user asks about the tool itself, not the post corpus.

## Typical questions this corpus can answer

- "Which of my posts got the most impressions?" → sort `posts/**/*.md` by frontmatter `impressions`.
- "What topics get the most engagement?" → cluster post bodies, weight by `likes + comments * 3 + shares * 5` (or similar).
- "How has my post frequency changed?" → count files per month.
- "What did I post about in May 2026?" → list `posts/2026/05-*.md`.

## Caveats

- Analytics are frozen at first-scrape time (the scraper only adds new posts, never refreshes old ones).
- Posts where a number couldn't be parsed have `null` for that field — exclude them from averages.
- Only original posts are collected. Reshares, comments, and articles are out of scope.
