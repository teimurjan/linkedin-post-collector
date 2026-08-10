---
name: post-flowchart
description: 'Generate the image-generation prompt for a `format: decision-tree` LinkedIn post — a single clean hand-drawn flowchart that routes the reader from a root question to a recommendation across 3 to 5 labelled branches, with the question rendered as the in-image title. Always square. Use when a decision-tree draft is approved, the user says "flowchart image", "decision tree image", "render the tree", or `post-cycle` reaches the visual step on a decision-tree draft. Saves the prompt to `concepts/<date>-<slug>/prompt.md`, updates the draft''s `concept_path`, then calls OpenAI (`gpt-image-2`, if `OPENAI_API_KEY` is set) to render it to `images/<date>-<slug>/prompt.png`, and prints the prompt either way so the user can paste it into another image tool. Trigger phrases: "post-flowchart", "flowchart image", "decision tree image".'
---

# post-flowchart

Build one ready-to-paste image-generation prompt that renders a LinkedIn **decision-tree** post as a single, legible **flowchart**: a root question at the top, 3 to 5 branches each labelled with a concrete condition, each landing on a named recommendation. It is the decision-tree sibling of [post-image](../post-image/SKILL.md) and [post-carousel](../post-carousel/SKILL.md).

This is the **one deliberate exception** to `post-image`'s "draw a metaphor, never a chart" rule. A decision tree *is* a diagram — the flowchart is the literal content, not a lazy stand-in. So this skill does not pick a metaphor or stage a subject in tension; it renders a clean, hand-drawn diagram that a reader can follow in seconds.

This skill writes a prompt to disk, updates the draft to link to it, then renders it with OpenAI's `gpt-image-2` when `OPENAI_API_KEY` is set, saving the PNG into a gitignored `images/` folder that mirrors `concepts/`. If the key is not set (or generation fails), the prompt is still saved and printed for the user to paste into an image tool by hand.

**Use this only for `format: decision-tree` drafts.** Text posts use `post-image`; carousels use `post-carousel`.

## Office UI sync

This is the **illustrator** stage (the decision-tree branch of it) — emit `end` once `concepts/<date>-<slug>/prompt.md` is written, per [office-emit-end](../office-emit-end.md). Use `--stage illustrator --response-file concepts/<date>-<slug>/prompt.md`. No separate stage; the file is named `prompt.md` so the dashboard finds it as it would any concept.

## Inputs

1. **Draft path** like `drafts/2026-06-16-which-vector-db-should-you-use.md`. Required. The draft must be `format: decision-tree` with a `## Decision tree` body (a `Question:` line plus 3 to 5 `- If <condition> → <recommendation>` branches and a `Caption:`), as written by `post-writer`'s decision-tree path. If the draft is any other format, stop and point the user to `post-image` (text) or `post-carousel` (carousel).

2. **Style flag** as a token of args (`sketch-on-white` or `hand-drawn`). If absent, prompt the user; default to `sketch-on-white`. Inside `/post-cycle`, surface the choice. The **`photo` style is not offered** — a flowchart is line art with rendered labels, which the photo style refuses.

Size is always **square**, 1200 × 1200, ratio 1:1 — the LinkedIn-accepted general-feed size (see [linkedin-image-specs](../linkedin-image-specs.md)). There is no size flag. A tall tree (4 to 5 branches) still lays out inside the square — keep it balanced and legible rather than reaching for more vertical room.

The skill does not accept `posts/...` paths.

## Building the flowchart

Read the draft's `## Decision tree` block and lay it out as a top-down flow:

- **Root**: the `Question:` line, rendered as the in-image title at the top and as the single starting node of the flow.
- **Branches**: one labelled edge per `- If <condition> → <recommendation>` line. The condition is the edge label; the recommendation is the leaf node it points to. Keep 3 to 5 branches — if the draft has more, stop and ask the writer to cut (the image must stay legible).
- **Leaves**: each recommendation is a clearly drawn end node (a box with the named tool/approach).
- Keep the layout clean and balanced: root at top, branches fanning down, leaves on one row or two. One level of nesting at most. No crossing edges, no clutter, generous whitespace. It must read in milliseconds at phone size.

### Title overlay rules

Render the root question IN-image as the title (for both styles). Compress it hard — it is the biggest text on the canvas:

- Trim to **3 to 7 words**; strip quote marks, parentheses, em dashes, trailing punctuation.
- Keep the core wording; drop filler ("should you", "do you have a").
- All caps in the final overlay.

### Legibility budget (hard rule — the image must read in one second)

This is the rule that decides whether the flowchart works. An AI image tool renders long text tiny and garbled, so **you compress the draft's branch text before it goes in the image. Never render a full sentence in a node or on an arrow.** The supporting detail (numbers, examples, the "why") lives in the **caption only** — it is already there; do not duplicate it into the diagram.

Hard caps on what is *rendered in the image*:

- **Condition label (on the arrow): at most 4 words.** A noun phrase, not a sentence. No examples, no numbers, no colons, no parentheticals.
- **Recommendation node: at most 3 words.** An imperative or a verdict.
- **Title: 3 to 7 words** (above).
- **3 to 5 branches.** If the draft has more, stop and ask the writer to cut.

Compress each branch to its essence. Worked example, from a real over-stuffed draft:

| draft branch (too long for the image) | rendered label → node |
| --- | --- |
| If a fixed evaluator grades every run and a git revert undoes any damage → let it loop overnight (~100 runs, auto-revert) | `GRADED + REVERSIBLE` → `LOOP OVERNIGHT` |
| If the task reads untrusted input (Sentry errors, web pages, a stranger's repo) → never autonomous | `READS UNTRUSTED INPUT` → `NEVER` |
| If the blast radius is irreversible (prod data, live credentials, real money) → keep your hand on it | `IRREVERSIBLE BLAST RADIUS` → `STAY HANDS-ON` |
| Otherwise you are the only evaluator → supervise | `NO EVALUATOR YET` → `SUPERVISE` |

If you cannot get a condition under 4 words without losing its meaning, the branch is doing too much — that nuance belongs in the caption, and the label keeps only the trigger. Big, sparse text beats complete text every time.

## Styles

Two styles: **sketch-on-white** (default) and **hand-drawn**. Same diagram either way; only the rendering descriptors change. Include the chosen style's style spine and the tailored negative prompt block **verbatim**.

### sketch-on-white

Style spine:

```
Minimalist hand-drawn flowchart: confident single-weight black ink lines on a solid
pure-white background, no color or fill, like a black marker on paper. Clean nodes
(rounded boxes) and labelled connector arrows, generous negative space, balanced top-down
layout. Reads in milliseconds. All text hand-lettered in black. Title hand-lettered in
black across the top.
```

### hand-drawn

Style spine:

```
Hand-drawn flowchart in a warm 1960s mid-century-modern style: clean confident lines with
a lightly textured hand-sketched feel on warm off-white paper, restrained muted palette
(mustard, teal, burnt orange, ochre, cream) used sparingly, subtle paper grain. Rounded
nodes and labelled connector arrows, balanced top-down layout, generous negative space.
Reads in milliseconds. All text hand-lettered. Title hand-lettered across the top.
```

## Diagram + label rendering block (append, per chosen style's lettering)

```
Render the root question IN-IMAGE as a big hand-lettered title across the top, large and
high-contrast. Below it draw a clean top-down flowchart: one starting node, 3 to 5 arrows
fanning down, each arrow labelled with a SHORT condition of at most four words, each arrow
ending in a clearly drawn node holding a recommendation of at most three words. All text
large and legible at phone size — few words, big letters. No full sentences, no small
print, no crossing arrows, no clutter, generous whitespace.
```

## Negative prompt block (tailored — a flowchart IS allowed here)

Use this in place of `post-image`'s block, because a decision flowchart is the literal subject and must not be suppressed:

```
Avoid: photorealism, 3D, gradients, halftone, watercolor, anime, emoji, blurry or garbled
text, crossing or tangled arrows, busy backgrounds, clutter, more than five branches. Keep
the layout clean and balanced and the text crisp and readable. No real or trademarked
characters, logos, or brands; all marks original. (A clean flowchart with nodes and arrows
is the intended subject — do not avoid it.) No cliché brains, lightbulbs, gears,
locks-and-keys, robot faces, magnifying glasses, chess pieces, rockets, plain handshakes,
or dollar signs.
```

## Aspect ratio suffix (append last)

```
Aspect ratio 1:1, 1200x1200, square; title across the top, the flowchart filling the rest.
```

## Persistence

### Concept folder

For a draft at `drafts/<YYYY-MM-DD>-<slug>.md`, write to:

```
concepts/<YYYY-MM-DD>-<slug>/prompt.md
```

Create the folder if missing; overwrite `prompt.md` if it exists. The file must be named exactly `prompt.md` — the dashboard and scraper key off that name. `concept_path` points at it.

### Prompt file frontmatter

```yaml
---
draft_file: drafts/<YYYY-MM-DD>-<slug>.md
format: decision-tree
style: sketch-on-white | hand-drawn
hook_overlay: <ROOT QUESTION IN ALL CAPS>
branch_count: <3..5>
size: square
size_pixels: 1200x1200
generated_at: <ISO timestamp>
---
```

Keep `hook_overlay` set to the compressed root question so the dashboard can title the card. The scraper may later append `post_url`/`post_path`; do not author those by hand.

### Prompt file body

The body is the full prompt as printed below: the chosen style's spine, the flowchart description (root question, each labelled branch and its leaf, in order), the diagram+label rendering block, the aspect suffix, and the tailored negative prompt block.

### Draft linkage

Update the draft frontmatter `concept_path: concepts/<YYYY-MM-DD>-<slug>/prompt.md` via Edit (preserve the rest). Overwrite an existing value.

## Image generation

Once `prompt.md` is written, run:

```sh
bun run generate-image concepts/<YYYY-MM-DD>-<slug>
```

This calls OpenAI's `gpt-image-2` with the saved prompt, requesting a standard square image, and writes the finished PNG to `images/<YYYY-MM-DD>-<slug>/prompt.png`. No cropping or resizing — the model is only ever asked for square.

- If `OPENAI_API_KEY` is not set, the command exits with `OPENAI_API_KEY is not set — skipped`. Expected, not a failure — record `skipped` and move on.
- If it fails for any other reason, surface the one-line error and record `failed`. **Never stop the skill or fail the run** over a generation error — the prompt is already saved.
- Only report `generated` when the command printed `saved images/...`.

## Output format

```
Style: <sketch-on-white | hand-drawn>
Size: square — 1200 x 1200
Root question: <ROOT QUESTION IN ALL CAPS>
Branches: <N>
Saved to: concepts/<YYYY-MM-DD>-<slug>/prompt.md
Image: images/<YYYY-MM-DD>-<slug>/prompt.png (generated) | skipped — OPENAI_API_KEY not set | failed — <one-line reason>
Linked from: drafts/<YYYY-MM-DD>-<slug>.md

Prompt:

<chosen style's style spine>

Flowchart: <root question as the start node, then each "condition -> recommendation"
branch listed in order>

<diagram + label rendering block>

<aspect ratio suffix>

<tailored negative prompt block>
```

No preamble. Just print so the user can paste.

## Workflow

1. Read the draft. Confirm `format: decision-tree`; otherwise route to `post-image`/`post-carousel`.
2. Parse the root question and the 3 to 5 branches. If more than 5, stop and ask the writer to cut.
3. Resolve the style (default `sketch-on-white`; surface inside `/post-cycle`). Size is always square.
4. Compress to the legibility budget: title 3 to 7 words, each condition ≤ 4 words, each recommendation ≤ 3 words, all caps. Push every number, example, and qualifier into the caption, not the diagram.
5. Assemble the prompt in the exact output format.
6. Write `concepts/<date>-<slug>/prompt.md`.
7. Edit the draft to set `concept_path`.
8. Run `bun run generate-image concepts/<date>-<slug>` (see Image generation above). Record `generated`, `skipped`, or `failed`.
9. Print the prompt block, with the `Image:` line reflecting step 8.

## Hard rules

- Only for `format: decision-tree` drafts.
- The concept file is always named `prompt.md` and `concept_path` points at it.
- 3 to 5 branches maximum; the image must read in one second.
- Compress every rendered label to the budget: condition ≤ 4 words, recommendation ≤ 3 words, title 3 to 7 words. Never render a full sentence; the detail stays in the caption. Big sparse text over complete text.
- Include the chosen style's style spine and the tailored negative prompt block verbatim. Never offer `photo`.
- A clean flowchart is the intended subject — this is the explicit exception to the no-chart rule. Still forbid the other banned clichés and any real/trademarked logo.
- Only report the image as `generated` when `bun run generate-image` actually printed `saved images/...` — a missing key or a failed call is `skipped`/`failed`, never silently reported as success.
- A `skipped` or `failed` generation is never a reason to stop the skill — the prompt is already saved and usable on its own.

## When NOT to use

- The draft is a text post (`format: text`/absent) → `post-image`. Or a carousel (`format: carousel`) → `post-carousel`.
- The user wants a style outside the two offered. `photo` is not offered for flowcharts.
- Concept art for an already-published post in `posts/`. Out of scope.
