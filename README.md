# linkedin-post-collector

Scrapes your own LinkedIn original posts (with analytics + comments) into markdown for use with Claude Projects.

## Setup

```sh
bun install
```

Uses [CloakBrowser](https://github.com/CloakHQ/CloakBrowser) (stealth Chromium) under Playwright. First run downloads the binary (~200 MB, cached).

## Usage

```sh
bun run scrape
```

A browser window opens. On first run, sign in manually — cookies persist in `.auth/` for subsequent runs.

**How it works:**
1. Pass 1 — scrolls your Posts tab and collects new URNs (stops on first already-saved post or when posts get older than 3 years).
2. Pass 2 — opens up to 5 tabs in parallel, expands each post fully (body + comments + replies), writes `posts/YYYY/MM-DD-<slug>.md`.

Failed fetches are saved as `posts/YYYY/MM-DD-failed-<id>.md` and retried automatically on the next run.

## Output

```
posts/YYYY/MM-DD-<slug>.md
```

Each file has YAML frontmatter (`urn`, `url`, `posted_at`, `impressions`, `likes`, `comments`, `shares`, `scraped_at`) followed by the post body and a `## Comments` section with author + threaded replies. See `CLAUDE.md` for the corpus guide Claude Projects reads.

## Debugging selectors

```sh
bun run dump urn:li:activity:<id>
```

Saves the post's full HTML, the card subtree, and a screenshot to `debug/`. Use when LinkedIn ships a DOM change and selectors in `src/selectors.ts` need updating.
