# LinkedIn Post Collector

A content-generation pipeline for the owner's LinkedIn presence, built on top of a personal post archive.

The repo has two halves: an **archive** (scraped corpus of the owner's past posts) and a **workflow** (briefings, ideas, drafts, critique, retros) that optimizes for reach with technical builders.

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
concept_path: concepts/.../prompt.md  # present when scrape matched a draft's concept
```

Body below the frontmatter is the post text plus a `## Comments` section
with threaded replies.

On scrape, each post is auto-linked to the concept (image prompt) that
illustrated it: the scraper matches the post to a same-date draft by text
similarity, copies that draft's `concept_path` onto the post, and back-links
the post into the concept's `prompt.md` (`post_url`, `post_path`). Matching
needs the local draft present (`drafts/` is gitignored), so a fresh clone
links nothing.

Each concept's prompt(s) are also rendered into an actual image via
`bun run generate-image concepts/<date>-<slug>` (OpenAI `gpt-image-2`, gated
on `OPENAI_API_KEY`), saved to `images/<date>-<slug>/` — gitignored, mirrors
`concepts/` 1:1 (`prompt.png` for a single-image concept, `slide-NN.png` per
carousel slide). Every concept is square — `post-image`, `post-carousel`, and
`post-flowchart` no longer offer a size choice, so there's no cropping or
resizing to worry about. All three call this as their last step; if the key is unset or the call fails, the prompt
file is still saved and the user pastes it into an image tool by hand.

## Workflow

Default loop:

1. Refresh `briefings/`.
2. Run `bun run post-patterns`.
3. Produce 3 to 5 scored idea briefs with `post-ideator`.
4. Save shortlisted ideas in `ideas/YYYY-MM-DD.md`.
5. Draft from one approved brief or an explicit user-supplied raw thought.
6. Gate every draft through `post-critic`.
7. After publishing, update the draft metadata and save a retro in `retros/`.

Key directories:

1. **`briefings/YYYY-MM-DD.md`** — dated source briefings written by the
   `topics-briefing` skill. Each one merges HN + Lobsters + RSS (last 7
   days only) plus an appended Exa fresh-news section, bucketed into
   Today / Last 3 days / Earlier this week. The newest file is the current-news context.
2. **`ideas/YYYY-MM-DD.md`** — the working ledger of shortlisted and approved ideas. Each entry has YAML frontmatter with `idea_id`, `source_url`, `source_title`, `briefing_date`, `topic_family`, `source_type`, `format`, `angle`, `score`, `why_now`, `opinion_wedge`, `experience_hook`, `reach_ceiling`, `reach_tier`, `wiki_rev`, `evidence_points`, `risk`, and `status`.
3. **`drafts/YYYY-MM-DD-<slug>.md`** (gitignored) — local working drafts written by `post-writer`. Backward-compatible frontmatter is still accepted, but new drafts should also include `topic_family`, `source_type`, `hook_type`, `why_now`, `opinion_wedge`, and `status`. Published drafts later add `published_url`, `published_at`, `impressions_24h`, `impressions_72h`, `likes_72h`, `comments_72h`, and `shares_72h`.
4. **`retros/YYYY-MM-DD-<slug>.md`** — one post-publish review per draft, written 72 hours after publishing. Retros answer whether the post beat median impressions, beat similar `topic_family + source_type` posts, validated the intended discussion angle, matched hook to body, and whether the pattern should be repeated, modified, or blocked. `retros/postmortems/` holds the same shape for the worst performers, marked `kind: postmortem`.
5. **`wiki/`** — the accumulated judgment layer. See `## Wiki` below.
6. **Skills in `.agents/skills/`**:
   - `topics-hn`, `topics-lobsters`, `topics-rss`, `topics-briefing` — source fetchers.
   - `post-ideator` — scores angles 0-2 on six axes (`heat`, `specificity`, `differentiation`, `builder_fit`, `reach_ceiling`, `discussion_potential`) and pitches only those clearing 8/12. `reach_ceiling` and `builder_fit` are hard gates: a `0` on either drops the candidate regardless of total. Requires `bun run post-patterns` plus `wiki/audience.md`, and rejects thin recaps, same-topic sequels without new artifacts, and recent duplicates.
   - `post-writer` — drafts from one approved idea brief or one raw thought, grounding in `tone-samples/`, `post-patterns`, and recent posts.
   - `post-critic` — a separate gate scoring 0-2 across seven categories (hook strength, specificity, novelty, readability, builder relevance, discussion potential, visual concept fit). Approves only at `>= 10/14` with no zero-scored category. Four hard-zero rules can force a category to `0` on their own.
   - `post-retro` — saves the 72-hour review. Requires only `impressions`, read from the published post; every engagement field is optional because they mostly fail to scrape. Compares against the scrape-age cohort, not the pooled median, and emits the lesson as a `wiki_candidate` claim.
   - `posts-postmortem` — the same analysis for the bottom performers, so the writer and critic learn from misses.
   - `wiki-curator` — owns `wiki/`. Absorbs `wiki_candidate` lessons into pages (`ingest`), answers questions against the wiki and files good answers back as new pages (`query`), and health-checks it (`lint`). Nothing else writes to `wiki/`.

### Housekeeping

```sh
bun run cleanup              # prune cycle working files, keep the last 3 days
bun run cleanup --dry-run    # print the plan, delete nothing
bun run cleanup --days 7     # widen the retention window
```

Prunes dated entries in `ideas/`, `drafts/`, and `images/` only. `briefings/`,
`posts/`, `concepts/`, `retros/`, and `wiki/` are durable and never touched, and
a draft whose published post has no retro yet is held back so the retro sweep in
step 1.6 of `post-cycle` can still read it.

## Analytics

```sh
bun run top-posts            # markdown report (default)
bun run post-patterns        # classification and anti-pattern report
bun run top-posts --json     # programmatic
bun run wiki lint            # check every wiki page against the corpus
bun run wiki index           # regenerate the wiki/index.md catalog
```

`top-posts` is the simple scoreboard. `post-patterns` is the working-context report and adds:

- deterministic classification of each post into `topic_family`, `source_type`, `hook_type`, `contains_numbers`, `has_firsthand_signal`, and `ending_type`
- full-corpus per-family distribution (`n`, median, p25, p75, range)
- grouped top and bottom performers, each bucket carrying its sample size
- impressions grouped by scrape-age cohort
- top-quartile median length and hook-length range
- repeated anti-patterns from the bottom quartile
- retro and postmortem conclusions when `retros/` exists

### Reading the numbers honestly

- **Respect the `too few to cite` marker.** The top and bottom bucket sections cover only the quartiles, so a family there can be `n=2`. A 2-post median is an anecdote.
- **Cite a fault only from `## Validated anti-patterns`.** Each candidate flag is tested against the whole corpus and only counts when flagged posts median below 0.7x the unflagged ones on at least 4 posts. The `## Tested and discredited` list is the flags that failed that test, kept visible so they are not reintroduced — "news posts without firsthand signal" marks the two biggest posts in the archive, and "no concrete numbers" and "announcement hooks" mark *stronger* posts. Counting traits inside the bottom quartile cannot distinguish these, which is why it no longer does.
- **`topic_family` is bookkeeping, not signal.** `detectTopicFamily` is a first-match-wins keyword cascade over the whole body, so `TypeScript 7 is 11x faster` is filed as `security` because the body mentions npm once, and `other` is the residue bucket rather than a family. Never derive a reach judgment from a family label. Use `wiki/audience.md`.
- **Engagement rankings are unreliable.** Impressions are present on every post, but likes on 30/50, comments on 17/50, shares on 7/50, and missing values count as zero. The `likes + 3·comments + 5·shares` leaderboard partly ranks which posts scraped cleanly. Prefer impressions.
- **Compare a fresh post against its own cohort.** Impressions are frozen at first scrape and never refreshed, and scrape age varies widely, so the pooled median mixes 72-hour numbers with mature ones.

## Wiki

`wiki/` is the accumulated judgment layer, written by the model and read by the skills.
**The CLI owns counts, the wiki owns causes.** `post-patterns` recomputes arithmetic from
`posts/` on every run and is never stale; the wiki holds the conclusions those counts
support, each page carrying the corpus fingerprint it was written against
(`posts_covered`, `corpus_median_at_revision`, `last_revised`) so drift is detectable.

Rules that hold across every page:

- Evidence is cited as explicit post paths, never as a family query. That makes each claim recomputable and immune to the classifier.
- `confidence` is bounded by `evidence_n`: `high` needs 8+, `medium` 4+, `low` 2+, a single post is `anecdote`. Never cite an `anecdote`.
- Every numeric claim in a page body needs a frontmatter twin, so it can be rechecked rather than trusted.
- `wiki/log.md` is append-only, one entry per change, each stating what it contradicted.

- Pages cross-link with `[[slug]]` wikilinks. A page nothing links to is flagged — the connections carry as much of the knowledge as the pages.
- **Only `wiki-curator` writes to `wiki/`.** `post-retro` and `posts-postmortem` emit a `wiki_candidate` claim with `wiki_ingested: false`; the curator absorbs them one at a time. Writing from the retro skills directly would race the postmortem sweep, which produces several files per run.

`bun run wiki lint` enforces all of this and exits non-zero on any error. Run it after
touching anything under `wiki/`. Beyond the schema checks it reports unabsorbed retro
lessons and lessons routed at pages that do not exist yet — both are prompts to run the
curator. Current pages: `audience.md` (the standing-audience tier model that grounds
`reach_ceiling`), plus `index.md` and `log.md`.

## Where NOT to read

- `.auth/` — browser profile + cookies. Never read, never quote. Gitignored.
- `node_modules/` — dependencies.
- `src/` — scraper + CLI implementation; only relevant if the user asks
  about the tooling itself, not the post corpus.

## Typical questions this repo can answer

- "Which of my posts got the most impressions?" → `bun run top-posts`.
- "What topics get the most engagement?" → rank by impressions; the engagement formula is unusable at current metric coverage (see Analytics). For *why* something reached, read `wiki/audience.md`.
- "How has my post frequency changed?" → count files per month under `posts/`.
- "What did I post about in May 2026?" → list `posts/2026/05-*.md`.
- "What should I post about this week?" → run `bun run post-patterns`, then invoke `post-ideator`.
- "Turn this thought into a post" → invoke `post-writer`.
- "Should this draft be published?" → invoke `post-critic`.
- "What patterns should I stop repeating?" → run `bun run post-patterns`.

## Caveats

- Archive analytics are frozen at first-scrape time. The scraper only adds new posts; it never refreshes old ones, so posts scraped at different ages carry numbers from different points on the growth curve.
- Posts with unparseable numbers have `null` for that field — exclude them from averages. Every post currently has impressions; the real gaps are `likes` (30/50), `comments` (17/50), and `shares` (7/50).
- Only original posts are collected. Reshares, comments, and articles are out of scope.
- There is no `cv.md` in this project. Do not invent personal experience for the owner.
- `posts/` is immutable scrape output. Draft lifecycle data belongs in `ideas/`, `drafts/`, and `retros/`; durable conclusions belong in `wiki/`.
- `drafts/` and `ideas/` are gitignored working files; `wiki/`, `retros/`, `posts/`, `briefings/`, and `concepts/` are tracked.
