# linkedin-post-collector

A content-generation pipeline for LinkedIn, built on top of a personal post archive.

Two halves:

1. **Archive** — a scraper pulls the owner's LinkedIn original posts (body, comments, analytics) into `posts/YYYY/MM-DD-<slug>.md`. The corpus is the training signal for "what works, what doesn't".
2. **Pipeline** — Claude Code skills find current-news angles by popularity (HN/Lobsters scores, Exa fresh news), match the owner's voice from the archive, and produce drafts.

## Setup

```sh
bun install
```

CloakBrowser (stealth Chromium under Playwright) downloads on first scrape (~200 MB, cached).

## Content pipeline

The pipeline runs entirely inside Claude Code via two skills plus a daily briefing loop.

### 1. Keep the briefing fresh

```
/loop weekly /briefing
```

This invokes the `topics-briefing` skill on a schedule. Each run writes
`briefings/YYYY-MM-DD.md` — a merged feed of HackerNews, Lobsters, the
configured RSS newsletters, and an Exa fresh-news pass. RSS items older
than 7 days are dropped, and every section is bucketed by recency:
**Today / Last 3 days / Earlier this week**. Older briefings stay in the
repo so the `post-ideator` skill always has recent context to draw from.

The skill orchestrates the run in two steps: the Bun CLI fetches HN,
Lobsters, and RSS into the briefing file, then the skill calls
`mcp__exa__web_search_exa` and appends an `## Exa — fresh news` section
with the same buckets.

Run weekly is the default; switch to daily if your sources move faster.

### 2. Ask for ideas

```
/post-ideator    # or just: "pitch me some post angles"
```

The `post-ideator` skill:

- Reads the newest `briefings/*.md` (Exa is already baked in, so the
  ideator never calls Exa itself).
- Picks by **popularity**, not personal lane: high HN/Lobsters scores, high
  comment counts, primary-source weight, fresh Exa hits.
- Reads YAML frontmatter from every `drafts/*.md` in the last 30 days to
  dedup against angles you've already drafted.
- Runs `bun run top-posts --n 5` to avoid repitching topics that already landed.
- Prefers fresher buckets (Today > Last 3 days > Earlier this week).
- Returns 3 to 5 short pitches with source URLs. No drafts.

Pick a pitch by number. The skill hands the choice to `post-writer`.

### 3. Draft from a thought

```
/post-writer "spent two days fighting a tokio panic that turned out to be a logging macro"
```

The `post-writer` skill:

- Runs `bun run top-posts` and matches the openings, length, and rhythm of
  your top posts.
- Skims recent `posts/<year>/*.md` for voice (the corpus is the only
  ground truth — there is no CV).
- Drafts following hard rules: no emojis, no em dashes, no LinkedIn vocab,
  no fake vulnerability, no listicle openers, no rhetorical-question hooks.
- Saves to `drafts/YYYY-MM-DD-<slug>.md` with YAML frontmatter recording
  `source_url`, `source_title`, `pitch_angle`, `briefing_date`, and
  `drafted_at`. The frontmatter is what the next ideation run dedups against.
- Outputs post text only (no frontmatter in stdout).

You can also hand it a raw thought directly without going through `post-ideator`.

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
posts/YYYY/MM-DD-<slug>.md      # scraped corpus (signal)
briefings/YYYY-MM-DD.md         # current-news context for the ideator
drafts/YYYY-MM-DD-<slug>.md     # local working drafts, gitignored
```

Each post file has YAML frontmatter (`urn`, `url`, `posted_at`,
`impressions`, `likes`, `comments`, `shares`, `scraped_at`) followed by
the post body and a `## Comments` section with author + threaded replies.
See `CLAUDE.md` for the corpus guide that Claude Projects reads.
