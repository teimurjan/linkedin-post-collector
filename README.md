<p align="center">
  <img src="assets/banner.png" alt="The Post Office" width="100%" />
</p>

A content-generation pipeline for LinkedIn, built on top of a personal post archive.

Two halves. A **loop** that turns either current news or a thought the owner typed into a
drafted, critiqued, illustrated post with the owner in the loop, and a **wiki** that
accumulates what the archive has actually taught, so the loop stops rediscovering it on
every run.

The loop runs in two **lanes**. `news` posts react to an external event and go through a
briefing and an ideator. `experience` posts are about the owner's own operation (apps,
numbers, functions built instead of hired, lessons from the sell side) and start from a
sentence the owner wrote. The lanes are analyzed separately — `--lane news|experience` on
every report — and the brand dossier, `headcount-zero-positioning.md`, defines the second
lane and the voice of both.

https://github.com/user-attachments/assets/f478ba31-8091-411e-b672-80c22c7735ee

## Setup

```sh
bun install
```

CloakBrowser (stealth Chromium under Playwright) downloads on first scrape (~200 MB, cached).

## The wiki layer

Modeled on [Karpathy's LLM wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):
instead of re-deriving conclusions from raw documents at query time, the model
incrementally builds and maintains a persistent, interlinked set of markdown pages that
sit between the sources and the consumer. Three layers:

| Layer | Contents | Who writes it |
|---|---|---|
| Raw sources | `posts/`, `briefings/`, `concepts/` | scraper and fetchers, immutable afterward |
| Derived counts | `bun run post-patterns --lane <lane>`, `bun run top-posts --lane <lane>` | recomputed every run, never stored |
| The wiki | `wiki/` | `wiki-curator` skill, nothing else |
| The dossier | `headcount-zero-positioning.md` | the owner, by hand |
| The schema | `AGENTS.md` (`CLAUDE.md` symlinks to it) | co-evolved by hand |

**The CLI owns counts, the wiki owns causes.** `post-patterns` recomputes arithmetic from
`posts/` and is never stale. `wiki/` holds the conclusions those counts support, each page
carrying the corpus fingerprint it was written against (`posts_covered`,
`corpus_median_at_revision`, `last_revised`) so drift is detectable by subtraction rather
than by memory.

Rules, all enforced by `bun run wiki lint`:

- Evidence is cited as explicit post paths, never as a query. A query-based claim inherits
  the classifier's errors and cannot be recomputed.
- `confidence` is bounded by `evidence_n`: `high` needs 8+, `medium` 4+, `low` 2+, a single
  post is `anecdote`. An `anecdote` may not be cited.
- Every number in a page body needs a frontmatter twin, or it drifts unnoticed.
- Pages cross-link with `[[slug]]`. A page nothing links to is flagged.
- Lanes stay apart: `audience` holds news-lane evidence, `experience` (created on the
  first experience-lane ingest) holds the other lane's. A page that mixes them has a
  number nobody can recompute.
- `wiki/log.md` is append-only, `## [YYYY-MM-DD] <op> | <title>`, and every entry states
  what it contradicted even when the answer is `none`.

```sh
bun run wiki lint     # check every page against the corpus, non-zero exit on error
bun run wiki index    # regenerate the catalog table in wiki/index.md
```

Lessons reach the wiki through a queue, not a direct write. `post-retro` and
`posts-postmortem` emit `wiki_candidate` with `wiki_ingested: false`; `wiki-curator`
absorbs them one at a time, reconciles each against the existing pages, and appends to the
log. Writing from the retro skills would race the postmortem sweep, which produces several
files per run.

Current pages: `audience.md` (the news-lane standing-audience tier model), plus `index.md`
and `log.md`.

## Reading the numbers honestly

Three things about this corpus that cost real posts to learn.

**An anti-pattern has to earn the name.** Counting traits inside the bottom quartile
reports any trait that shows up twice, including traits every post shares. Each candidate
flag is now tested against the whole corpus and only counts when flagged posts median
below 0.7x the unflagged ones on at least 4 posts. On 50 posts (median 439 impressions),
three of the four previously-reported anti-patterns do not survive:

```
## Validated anti-patterns
- question endings                       n=4,  median 297 vs 506 (0.59x)

## Tested and discredited
- news posts without firsthand signal    n=25, median 435 vs 569 (0.76x)
- announcement hooks that read like recaps  n=7, median 578 vs 435 (1.33x)
- posts with no concrete numbers        n=12, median 618 vs 425 (1.45x)
```

Two of them are inverted: posts carrying the "fault" do better. The discredited list stays
printed so nothing reintroduces it as a rule.

**`topic_family` is bookkeeping, not signal.** `detectTopicFamily` is a first-match-wins
keyword cascade over the whole body, so a post about the TypeScript 7 compiler is filed as
`security` because the body says "npm" once. `agents` is the largest family (n=18, median
310 against a corpus median of 439) and spans 163 to 128,280 impressions. `other` is the
residue bucket rather than a family, and holds two of the top six posts.

**The two lanes are different rooms.** After the one-time backfill, the archive splits into
38 news posts (median 664) and 18 experience posts (median 362). Every report takes
`--lane`, and the unscoped one prints a `## Lanes` table so the split is never invisible.
An experience post judged against the news median is being judged in the wrong room.

**What separates reach in the news lane is subject recognizability.** Hand-labelling the
unambiguous top and bottom 24 posts gives three non-overlapping bands, which is what
`wiki/audience.md` encodes and what grounds the ideator's `reach_ceiling` score:

| Tier | Subject | n | Median | Range |
|---|---|---|---|---|
| t2 | a named artifact every working dev knows (Rust, SQLite, TypeScript, the kernel) | 7 | 32731 | 5144 to 128280 |
| t1 | a namable sub-community, or the author's own shipped work | 5 | 2192 | 1271 to 3570 |
| t0 | one vendor's product, one paper, or the author's own metrics | 12 | 192 | 76 to 236 |

t0's ceiling sits below t1's floor, and t1's ceiling below t2's floor. The page ships at
`confidence: medium` and says why: the tiers were assigned knowing the impressions, so
clean separation on 24 post-hoc labels is a hypothesis. It earns `high` only once 8 posts
have been tier-scored before publishing and the bands still hold.

Two more caveats worth knowing before trusting any number here. Impressions freeze at
first scrape and are never refreshed, so compare a post against its scrape-age cohort
rather than the pooled median. And engagement coverage is thin (likes on 30/50 posts,
comments 17/50, shares 7/50, missing values counting as zero), which makes any
`likes + 3*comments + 5*shares` ranking partly a ranking of which posts scraped cleanly.

## Content pipeline

Runs inside Claude Code or Codex as a set of skills. Each skill runs standalone and hands
off through files; the two cycles are the only things that chain them. The pipeline is a
draft engine, not a publish engine: the writer stops for the owner's hook pick and their
own firsthand layer, and the image step stops for the owner's pick of three variants.

| # | Skill / command | What it does | Writes |
|---|---|---|---|
| 1 | `topics-briefing` | News lane. Merges HackerNews, Lobsters, RSS newsletters, and an Exa fresh-news pass into one feed. Drops RSS items older than 7 days; buckets every section by recency (Today / Last 3 days / Earlier this week). | `briefings/YYYY-MM-DD.md` |
| 2 | `bun run post-patterns --lane <lane>` | Required context report, stdout only. Lane table, full-corpus family distribution with sample sizes, impressions by scrape-age cohort, validated and discredited anti-patterns, top-quartile length and hook ranges, cooling streaks, retro and postmortem conclusions — all scoped to one lane. | nothing |
| 3 | `post-ideator` | News lane. Reads the newest briefing, the patterns report, `wiki/audience.md`, and the dossier. Scores each angle 0-2 on `heat`, `specificity`, `differentiation`, `builder_fit`, `reach_ceiling`, `discussion_potential`. Pitches only `>= 8/12`, each with a one-line plain-language `gist` the owner sees first when picking. `reach_ceiling` is looked up in the wiki, not guessed. Ends at the ledger. | `ideas/YYYY-MM-DD.md` |
| 4 | `post-writer` | Both lanes. Drafts from one approved brief (news) or one raw thought (experience), grounded in the dossier, `tone-samples/`, the lane's patterns report, and recent posts of the same lane. Stops twice for the owner: pick one of three hooks, then supply the firsthand layer in their own words. Never drafts without them. Tags experience drafts with a `pillar`; moves body links to a `Comment link:` line. | `drafts/YYYY-MM-DD-<slug>.md` |
| 5 | `post-critic` | Both lanes. Reads the lane first, then the brief (the idea for news, the draft's own frontmatter plus the dossier for experience), `top-posts` and `post-patterns` for that lane, the draft, and the concept. Scores hook, specificity, novelty, readability, builder relevance, discussion potential, visual fit. Approves at `>= 10/14` with no zero category. Five hard-zero rules; an experience post with no number is a zero on specificity. | verdict (gate) |
| 6 | `post-image` | One style, a black sketch on white. Builds three metaphor variants and the owner picks one from the metaphor sentences, before any render; `select-variant` promotes it to `prompt.md` and deletes the rest, then that one prompt is rendered via OpenAI `gpt-image-2` when `OPENAI_API_KEY` is set and shrunk with `pngquant`. `post-carousel` and `post-flowchart` cover the other two formats, same style, single render. | `concepts/<date>-<slug>/`, `images/<date>-<slug>/` |
| 7 | `post-retro` | Run 72h after publishing. Requires one metric, `impressions`, read from the scraped post; compares against the lane's scrape-age cohort and emits the lesson as one falsifiable `wiki_candidate` claim routed to the lane's page. | `retros/YYYY-MM-DD-<slug>.md` |
| 8 | `wiki-curator` | Absorbs unabsorbed `wiki_candidate` lessons into wiki pages one at a time (`ingest`), keeps the lanes on separate pages, answers questions against the wiki (`query`), and health-checks it (`lint`). | `wiki/` |

`posts-postmortem` runs the same analysis over the bottom performers of one lane, writing
`retros/postmortems/`, so the writer and critic learn from misses and not only wins.

```sh
/news-post-cycle                                       # briefing → ideator → pick → writer → critic → image
/experience-post-cycle "one paying user on Wait Professor, 14 months in"
/post-ideator                                          # step 3 on its own
/post-writer "two days fighting a tokio panic that was a logging macro"
/post-image drafts/YYYY-MM-DD-<slug>.md
/post-critic
/wiki-curator ingest                                   # step 8
```

Weekly is the default cadence for the briefing. Switch to daily if your sources move faster.

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
bun run top-posts                        # markdown report, whole archive
bun run top-posts --n 20 --lane news     # bigger N, one lane
bun run top-posts --json                 # programmatic
bun run post-patterns --lane experience  # archive pattern report, one lane
bun run post-patterns --json             # includes laneStats and postIndex, one row per post
bun run post-lane <post> <lane>          # stamp a lane on a post published without a draft
```

`top-posts` reports raw winners and losers. `post-patterns` adds the classification layer
used by ideation, drafting, critique, and retros. Both take `--lane news|experience`; the
unscoped patterns report prints a `## Lanes` table so the split stays visible. Its `--json`
output carries `postIndex` (with each post's `lane`), which is what lets `wiki lint`
recompute a page's cited statistics instead of trusting them.

## Scraper

```sh
bun run scrape
```

A browser window opens. On first run, sign in manually. Cookies persist in `.auth/` for
subsequent runs.

How it works:

1. Pass 1 scrolls your Posts tab and collects new URNs (stops on the first
   already-saved post or when posts get older than 3 years).
2. Pass 2 opens up to 5 tabs in parallel, expands each post fully (body +
   comments + replies), writes `posts/YYYY/MM-DD-<slug>.md`.

Failed fetches are saved as `posts/YYYY/MM-DD-failed-<id>.md` and retried
automatically on the next run.

On save, each post is auto-linked to the draft it was published from.
The scraper matches the post to a same-date draft by text similarity, copies
that draft's `concept_path` and `lane` onto the post, and back-links the post
into the concept's `prompt.md` (`post_url`, `post_path`). Matching needs the
local draft present (`drafts/` is gitignored), so a fresh clone links nothing;
`rescrape` keeps links already on the file when the draft has been pruned.

### Refreshing frozen metrics

```sh
bun run rescrape             # new posts + refresh the 5 most recent in place
bun run rescrape --limit 20  # go further back
```

`scrape` only appends new posts, so a post's numbers stay frozen at whatever they were on
first capture. Since scrape age varies widely across the archive, the pooled median mixes
72-hour numbers with mature ones, which is why `post-patterns` reports a per-cohort median
and why retros compare against their own cohort. `rescrape` is the direct remedy: it runs
the same two passes as `scrape` — so anything new lands too — and additionally refetches
impressions, likes, comments, shares, and threaded replies for the N most recent saved
posts. It is a superset of `scrape`; running it periodically shrinks the cohort spread the
reports have to work around. A post discovered during the run is saved once as new, never
double-scraped as a refresh target.

Selector accuracy is anchored to HTML dumps under `debug/`. When LinkedIn ships a DOM
change, update `src/scraper/selectors.ts` against a fresh dump.

## Output layout

```
posts/YYYY/MM-DD-<slug>.md         # scraped corpus, immutable
briefings/YYYY-MM-DD.md            # current-news context for the ideator
wiki/                              # accumulated judgment, written only by wiki-curator
wiki/index.md                      # catalog, table regenerated by `bun run wiki index`
wiki/log.md                        # append-only change record
wiki/audience.md                   # standing-audience tiers behind reach_ceiling
ideas/YYYY-MM-DD.md                # shortlisted idea briefs (gitignored)
drafts/YYYY-MM-DD-<slug>.md        # local working drafts (gitignored)
concepts/YYYY-MM-DD-<slug>/        # image prompts per draft: variant-N.md until the pick, then prompt.md alone
images/YYYY-MM-DD-<slug>/          # rendered PNGs, mirrors concepts/ 1:1 (gitignored)
headcount-zero-positioning.md      # the brand dossier: Headcount Zero, four pillars, voice
retros/YYYY-MM-DD-<slug>.md        # 72-hour reviews
retros/postmortems/                # same shape for the worst performers, kind: postmortem
.office/state.json                 # live pipeline state for the dashboard (gitignored)
assets/banner.png                  # README banner, regenerated by `bun run logo`
```

Tracked: `posts/`, `briefings/`, `concepts/`, `wiki/`, `retros/`, `src/`. Working files
(`drafts/`, `ideas/`, `images/`, `tone-samples/`) stay local.

Each post file has YAML frontmatter (`urn`, `url`, `posted_at`, `impressions`, `likes`,
`comments`, `shares`, `scraped_at`, `lane`, and `concept_path` when a concept was matched)
followed by the post body and a `## Comments` section with author and threaded replies.
`AGENTS.md` holds the agent-facing repo guide and the wiki conventions.
