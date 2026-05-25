---
name: post-cycle
description: Run the full LinkedIn post pipeline end-to-end in one go — briefing (if missing), top-posts + patterns context, ideator shortlist, writer draft, critic verdict. Use when the user says "full cycle", "run the pipeline", "do the whole flow", "post-cycle", "give me a post end to end", or wants a single command that replaces invoking topics-briefing, post-ideator, post-writer, and post-critic separately. Optionally accepts an idea number to pick from a freshly generated shortlist.
---

# post-cycle

Orchestrates the four-step post pipeline so the user does not run each skill by hand. You are the conductor. The underlying skills (`topics-briefing`, `post-ideator`, `post-writer`, `post-critic`) own their logic. Do not duplicate their rules. Do not skip them.

## Inputs

- `args` (optional): an integer `1..5` picking a specific idea from the freshly generated shortlist. If absent, auto-pick the top-scored brief in `ideas/YYYY-MM-DD.md` (the first entry the ideator emitted).

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

Do not draft yet. Wait for the ideator to finish.

### 4. Pick an idea

- If `args` is a number `N`, pick the Nth idea from the just-written `ideas/$(date +%Y-%m-%d).md` (order = order in file).
- If `args` is empty, pick the first entry in `ideas/$(date +%Y-%m-%d).md` (the ideator's strongest pick).
- If the pick is out of range, stop and ask the user which idea to use.

Mark the chosen idea's `status` in `ideas/$(date +%Y-%m-%d).md` to `approved` via Edit. Leave the others as `shortlisted`.

### 5. Draft

Invoke the `post-writer` skill with the approved idea brief. Pass through every field the writer expects: `angle`, `source_url`, `source_title`, `briefing_date`, `topic_family`, `source_type`, `why_now`, `opinion_wedge`, `evidence_points`.

The writer saves to `drafts/$(date +%Y-%m-%d)-<slug>.md`. Capture that path for the next step.

### 6. Critique

Invoke the `post-critic` skill with the draft path from step 5. The critic will read the idea brief, the patterns report, and the draft, then emit either an approval scorecard or a rewrite plan.

## Output

Print, in order:

1. A one-line status per step: `briefing: created | reused`, `ideation: N briefs`, `chosen: <idea_id>`, `draft: <path>`, `critic: approved | rejected`.
2. The full draft text (so the user can read it without opening the file).
3. The critic's verdict block verbatim.

If the critic rejected the draft, stop. Do not auto-revise. The rewrite plan is the user's call.

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
