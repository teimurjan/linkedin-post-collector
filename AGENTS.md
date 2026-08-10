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
2. **`ideas/YYYY-MM-DD.md`** — the working ledger of shortlisted and approved ideas. Each entry has YAML frontmatter with `idea_id`, `source_url`, `source_title`, `briefing_date`, `topic_family`, `source_type`, `angle`, `score`, `why_now`, `opinion_wedge`, `evidence_points`, `risk`, and `status`.
3. **`drafts/YYYY-MM-DD-<slug>.md`** (gitignored) — local working drafts written by `post-writer`. Backward-compatible frontmatter is still accepted, but new drafts should also include `topic_family`, `source_type`, `hook_type`, `why_now`, `opinion_wedge`, and `status`. Published drafts later add `published_url`, `published_at`, `impressions_24h`, `impressions_72h`, `likes_72h`, `comments_72h`, and `shares_72h`.
4. **`retros/YYYY-MM-DD-<slug>.md`** — one post-publish review per draft, written 72 hours after publishing. Retros answer whether the post beat median impressions, beat similar `topic_family + source_type` posts, validated the intended discussion angle, matched hook to body, and whether the pattern should be repeated, modified, or blocked.
5. **Skills in `.agents/skills/`**:
   - `topics-hn`, `topics-lobsters`, `topics-rss`, `topics-briefing` — source fetchers.
   - `post-ideator` — scores angles on heat, specificity, differentiation, builder fit, and discussion potential. Requires `bun run post-patterns` context and rejects thin recaps, same-topic sequels without new artifacts, and recent duplicates.
   - `post-writer` — drafts from one approved idea brief or one raw thought, grounding in `post-patterns` plus recent posts.
   - `post-critic` — a separate gate that approves only drafts scoring at least 8/10 with no zero-scored category.
   - `post-retro` — saves the 72-hour review and feeds those conclusions back into later pattern analysis.

## Analytics

```sh
bun run top-posts            # markdown report (default)
bun run post-patterns        # classification and anti-pattern report
bun run top-posts --json     # programmatic
```

`top-posts` is the simple scoreboard. `post-patterns` is the working-context report and adds:

- deterministic classification of each post into `topic_family`, `source_type`, `hook_type`, `contains_numbers`, `has_firsthand_signal`, and `ending_type`
- grouped top and bottom performers
- top-quartile median length and hook-length range
- repeated anti-patterns from the bottom quartile
- retro conclusions when `retros/` exists

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
- "What should I post about this week?" → run `bun run post-patterns`, then invoke `post-ideator`.
- "Turn this thought into a post" → invoke `post-writer`.
- "Should this draft be published?" → invoke `post-critic`.
- "What patterns should I stop repeating?" → run `bun run post-patterns`.

## Caveats

- Archive analytics are frozen at first-scrape time. The scraper only adds new posts; it never refreshes old ones.
- Posts with unparseable numbers have `null` for that field — exclude them from averages.
- Only original posts are collected. Reshares, comments, and articles are out of scope.
- There is no `cv.md` in this project. Do not invent personal experience for the owner.
- `posts/` is immutable scrape output. Draft lifecycle data belongs in `ideas/`, `drafts/`, and `retros/`.
