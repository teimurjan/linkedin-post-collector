# linkedin-post-collector

A content-generation pipeline for LinkedIn, built on top of a personal post archive.

The repo now runs a 7-step builder-reach loop:

1. Collect signals in `briefings/`
2. Score angles against a defensibility rubric
3. Save shortlisted briefs in `ideas/YYYY-MM-DD.md`
4. Draft from one approved brief or one raw user thought
5. Generate a hand-drawn image concept for the draft in `concepts/`
6. Gate the draft (text + visual) through a separate critic pass
7. Save a 72-hour retro in `retros/`

The archive still lives under `posts/` and remains scrape-only. Draft lifecycle data belongs in `drafts/`, `ideas/`, `concepts/`, and `retros/`.

## Setup

```sh
bun install
```

CloakBrowser (stealth Chromium under Playwright) downloads on first scrape (~200 MB, cached).

## Content pipeline

The pipeline runs inside Codex via a set of skills plus the briefing loop. `post-cycle` chains the whole sequence end to end; the individual skills below can also be invoked on their own.

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

### 2. Learn the archive first

```sh
bun run post-patterns
```

This is the required context report for ideation, writing, and critique. It classifies every archived post with deterministic heuristics and reports:

- top performers grouped by `topic_family`
- top performers grouped by `source_type`
- bottom buckets and repeated anti-patterns
- top-quartile post length and hook-length ranges
- cooling families (3+ consecutive sub-median posts in a family)
- retro conclusions when `retros/` has data, plus failure modes from `posts-postmortem`

### 3. Ask for ideas

```
/post-ideator    # or just: "pitch me some post angles"
```

The `post-ideator` skill:

- Reads the newest briefing and `bun run post-patterns`.
- Scores each candidate angle on `heat`, `specificity`, `differentiation`, `builder_fit`, and `discussion_potential`.
- Rejects near-duplicates of the last 30 days of drafts, the last 7 days of published posts, same-topic sequels without a new artifact, and pure news recap angles without an opinion wedge.
- Returns 3 to 5 compact briefs, not one-line pitches.
- Saves shortlisted ideas into `ideas/YYYY-MM-DD.md` with YAML frontmatter.

Only angles scoring `>= 7/10` should move forward.

### 4. Draft from one brief

```
/post-writer "spent two days fighting a tokio panic that turned out to be a logging macro"
```

The `post-writer` skill:

- Drafts only from one approved idea brief in `ideas/YYYY-MM-DD.md` or one explicit raw thought supplied by the user.
- Reads `bun run post-patterns` and recent posts for voice calibration.
- Saves richer draft frontmatter: `topic_family`, `source_type`, `hook_type`, `why_now`, `opinion_wedge`, and lifecycle status in addition to the old fields.
- Never writes to `posts/`.

### 5. Illustrate the draft

```
/post-image drafts/YYYY-MM-DD-<slug>.md
```

The `post-image` skill builds a ready-to-paste image-generation prompt in one
of two hand-drawn sketch styles (`sketch-on-white` or `sketch-on-black`), with
the post's hook rendered into the image as overlaid text. It picks a tactile,
content-specific metaphor by reasoning over the whole draft, writes the prompt
to `concepts/<date>-<slug>/prompt.md`, and sets the draft's `concept_path`. It
emits the prompt only — you paste it into your image tool and drop the result
in the same folder.

### 6. Critique before publish

```
/post-critic
```

The `post-critic` skill reads the chosen idea brief, `bun run top-posts --n 10`, `bun run post-patterns`, the new draft, and the linked concept prompt. It scores the draft on:

- hook strength
- specificity
- novelty
- readability
- builder relevance
- discussion potential
- visual concept fit

Approval rule: total score must be `>= 10/14`, and no category may be `0`. It also rejects any draft that uses em dashes or quotation marks, or that references the owner's previous posts.

### 7. Retro after 72 hours

```
/post-retro
```

After publishing, update the draft metadata with `published_url`, `published_at`, and the 24h / 72h metrics, then save a retro under `retros/`. The retro answers whether the post beat the overall median, beat similar `topic_family + source_type` posts, validated the intended discussion angle, and whether the pattern should be repeated, modified, or blocked.

## Engagement analyzer

```sh
bun run top-posts            # markdown report
bun run top-posts --n 20     # bigger N
bun run top-posts --json     # programmatic
bun run post-patterns        # archive pattern report
```

`top-posts` reports raw winners and losers. `post-patterns` adds the deterministic classification layer used by ideation, drafting, critique, and retros.

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

On save, each post is auto-linked to the image concept that illustrated it.
The scraper matches the post to a same-date draft by text similarity, copies
that draft's `concept_path` onto the post, and back-links the post into the
concept's `prompt.md` (`post_url`, `post_path`). Matching needs the local
draft present (`drafts/` is gitignored), so a fresh clone links nothing.

### Debugging selectors

```sh
bun run dump urn:li:activity:<id>
```

Saves the post's full HTML, the card subtree, and a screenshot to
`debug/`. Use when LinkedIn ships a DOM change and selectors in
`src/selectors.ts` need updating.

## Output layout

```
posts/YYYY/MM-DD-<slug>.md         # scraped corpus (signal)
briefings/YYYY-MM-DD.md            # current-news context for the ideator
ideas/YYYY-MM-DD.md                # shortlisted idea briefs with YAML frontmatter
drafts/YYYY-MM-DD-<slug>.md        # local working drafts, gitignored
concepts/YYYY-MM-DD-<slug>/        # image-generation prompt per draft (prompt.md)
retros/YYYY-MM-DD-<slug>.md        # post-publish conclusions
post-patterns/report.md            # last generated pattern report (static snapshot)
```

Each post file has YAML frontmatter (`urn`, `url`, `posted_at`,
`impressions`, `likes`, `comments`, `shares`, `scraped_at`, and
`concept_path` when a concept was matched) followed by the post body and a
`## Comments` section with author + threaded replies. See `AGENTS.md` for the
repo guide that Codex reads.
