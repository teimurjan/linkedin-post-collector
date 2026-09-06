---
name: news-post-cycle
description: Run the news-lane LinkedIn pipeline end-to-end in one go — briefing (if missing), news-lane top-posts + patterns context, ideator shortlist (with an interactive pick that shows each idea's one-line gist, scored out of 10), a human-in-the-loop writer draft, critic verdict, and a three-variant cover image the user picks from. Use when the user says "news cycle", "run the news pipeline", "news-post-cycle", "give me a news post end to end", or wants a single command that replaces invoking topics-briefing, post-ideator, post-writer, post-critic, and post-image separately for a post about an external event. For a post about the owner's own work, use experience-post-cycle instead. Optionally accepts an idea number to skip the pick.
---

# news-post-cycle

Orchestrates the **news lane** end-to-end so the user does not run each skill by hand. You are the conductor. The underlying skills (`topics-briefing`, `posts-postmortem`, `post-retro`, `wiki-curator`, `post-ideator`, `post-writer`, `post-critic`, `post-image`, `post-carousel`, `post-flowchart`) own their logic and each runs standalone. Do not duplicate their rules. Do not skip them.

**Lanes.** Every post belongs to one of two lanes. A `news` post reacts to an external event and comes out of the briefing. An `experience` post is about the owner's own work and operation and comes straight from a thought the owner typed; that lane has its own conductor, `experience-post-cycle`. The two are analyzed separately, so every context command in this cycle is scoped with `--lane news`. If the user's request is really a thought about their own work, stop and point them at `experience-post-cycle` rather than forcing it through the briefing.

## Inputs

`args` (optional) carries two independent tokens, in any order:

- **An integer `1..5`** picking a specific idea from the freshly generated shortlist, no prompt. If absent, step 4 asks the user to pick interactively — see below.
- **A format token** — `text`, `carousel`, or `decision-tree` — the **requested format** for this run. If absent, the format is whatever the chosen idea carries (default `text`).

Examples: `/news-post-cycle carousel` (interactive pick among carousel-fit ideas), `/news-post-cycle 2` (idea 2 directly, no prompt, its own format), `/news-post-cycle 2 decision-tree` (idea 2, forced to a decision-tree, no prompt).

When a format token is present it constrains the run: the ideator is asked to surface and prioritize angles that fit that format (step 3), the pick prefers an idea already tagged with it (step 4), and the visual step routes accordingly (step 7). A requested format that cannot honestly fit any shortlisted angle is a stop condition, not something to force onto a mismatched idea.

## Human in the loop

This cycle is not autonomous. It pauses at three points and waits for the owner:

1. **The idea pick** (step 4), unless an idea number was passed.
2. **The writer's two questions** (step 5): the hook pick and the personal layer. The writer will not draft until the owner answers. Never answer them on the owner's behalf.
3. **The image pick** (step 7): three metaphor sentences, the owner chooses one; only the pick is rendered.

Everything else runs without stopping unless a step truly fails.

## Workflow

Run the steps in order. Each step produces a concrete artifact on disk.

### 1. Briefing (only if missing)

Check if today's briefing exists:

```sh
test -f "briefings/$(date +%Y-%m-%d).md" && echo present || echo missing
```

- `present`: skip to step 1.5 — do not regenerate.
- `missing`: invoke the `topics-briefing` skill. Wait for it to finish writing `briefings/$(date +%Y-%m-%d).md`.

Briefings are dated. Yesterday's file does not count as today's; only same-day matches.

### 1.5. Postmortems (only if stale)

The writer and critic need failure context, not just success context. Postmortems live in `retros/postmortems/` and are slow-changing, so they do not regenerate every cycle.

Check freshness:

```sh
test -d retros/postmortems && \
  find retros/postmortems -type f -name '*.md' -mtime -14 -print | head -1
```

- If the command prints at least one path, postmortems are fresh enough — skip.
- If the directory is empty or the newest postmortem is older than 14 days, invoke the `posts-postmortem` skill with `--lane news`. It writes one file per underperforming news post to `retros/postmortems/`.

If `posts-postmortem` fails (corpus too small, etc.), surface the warning and continue. A missing postmortem corpus is not a pipeline failure.

### 1.6. Retro sweep (pending, last 3 months only)

The 72-hour retro has no trigger of its own — a post is drafted here, but it goes live and matures *after* this cycle ends, so nothing comes back for it. Sweep for that debt at the top of every cycle: any published post old enough to have stable numbers but still missing its retro. The sweep covers drafts of **both lanes** — `post-retro` reads each draft's `lane` and compares it against the right cohort.

A post is a retro candidate when **all** hold:

1. It has a local draft in `drafts/` (post-retro reads the draft; posts without one can't be retro'd and are skipped).
2. It is published — a matching file exists under `posts/`, which is also where the 72h metrics come from.
3. Its `posted_at` is **more than 72 hours ago** (numbers have settled) **and within the last 3 months** (older posts are out of scope — do not retro them).
4. No `retros/<YYYY-MM-DD-slug>.md` exists yet.

List the candidates:

```sh
for d in drafts/*.md; do
  base=$(basename "$d" .md)                                          # YYYY-MM-DD-slug
  post=$(find "posts/${base:0:4}" -maxdepth 1 -name "${base:5}*.md" 2>/dev/null | head -1)
  [ -z "$post" ] && continue                                         # not published yet
  test -f "retros/$base.md" && continue                             # already retro'd
  posted=$(grep -m1 '^[[:space:]]*posted_at:' "$post" | sed "s/^[^:]*: *//;s/[\"']//g")
  echo "$base | posted=$posted"
done
```

Archive post slugs are often longer than the draft slug (the scraper keeps more of the first line), so match by prefix with `find` rather than an exact path — an exact match would miss every published post. The retro filename keys off the **draft** slug (`$base`), the same name `post-retro` writes, so the existence check stays consistent.

For each line printed, compare `posted` to now: skip if newer than 72h (not ready) or older than 3 months (out of scope); otherwise invoke the `post-retro` skill with that `YYYY-MM-DD-slug` as its argument. Run them one at a time. If a retro fails (missing metrics, etc.), surface the warning and continue — a stuck retro never blocks the rest of the cycle.

### 1.7. Absorb retro lessons into the wiki

A retro's conclusion reaches no downstream consumer on its own — `post-patterns` surfaces only `decision` and `summary`, capped at three summaries per decision, so lessons expire silently as retros accumulate. Anything the sweep just wrote is still unabsorbed.

```sh
grep -rl "wiki_ingested: false" retros/ 2>/dev/null | wc -l
```

If the count is above zero, invoke **wiki-curator** in `ingest` mode. It absorbs one lesson at a time, reconciles it against the existing pages, appends to `wiki/log.md`, and flips the flag. Soft failure: if it errors, surface the warning and continue — an unabsorbed lesson does not block a draft.

Skip when the count is zero.

### 2. Archive context (news lane only)

Run all three and keep their output in context for the ideator and critic:

```sh
bun run top-posts --n 10 --lane news
bun run post-patterns --lane news
bun run wiki lint
```

The `--lane news` scope matters: experience posts (the owner's own launches, build logs, founder updates) live in a different room and would drag the news medians. The report's `## Lanes` table still shows both lanes' sizes so nobody mistakes the scoped corpus for the whole archive.

If `top-posts` or `post-patterns` fails, surface the error and stop — the ideator and critic both depend on `post-patterns`.

`wiki lint` is advisory here: report any error it prints and carry on. A stale wiki page still beats no wiki page, and the ideator falls back to the pattern report when `wiki/` is missing entirely.

**Two cautions when passing this context on.** Bucket sections cover only the quartiles and print their own sample size — respect the `too few to cite` marker. And cite a fault only from `## Validated anti-patterns`; the `## Tested and discredited` list has been checked against the corpus and does not mark weaker posts.

### 3. Ideate

Invoke the `post-ideator` skill. It will:

- Read the latest briefing and `headcount-zero-positioning.md`.
- Use the news-lane `post-patterns` and `top-posts` context already gathered.
- Dedup against recent drafts and published posts.
- Emit 3 to 5 scored idea briefs, each with a one-line `gist`, and write shortlisted entries into `ideas/$(date +%Y-%m-%d).md` with `lane: news`.

If `args` carried a **format token** (`carousel` or `decision-tree`), tell the ideator to surface and prioritize angles that fit that format and tag them with it. The format never lowers the bar — a forced format still has to clear the rubric and gates. If the ideator can produce no idea that honestly fits the requested format, stop and tell the user (do not bend a mismatched angle into the wrong shape).

Do not draft yet. Wait for the ideator to finish.

### 4. Pick an idea

- If `args` has a number `N`, pick the Nth idea from the just-written `ideas/$(date +%Y-%m-%d).md` (order = order in file) — an explicit number is a direct override, skip the interactive pick below entirely.
- If the pick is out of range, stop and ask the user which idea to use.
- Otherwise (no number in `args`), run the interactive pick below.

**Interactive pick.** Read every shortlisted idea's `gist`, `score` (out of 12), `opinion_wedge`, `reach_ceiling`, and `risk` from `ideas/$(date +%Y-%m-%d).md`. Rank by `score` descending; if a **format token** was requested, rank ideas already tagged with that `format` first. Ask the user to choose with `AskUserQuestion`, one option per idea:

- Cap at 4 options (the tool's hard max). With 5 shortlisted ideas, offer the top 4 by the ranking above and say in the question text that a 5th exists and can be reached by typing its number into "Other".
- Option label: rank + display score, e.g. `#1 · 8/10`. Convert the ideator's `score` (out of 12) to the friendlier out-of-10 shown here: `round(score * 10 / 12)`.
- Option description: **the `gist` first, verbatim, as its own line** — the owner has to see in one plain sentence what the post would be about before reading anything else. Then one line of **Pros:** the `opinion_wedge`, plus the `reach_ceiling` note when it's `2` (a bigger room). Then one line of **Cons:** the `risk` field, plus the `reach_ceiling` note when it's `1` (capped at a sub-community). If the requested format differs from the idea's own `format`, add one clause noting the conversion. Do not invent judgment beyond what the brief already says. Keep the whole description under ~50 words.
- Question header: `Pick idea`. Question text: `Which idea should we draft next?`

Map the answer back to its `idea_id`. If `AskUserQuestion` cannot be presented (no interactive channel available), stop and print the shortlist with gists — do not pick on the owner's behalf.

If a format was requested and the chosen idea's `format` differs, set the idea's `format` to the requested value via Edit — but only if the angle genuinely supports that shape (a real 3-to-6-option comparison for `carousel`; a real 3-to-5-branch decision for `decision-tree`). If it cannot fit, stop and tell the user the picked angle does not suit the requested format.

Mark the chosen idea's `status` in `ideas/$(date +%Y-%m-%d).md` to `approved` via Edit. Leave the others as `shortlisted`.

### 5. Draft (human in the loop)

Invoke the `post-writer` skill with the approved idea brief. Pass through every field the writer expects: `angle`, `gist`, `source_url`, `source_title`, `briefing_date`, `topic_family`, `source_type`, `lane`, `format`, `why_now`, `opinion_wedge`, `experience_hook`, `evidence_points`. The writer drafts in the brief's `format` (prose for `text`, the per-slide outline for `carousel`, the routing tree for `decision-tree`).

The writer will stop twice — once to have the owner pick a hook, once to ask for the owner's personal layer (a firsthand detail, a number from their own work, or their take in their own words). Let it. Relay the owner's answers verbatim; do not paraphrase them, and do not fill them in yourself. A draft written without the owner's own words is the exact output this pipeline stopped producing.

The writer saves to `drafts/$(date +%Y-%m-%d)-<slug>.md` with `lane: news`. Capture that path for the next step.

### 6. Critique

Invoke the `post-critic` skill with the draft path from step 5. The critic will read the idea brief, the news-lane patterns report, and the draft, then emit either an approval scorecard or a rewrite plan.

If the critic rejects, stop here. Do not generate a concept image for a draft that is not going to publish.

### 7. Visual concept (only if critic approved)

Read the approved draft's `format` and branch to the matching visual skill. Every visual is a black sketch on white; there is no style or size to pick.

- **`format: text` (or absent)** → `post-image`. It builds **three** metaphor variants and asks the owner to pick one with `AskUserQuestion`, before rendering anything. The pick is promoted to `concepts/<date>-<slug>/prompt.md` via `bun run select-variant` (which deletes the losing variants) and rendered to `images/<date>-<slug>/prompt.png` when `OPENAI_API_KEY` is set. Wait for the pick; never choose for the owner.
- **`format: carousel`** → `post-carousel`. Always square 1080×1080, one render per slide, no variants. Writes an index `concepts/<date>-<slug>/prompt.md` plus `slide-NN.md` files.
- **`format: decision-tree`** → `post-flowchart`. Always square, one render, no variants. Writes a single `concepts/<date>-<slug>/prompt.md`.

Whichever runs will update the draft frontmatter with `concept_path: concepts/<…>/prompt.md` and print the prompt(s) so the user can paste them into an image tool if generation was skipped.

If the visual skill fails to build or save the prompt itself, surface the error and stop — the draft is already saved and approved, and the user can re-run `/post-image <draft>` (text), `/post-carousel <draft>` (carousel), or `/post-flowchart <draft>` (decision-tree) manually. A missing `OPENAI_API_KEY` or a failed generation call is **not** this kind of failure — the prompts are still saved, so treat it as a soft `skipped`/`failed` note and continue to Output.

## Output

Print, in order:

1. A one-line status per step: `briefing: created | reused`, `postmortems: refreshed | fresh | skipped`, `retros: N swept | none pending`, `ideation: N briefs`, `pick: interactive | direct (arg N)`, `chosen: <idea_id> — <gist>`, `format: text | carousel | decision-tree`, `draft: <path>`, `critic: approved | rejected`, `concept: <path> | skipped`, `image: variant N picked (generated) | variant N picked (prompt only, no OPENAI_API_KEY) | N slides generated, K failed | skipped`.
2. The full draft text (so the user can read it without opening the file).
3. The critic's verdict block verbatim.
4. If the concept was generated, the visual skill's output block verbatim, including its `Image:`/`Images:` line. When generation succeeded, tell the user the PNG(s) are already sitting in `images/<date>-<slug>/`; when skipped or failed, the prompt is still there to paste manually.

If the critic rejected the draft, stop after step 3. Do not auto-revise and do not generate a concept image. The rewrite plan is the user's call.

## Failure handling

- Briefing step fails: report the failure and stop. The rest of the pipeline depends on a current briefing.
- `bun run top-posts` or `bun run post-patterns` fails: report and stop.
- Ideator returns zero passing briefs: stop and tell the user the shortlist was empty. Do not invent an angle.
- Writer fails to save the draft: stop. Do not retry without the user.
- Critic rejects: this is not a pipeline failure. Print the rewrite plan and end normally.
- The owner does not answer a question: stop and wait. Never proceed past a human-in-the-loop stop with a guessed answer.

## What this skill does not do

- It does not draft experience posts. That is `experience-post-cycle`.
- It does not publish to LinkedIn.
- It does not bypass the critic. A rejected draft stays a draft.
- It does not edit `posts/`. Those are scraped output.
- It does not pick a hook, a personal detail, or an image on the owner's behalf.

## When to use

Trigger phrases:

- "run the news cycle"
- "news-post-cycle"
- "give me a news post end to end"
- "pipeline a post from the briefing"
- "ideate, draft, and critique"

If the user already has a draft and just wants it critiqued, use `post-critic` directly. If they already picked an idea, use `post-writer` directly. If the user typed a thought about their own work, use `experience-post-cycle`. This skill is for the cold start on external news.
