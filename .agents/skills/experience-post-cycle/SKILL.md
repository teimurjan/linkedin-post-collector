---
name: experience-post-cycle
description: Turn one thought the owner typed about their own work into a finished LinkedIn post — hook, body in the owner's voice, critic verdict, and a sketch cover image the owner picks from three metaphors. No briefing, no ideator; the owner's idea is the only input. Use when the user says "experience cycle", "experience-post-cycle", "polish this into a post", "post about what I built", "founder update", or hands over a raw thought about their apps, their numbers, a system they built instead of hiring, or something ten years of engineering didn't teach them. For a post reacting to external news, use news-post-cycle instead.
---

# experience-post-cycle

Orchestrates the **experience lane** end-to-end. The input is a thought the owner wrote; the output is that thought, polished: a front-loaded hook, a body in the owner's own register, a critic verdict, and a cover image. You are the conductor. The underlying skills (`post-retro`, `wiki-curator`, `post-writer`, `post-critic`, `post-image`) own their logic and each runs standalone. Do not duplicate their rules. Do not skip them.

**What an experience post is.** A post whose subject is the owner's own operation: an app they run, a number they measured, a function they built instead of hiring for, a lesson the sell side taught them, the nights-and-weekends constraint. `headcount-zero-positioning.md` at the repo root is the brand dossier that defines this lane — its four pillars, its voice (benchmarks and receipts), and what it is not (indie-dev generic, "agentic" slogans, retired labels). Read it before anything else in this cycle. It is the reason this lane exists.

**What it is not.** A take on someone else's news. If the thought is really "here is what I think about X that just shipped", stop and point the user at `news-post-cycle`. A thought that is about the owner's *posting* (metrics, streaks, this pipeline) fails the critic's navel-gazing rule in either lane — say so before drafting.

## Inputs

`args` carries the owner's raw thought, as typed. It can be one sentence or a rough paragraph. It can include a number, a link to the app, a screenshot description, a half-formed opinion.

- If `args` is empty, ask once: `What happened? One thing you built, measured, shipped, or learned this week, in your own words.` Then wait. Do not run the rest of the cycle on a guess.
- Format is always `text` in this lane. Carousels and decision trees are comparison shapes for the news lane; a Replaced-a-Hire carousel is a possible future format, not this cycle.

## Human in the loop

This cycle pauses twice inside the writer and once inside the image step, and waits for the owner each time:

1. **The hook pick** — the writer offers three hooks, the owner picks or rewrites one.
2. **The missing specific** — the writer asks for exactly one thing the thought does not yet carry (a number, a name, a moment, a cost). The owner answers in their own words.
3. **The image pick** — three metaphor sentences, the owner chooses one; only the pick is rendered.

Never answer any of these for the owner. The whole point of this lane is that the post is theirs.

## Workflow

### 0. Read the dossier

Read `headcount-zero-positioning.md` in full. Carry into the writer and critic: the four pillars (`replaced-a-hire`, `numbers-from-a-company-of-one`, `didnt-teach-me`, `nights-and-weekends`), the voice rule (every claim gets a number), the platform notes (links in the body cut reach — they go in the first comment), and the Kill Test (if a competitor could say the same sentence, it is not ownable).

### 1. Retro sweep (experience drafts, last 3 months)

The 72-hour retro has no trigger of its own, so sweep for pending debt at the top of the cycle — but only for **experience-lane drafts**, so this cycle never spends time analyzing news posts. `news-post-cycle` sweeps both lanes; this one sweeps its own.

A draft is a retro candidate when **all** hold:

1. It sits in `drafts/` with `lane: experience` in its frontmatter.
2. It is published — a matching file exists under `posts/` (match by prefix; archive slugs are longer than draft slugs).
3. Its `posted_at` is more than 72 hours ago and within the last 3 months.
4. No `retros/<YYYY-MM-DD-slug>.md` exists yet.

```sh
for d in $(grep -l '^lane: experience' drafts/*.md 2>/dev/null); do
  base=$(basename "$d" .md)
  post=$(find "posts/${base:0:4}" -maxdepth 1 -name "${base:5}*.md" 2>/dev/null | head -1)
  [ -z "$post" ] && continue
  test -f "retros/$base.md" && continue
  posted=$(grep -m1 '^[[:space:]]*posted_at:' "$post" | sed "s/^[^:]*: *//;s/[\"']//g")
  echo "$base | posted=$posted"
done
```

For each candidate in the window, invoke `post-retro` with the `YYYY-MM-DD-slug`, one at a time. Soft failure: a stuck retro never blocks the draft.

Then, if `grep -rl "wiki_ingested: false" retros/ | wc -l` is above zero, invoke `wiki-curator` in `ingest` mode. Soft failure as well.

### 2. Archive context (experience lane only)

```sh
bun run top-posts --n 10 --lane experience
bun run post-patterns --lane experience
bun run wiki lint
```

Keep the output in context for the writer and critic. The `--lane experience` scope is the point: the owner's own launches, build logs, and founder updates are a different room from the news posts, with a different median, and the two must never be compared. The `## Lanes` table in the report shows how thin the experience cohort still is — respect its `too few to cite` marker, and say so in the output when it fires.

`wiki lint` is advisory; report and carry on. `wiki/audience.md` was calibrated on news posts, so its tiers do not bind here. The lane's own judgment page is the wiki page with slug `experience`; `wiki-curator` creates it when the first experience-lane retro is ingested. Pass it to the critic when it exists and say so when it does not.

If `post-patterns` fails, surface the error and stop.

### 3. Draft (human in the loop)

Invoke `post-writer` with the owner's raw thought as the single input and `lane: experience`. The writer reads the dossier and tone samples, offers three hooks, asks for the one missing specific, then drafts around the owner's words and tags the draft with a `pillar`. It saves to `drafts/$(date +%Y-%m-%d)-<slug>.md` with `lane: experience`.

Relay the owner's answers verbatim. Do not paraphrase, soften, or fill in a number the owner did not give.

### 4. Critique

Invoke `post-critic` with the draft path. The critic reads the draft's `lane`, scores it against the experience-lane report, and applies the lane's receipts rule (a claim without a number is a specificity failure) and the navel-gazing rule (the owner's operation is the subject by design; the owner's posting metrics are not).

If the critic rejects, stop here. Print the rewrite plan. Do not generate an image.

### 5. Cover image (only if critic approved)

Invoke `post-image` with the draft path. It builds three sketch-on-white metaphor variants from the post's own materials and asks the owner to pick one from the metaphor sentences, before rendering anything. The pick becomes `concepts/<date>-<slug>/prompt.md`, then renders to `images/<date>-<slug>/prompt.png` when `OPENAI_API_KEY` is set, and the draft's `concept_path` is set. Wait for the pick.

## Output

Print, in order:

1. One status line per step: `retros: N swept | none pending`, `context: experience lane, N posts (too few to cite | citable)`, `pillar: <pillar>`, `draft: <path>`, `critic: approved | rejected`, `image: variant N picked (generated) | variant N picked (prompt only, no OPENAI_API_KEY) | skipped`.
2. The full draft text.
3. The `Comment link:` line the writer printed, if the post has a link to move out of the body.
4. The critic's verdict block verbatim.
5. If the concept was generated, `post-image`'s output block verbatim, including its `Image:` line.

If the critic rejected, stop after step 4.

## Failure handling

- No thought supplied and the owner does not answer: stop. Never invent the owner's experience.
- `bun run post-patterns --lane experience` fails: report and stop.
- Writer fails to save: stop. Do not retry without the user.
- Critic rejects: not a pipeline failure. Print the rewrite plan and end normally.
- The owner does not answer a human-in-the-loop question: stop and wait.

## What this skill does not do

- It does not read the briefing or run the ideator. The owner's thought is the idea.
- It does not draft news takes. That is `news-post-cycle`.
- It does not publish to LinkedIn.
- It does not bypass the critic.
- It does not edit `posts/` or `wiki/`.
- It does not pick a hook, a number, or an image on the owner's behalf.

## When to use

Trigger phrases:

- "experience cycle" / "experience-post-cycle"
- "polish this into a post"
- "post about what I built this week"
- "founder update"
- a raw thought about the owner's apps, numbers, replaced hires, or lessons

If the user only wants the draft, use `post-writer` directly. If they only want a verdict on an existing draft, use `post-critic`. If they only want the image, use `post-image`. This skill is for the whole lane in one go.
