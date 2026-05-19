# linkedin-post-collector

A content-generation pipeline for LinkedIn, built on top of a personal post archive.

Two halves:

1. **Archive** — a scraper pulls the owner's LinkedIn original posts (body, comments, analytics) into `posts/YYYY/MM-DD-<slug>.md`. The corpus is the training signal for "what works, what doesn't".
2. **Pipeline** — Claude Code skills find current-news angles, match the owner's voice from the archive, and produce drafts grounded in their CV.

## Setup

```sh
bun install
cp cv.md.example cv.md   # fill in your background; gitignored
```

CloakBrowser (stealth Chromium under Playwright) downloads on first scrape (~200 MB, cached).

## Content pipeline

The pipeline runs entirely inside Claude Code via two skills plus a daily briefing loop.

### 1. Keep the briefing fresh

```
/loop weekly /briefing
```

This invokes the `topics-briefing` skill on a schedule. Each run writes
`briefings/YYYY-MM-DD.md` — a merged feed of HackerNews, Lobsters, and the
configured RSS newsletters. Older briefings stay in the repo so the
`post-ideator` skill always has recent context to draw from.

Run weekly is the default; switch to daily if your sources move faster.

### 2. Ask for ideas

```
/post-ideator    # or just: "pitch me some post angles"
```

The `post-ideator` skill:

- Reads the newest `briefings/*.md`.
- Reads `cv.md` (if present) to filter angles to your lanes.
- Runs `bun run top-posts --n 5` to avoid repitching topics that already landed.
- Calls Exa search (`mcp__exa__web_search_exa`) for last-7-day signals when
  the briefing alone isn't enough.
- Returns 3 to 5 short pitches with source URLs. No drafts.

Pick a pitch by number. The skill hands the choice to `post-writer`.

### 3. Draft from a thought

```
/post-writer "spent two days fighting a tokio panic that turned out to be a logging macro"
```

The `post-writer` skill:

- Runs `bun run top-posts` and matches the openings, length, and rhythm of
  your top posts.
- Reads `cv.md` for grounding (no invented experience).
- Drafts following hard rules: no emojis, no em dashes, no LinkedIn vocab,
  no fake vulnerability, no listicle openers, no rhetorical-question hooks.
- Outputs post text only.

You can also hand it a raw thought directly without going through `post-ideator`.

### CV grounding

`cv.md` is gitignored. Both skills read it when present, and degrade
gracefully when it's not. Copy `cv.md.example` and fill in:

- Experience that gives you a credible take.
- Stack you actually use.
- Areas you have a real opinion on.
- Past topics that landed (use `bun run top-posts` to find them).

## Engagement analyzer

```sh
bun run top-posts            # markdown report
bun run top-posts --n 20     # bigger N
bun run top-posts --json     # programmatic
```

Reports top 10 by impressions, top 10 by engagement
(`likes + 3·comments + 5·shares`), the 5 worst, and corpus stats (median
impressions, median length, opening-line word counts in the top quartile).

The `post-writer` skill runs this automatically.

## Scraper

```sh
bun run scrape
```

A browser window opens. On first run, sign in manually — cookies persist
in `.auth/` for subsequent runs.

How it works:

1. Pass 1 scrolls your Posts tab and collects new URNs (stops on the first
   already-saved post or when posts get older than 3 years).
2. Pass 2 opens up to 5 tabs in parallel, expands each post fully (body +
   comments + replies), writes `posts/YYYY/MM-DD-<slug>.md`.

Failed fetches are saved as `posts/YYYY/MM-DD-failed-<id>.md` and retried
automatically on the next run.

### Debugging selectors

```sh
bun run dump urn:li:activity:<id>
```

Saves the post's full HTML, the card subtree, and a screenshot to
`debug/`. Use when LinkedIn ships a DOM change and selectors in
`src/selectors.ts` need updating.

## Output layout

```
posts/YYYY/MM-DD-<slug>.md   # scraped corpus (signal)
briefings/YYYY-MM-DD.md      # current-news context for the ideator
cv.md                        # background, gitignored
```

Each post file has YAML frontmatter (`urn`, `url`, `posted_at`,
`impressions`, `likes`, `comments`, `shares`, `scraped_at`) followed by
the post body and a `## Comments` section with author + threaded replies.
See `CLAUDE.md` for the corpus guide that Claude Projects reads.
