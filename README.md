<p align="center">
  <img src="assets/banner.png" alt="The Post Office" width="100%" />
</p>

A content-generation pipeline for LinkedIn, built on top of a personal post archive.

The repo now runs a 7-step builder-reach loop:

1. Collect signals in `briefings/`
2. Score angles against a defensibility rubric
3. Save shortlisted briefs in `ideas/YYYY-MM-DD.md`
4. Draft from one approved brief or one raw user thought
5. Generate a hand-drawn image concept for the draft in `concepts/`
6. Gate the draft (text + visual) through a separate critic pass
7. Save a 72-hour retro in `retros/`

https://github.com/user-attachments/assets/f478ba31-8091-411e-b672-80c22c7735ee

## Setup

```sh
bun install
```

CloakBrowser (stealth Chromium under Playwright) downloads on first scrape (~200 MB, cached).

## Content pipeline

The pipeline runs inside Claude Code or Codex as a set of skills plus the briefing loop. `post-cycle` chains the whole sequence end to end; each skill can also be invoked on its own. Steps run in order — each consumes the previous step's output.

| # | Skill / command | What it does | Writes |
|---|---|---|---|
| 1 | `topics-briefing`<br>`/loop weekly /briefing` | Merges HackerNews, Lobsters, RSS newsletters, and an Exa fresh-news pass into one feed. Drops RSS items older than 7 days; buckets every section by recency (Today / Last 3 days / Earlier this week). | `briefings/YYYY-MM-DD.md` |
| 2 | `bun run post-patterns` | Required context report. Classifies every archived post with deterministic heuristics: top/bottom performers by `topic_family` and `source_type`, anti-patterns, top-quartile length and hook ranges, cooling families, retro conclusions, and postmortem failure modes. | `post-patterns/report.md` |
| 3 | `post-ideator` | Reads the newest briefing + patterns. Scores each angle on `heat`, `specificity`, `differentiation`, `builder_fit`, `discussion_potential`. Rejects duplicates, sequels without a new artifact, and recap-without-wedge angles. Returns 3–5 briefs; only `>= 7/10` moves on. | `ideas/YYYY-MM-DD.md` |
| 4 | `post-writer` | Drafts from one approved brief or one raw user thought, grounded in patterns + recent posts for voice. Saves rich frontmatter (`topic_family`, `source_type`, `hook_type`, `why_now`, `opinion_wedge`, status). Never touches `posts/`. | `drafts/YYYY-MM-DD-<slug>.md` |
| 5 | `post-image` | Builds a ready-to-paste image prompt in one of two hand-drawn styles (`sketch-on-white` / `hand-drawn`), with the hook overlaid as text and a tactile, content-specific metaphor. Sets the draft's `concept_path`. | `concepts/<date>-<slug>/prompt.md` |
| 6 | `post-critic` | Reads the brief, `top-posts --n 10`, patterns, the draft, and the concept prompt. Scores hook, specificity, novelty, readability, builder relevance, discussion potential, visual fit. Approves at `>= 10/14` with no zero category; rejects em dashes, quotation marks, or self-references. | verdict (gate) |
| 7 | `post-retro` | Run 72h after publishing. Update the draft with `published_url`, `published_at`, and 24h/72h metrics, then save a retro: beat overall median? beat similar `topic_family + source_type`? angle validated? repeat / modify / block. | `retros/YYYY-MM-DD-<slug>.md` |

```
/post-ideator                                          # step 3 — or "pitch me some post angles"
/post-writer "two days fighting a tokio panic that was a logging macro"   # step 4
/post-image drafts/YYYY-MM-DD-<slug>.md                # step 5
/post-critic                                           # step 6
```

Weekly is the default cadence for step 1; switch to daily if your sources move faster.

## The Post Office

A live dashboard that visualizes the pipeline as a workshop of six clerks
(`analyst`, `scout`, `ideator`, `writer`, `illustrator`, `critic`), each lighting
up as its skill runs.

```sh
bun run office          # serve the dashboard at http://localhost:4317
bun run office open     # ensure it's up and visible (cmux pane or browser)
bun run office reset    # clear the board for a new run
```

The markdown corpus is the database. Skills shell out to `office emit` to patch
`.office/state.json`; the server `fs.watch`es that file and rebroadcasts every
change over SSE, so each frame carries the whole state and a reconnecting tab
self-heals. The shared emit protocol lives in `.agents/skills/office-emit-end.md`.

You never drive it by hand: session hooks (`.claude/settings.json`,
`.codex/hooks.json`) open the board on prompt submit and reset it on stop. Emits
are best-effort and never block the real work.

```sh
bun run logo            # regenerate assets/banner.png from the dashboard header
```

The banner is rendered in headless Chromium from the same HTML, tokens, and font
as the live header, so it matches pixel-for-pixel.

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
`src/scraper/selectors.ts` need updating.

## Output layout

```
posts/YYYY/MM-DD-<slug>.md         # scraped corpus (signal)
briefings/YYYY-MM-DD.md            # current-news context for the ideator
ideas/YYYY-MM-DD.md                # shortlisted idea briefs with YAML frontmatter
drafts/YYYY-MM-DD-<slug>.md        # local working drafts, gitignored
concepts/YYYY-MM-DD-<slug>/        # image-generation prompt per draft (prompt.md)
retros/YYYY-MM-DD-<slug>.md        # post-publish conclusions
post-patterns/report.md            # last generated pattern report (static snapshot)
.office/state.json                 # live pipeline state for the dashboard (gitignored)
assets/banner.png                  # README banner, regenerated by `bun run logo`
```

Each post file has YAML frontmatter (`urn`, `url`, `posted_at`,
`impressions`, `likes`, `comments`, `shares`, `scraped_at`, and
`concept_path` when a concept was matched) followed by the post body and a
`## Comments` section with author + threaded replies. `CLAUDE.md` / `AGENTS.md`
hold the agent-facing repo guide.
