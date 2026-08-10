---
name: post-cycle
description: Run the full LinkedIn post pipeline end-to-end in one go — briefing (if missing), top-posts + patterns context, ideator shortlist (with an interactive pros/cons pick, scored out of 10), writer draft, critic verdict. Use when the user says "full cycle", "run the pipeline", "do the whole flow", "post-cycle", "give me a post end to end", or wants a single command that replaces invoking topics-briefing, post-ideator, post-writer, and post-critic separately. Optionally accepts an idea number to skip the pick and go straight from a freshly generated shortlist.
---

# post-cycle

Orchestrates the post pipeline end-to-end so the user does not run each skill by hand. You are the conductor. The underlying skills (`topics-briefing`, `posts-postmortem`, `post-ideator`, `post-writer`, `post-critic`, `post-image`, `post-carousel`, `post-flowchart`) own their logic. Do not duplicate their rules. Do not skip them.

## Inputs

`args` (optional) carries two independent tokens, in any order:

- **An integer `1..5`** picking a specific idea from the freshly generated shortlist, no prompt. If absent, step 4 asks the user to pick interactively — see below.
- **A format token** — `text`, `carousel`, or `decision-tree` — the **requested format** for this run. If absent, the format is whatever the chosen idea carries (default `text`).

Examples: `/post-cycle carousel` (interactive pick among carousel-fit ideas), `/post-cycle 2` (idea 2 directly, no prompt, its own format), `/post-cycle 2 decision-tree` (idea 2, forced to a decision-tree, no prompt).

When a format token is present it constrains the run: the ideator is asked to surface and prioritize angles that fit that format (step 3), the pick prefers an idea already tagged with it (step 4), and the visual step routes accordingly (step 7). A requested format that cannot honestly fit any shortlisted angle is a stop condition, not something to force onto a mismatched idea.

## Workflow

Run the steps in order. Each step produces a concrete artifact on disk. Do not stop between steps unless a step truly fails.

### 1. Briefing (only if missing)

Check if today's briefing exists:

```sh
test -f "briefings/$(date +%Y-%m-%d).md" && echo present || echo missing
```

- `present`: skip to step 2 — do not regenerate.
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
- If the directory is empty or the newest postmortem is older than 14 days, invoke the `posts-postmortem` skill. It writes one file per underperforming post to `retros/postmortems/`.

If `posts-postmortem` fails (corpus too small, etc.), surface the warning and continue. A missing postmortem corpus is not a pipeline failure.

### 1.6. Retro sweep (pending, last 3 months only)

The 72-hour retro has no trigger of its own — a post is drafted here, but it goes live and matures *after* this cycle ends, so nothing comes back for it. Sweep for that debt at the top of every cycle: any published post old enough to have stable numbers but still missing its retro.

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

### 2. Archive context

Run both scripts and keep their output in context for the ideator and critic:

```sh
bun run top-posts --n 10
bun run post-patterns
```

If either fails, surface the error and stop. The ideator and critic both depend on `post-patterns`.

### 3. Ideate

Invoke the `post-ideator` skill. It will:

- Read the latest briefing.
- Use the `post-patterns` and `top-posts` context already gathered.
- Dedup against recent drafts and published posts.
- Emit 3 to 5 scored idea briefs and write shortlisted entries into `ideas/$(date +%Y-%m-%d).md`.

If `args` carried a **format token** (`carousel` or `decision-tree`), tell the ideator to surface and prioritize angles that fit that format and tag them with it. The format never lowers the bar — a forced format still has to clear the rubric and gates. If the ideator can produce no idea that honestly fits the requested format, stop and tell the user (do not bend a mismatched angle into the wrong shape).

Do not draft yet. Wait for the ideator to finish.

### 4. Pick an idea

- If `args` has a number `N`, pick the Nth idea from the just-written `ideas/$(date +%Y-%m-%d).md` (order = order in file) — an explicit number is a direct override, skip the interactive pick below entirely.
- If the pick is out of range, stop and ask the user which idea to use.
- Otherwise (no number in `args`), run the interactive pick below.

**Interactive pick.** Read every shortlisted idea's `score` (out of 12), `opinion_wedge`, `reach_ceiling`, and `risk` from `ideas/$(date +%Y-%m-%d).md`. Rank by `score` descending; if a **format token** was requested, rank ideas already tagged with that `format` first. Ask the user to choose with `AskUserQuestion`, one option per idea:

- Cap at 4 options (the tool's hard max). With 5 shortlisted ideas, offer the top 4 by the ranking above and say in the question text that a 5th exists and can be reached by typing its number into "Other".
- Option label: rank + display score, e.g. `#1 · 8/10`. Convert the ideator's `score` (out of 12) to the friendlier out-of-10 shown here: `round(score * 10 / 12)`.
- Option description: compress the brief's own fields into pros and cons — do not invent new judgment beyond what the brief already says. **Pros:** the `opinion_wedge`, plus the `reach_ceiling` note when it's `2` (mainstream/hot topic — a bigger room). **Cons:** the `risk` field, plus the `reach_ceiling` note when it's `1` (capped at a sub-community). If the requested format differs from the idea's own `format`, add one clause noting the conversion (e.g. "would convert from text to carousel"). Keep the whole description under ~50 words.
- Question header: `Pick idea`. Question text: `Which idea should we draft next?`

Map the answer back to its `idea_id`. If `AskUserQuestion` cannot be presented (no interactive channel available), fall back to the highest-ranked idea and note the fallback in the step-1 status line.

If a format was requested and the chosen idea's `format` differs, set the idea's `format` to the requested value via Edit — but only if the angle genuinely supports that shape (a real 3-to-6-option comparison for `carousel`; a real 3-to-5-branch decision for `decision-tree`). If it cannot fit, stop and tell the user the picked angle does not suit the requested format.

Mark the chosen idea's `status` in `ideas/$(date +%Y-%m-%d).md` to `approved` via Edit. Leave the others as `shortlisted`.

### 5. Draft

Invoke the `post-writer` skill with the approved idea brief. Pass through every field the writer expects: `angle`, `source_url`, `source_title`, `briefing_date`, `topic_family`, `source_type`, `format`, `why_now`, `opinion_wedge`, `evidence_points`. The writer drafts in the brief's `format` (prose for `text`, the per-slide outline for `carousel`, the routing tree for `decision-tree`).

The writer saves to `drafts/$(date +%Y-%m-%d)-<slug>.md`. Capture that path for the next step.

### 6. Critique

Invoke the `post-critic` skill with the draft path from step 5. The critic will read the idea brief, the patterns report, and the draft, then emit either an approval scorecard or a rewrite plan.

If the critic rejects, stop here. Do not generate a concept image for a draft that is not going to publish.

### 7. Visual concept (only if critic approved)

Read the approved draft's `format` and branch to the matching visual skill:

- **`format: text` (or absent)** → `post-image`. Always square; there is no size to pick.
- **`format: carousel`** → `post-carousel`. Always square 1080×1080; there is no size to pick. Writes an index `concepts/<date>-<slug>/prompt.md` plus `slide-NN.md` files.
- **`format: decision-tree`** → `post-flowchart`. Always square; there is no size to pick. Writes a single `concepts/<date>-<slug>/prompt.md`.

Whichever runs will:

- Reason over the draft to produce the right visual (one metaphor for a text post; an intro/closing metaphor plus per-tool icons and a shared visual system for a carousel; a clean routing flowchart for a decision-tree).
- Write the prompt(s) under `concepts/<date>-<slug>/`, with `prompt.md` as the file `concept_path` points at.
- Update the draft frontmatter with `concept_path: concepts/<…>/prompt.md`.
- Call `bun run generate-image concepts/<date>-<slug>` to actually render the prompt(s) with OpenAI's `gpt-image-2` into the gitignored `images/<date>-<slug>/` folder, when `OPENAI_API_KEY` is set.
- Print the prompt(s) either way so the user can paste them into an image tool.

Surface the style choice rather than taking the default silently — style is the highest-leverage visual variable. If the visual skill fails to build or save the prompt itself, surface the error and stop — the draft is already saved and approved, and the user can re-run `/post-image <draft>` (text), `/post-carousel <draft>` (carousel), or `/post-flowchart <draft>` (decision-tree) manually. A missing `OPENAI_API_KEY` or a failed generation call is **not** this kind of failure — the prompt is still saved, so treat it as a soft `skipped`/`failed` note and continue to Output.

## Output

Print, in order:

1. A one-line status per step: `briefing: created | reused`, `postmortems: refreshed | fresh | skipped`, `retros: N swept | none pending`, `ideation: N briefs`, `pick: interactive | direct (arg N) | fallback`, `chosen: <idea_id>`, `format: text | carousel | decision-tree`, `draft: <path>`, `critic: approved | rejected`, `concept: <path> | skipped`, `image: generated | skipped (no OPENAI_API_KEY) | failed | N generated, K failed`.
2. The full draft text (so the user can read it without opening the file).
3. The critic's verdict block verbatim.
4. If the concept was generated, the visual skill's output block verbatim, including its `Image:`/`Images:` line — the single `post-image` prompt for a text post, the delimited `post-carousel` slide prompts (`--- SLIDE NN ---`) for a carousel, or the single `post-flowchart` prompt for a decision-tree. When generation succeeded, tell the user the PNG(s) are already sitting in `images/<date>-<slug>/`; when skipped or failed, the prompt is still there to paste manually.

If the critic rejected the draft, stop after step 3. Do not auto-revise and do not generate a concept image. The rewrite plan is the user's call.

## Failure handling

- Briefing step fails: report the failure and stop. The rest of the pipeline depends on a current briefing.
- `bun run top-posts` or `bun run post-patterns` fails: report and stop.
- Ideator returns zero passing briefs: stop and tell the user the shortlist was empty. Do not invent an angle.
- Writer fails to save the draft: stop. Do not retry without the user.
- Critic rejects: this is not a pipeline failure. Print the rewrite plan and end normally.

## What this skill does not do

- It does not run `post-retro`. That happens 72 hours after publishing.
- It does not publish to LinkedIn.
- It does not bypass the critic. A rejected draft stays a draft.
- It does not edit `posts/`. Those are scraped output.

## When to use

Trigger phrases:

- "run the full cycle"
- "do the whole flow"
- "post-cycle"
- "give me a post end to end"
- "pipeline a post"
- "ideate, draft, and critique"

If the user already has a draft and just wants it critiqued, use `post-critic` directly. If they already picked an idea, use `post-writer` directly. This skill is for the cold start.
