---
name: post-image
description: 'Generate the cover image for a LinkedIn post as a black sketch on white — the only style — with the post''s hook rendered into the image as overlaid text. Builds three metaphor variants from the post''s own materials and asks the user to pick one from the metaphor sentences before anything is rendered. `bun run select-variant` promotes the pick to `concepts/<date>-<slug>/prompt.md` and deletes the losing variants, then `bun run generate-image` renders that one prompt with OpenAI (`gpt-image-2`, if `OPENAI_API_KEY` is set) to `images/<date>-<slug>/prompt.png` and shrinks it with pngquant, and the draft''s `concept_path` is set. Always square. Every variant stages a subject in tension, never a generic stand-in or inert prop. Use when the user says "image for this post", "make a cover image", "generate the post image", "draw an image for X", or picks a draft to illustrate. Trigger phrases: "post-image", "cover image", "draw the post".'
---

# post-image

Build the cover image for one LinkedIn post. The style is fixed: a **black sketch on white** — confident single-weight ink lines on a pure-white background, like a marker on paper — with the hook hand-lettered into the image. There is no style flag and no size flag; do not offer either, and do not invent a second look if asked. The sketch pattern-interrupts a feed full of polished templates and stock photos, reads as something a person drew, and sidesteps the reach penalty LinkedIn applies to obviously-AI imagery.

What *is* chosen is the **scene**. The skill builds **three metaphor variants** for the same post and the owner picks one from the metaphor sentences. The metaphor is the highest-leverage visual variable, and everything around it is fixed, so the sentence carries the whole choice — nothing is rendered until the pick is in, and only the pick is ever drawn.

This skill writes the three variants to disk, waits for the pick, promotes the chosen variant to the concept's `prompt.md` (deleting the variant files), renders that one prompt, and links the draft to it. If `OPENAI_API_KEY` is not set (or the render fails), everything up to the render still happens and the owner pastes `prompt.md` into an image tool by hand.

## Office UI sync

This is the **illustrator** stage — emit `end` once `concepts/<date>-<slug>/prompt.md` exists and the render step has run (after the pick), per [office-emit-end](../office-emit-end.md).

## Inputs

Two input modes. Accept whichever the user provides:

1. **Draft path** like `drafts/2026-09-01-10-years-as-an-engineer.md`. Read the file in full. Use the first non-frontmatter line as the raw hook. Use the whole body for metaphor selection. This is the path that lets the skill update the draft's `concept_path`.
2. **Raw hook text** typed directly. Use it verbatim. There is no body to reason over, so the metaphor selection step will require the user to provide a one-line topic summary.

Size is always **square**, 1200 × 1200, ratio 1:1 — the LinkedIn-accepted general-feed size (see [linkedin-image-specs](../linkedin-image-specs.md)).

The skill does not accept `posts/...` paths. Concept art is for new drafts only.

## Metaphor selection

This is the part that decides whether the image lands. Do it before writing any prompt text, and do it **three times** — three distinct scenes, each of which would pass on its own.

### Step 0: the scene must have a subject in tension (the scroll-stop rule)

The single most common failure is illustrating the *noun* instead of the *story*: an inert prop that is really a visual pun on a word in the post. An office chair for "per-seat pricing" is the canonical miss — it names the topic, has no face, no motion, no stakes, and the thumb scrolls past it.

Every scene must stage a **subject in a moment of tension**: a character, creature, or anthropomorphized object that is *doing something under pressure* — straining, panicking, juggling, getting squeezed, fleeing, breaking. It needs at least two of: a **face/expression**, **motion** (speed lines, falling, spilling, tipping), and **visible stakes** (something about to go wrong).

Hard test before you proceed: name the subject and the verb. If the verb is "sits", "stands", "exists", or "represents", you have an inert prop — go back and find the actor and the action. A pun on a noun in the post is not a metaphor.

### Step 1: read the whole post

Strip frontmatter. Read the body in full. Identify:

- The **central concrete noun** (paper, package, framework, runtime, vendor, model, language, attack, dataset, app, invoice, user).
- The **central action or tension** (a benchmark collapses, a vendor folds three products into one, a port doubles unsafe blocks, one coin lands in an empty case).
- The **opinion wedge** (what the post argues that the news itself does not).

### Step 2: ban the easy cliché

A metaphor is bad when it could illustrate any post in the same topic family. Banned mappings:

- **brain → AI**: the laziest possible AI illustration. Ban.
- **lightbulb → ideas**: signals "I had a thought" with zero specificity. Ban.
- **gears → engineering**: same energy as a stock photo. Ban.
- **lock + key → security**: every security post has this. Ban.
- **robot face → AI / agents**: only acceptable if the post is literally about a physical robot.
- **magnifying glass → analysis / investigation**: detective-show cliché. Ban.
- **chess pieces → strategy**: corporate-deck cliché. Ban.
- **rocket → launch / growth**: ban, unless the post is literally about aerospace.
- **handshake → partnership**: a plain handshake is banned; "handshake but weird" (a hand made of the post's own material) has worked once and is allowed when the material is specific.
- **money / dollar signs → cost or value**: lazy. Use the actual thing being bought or paid for instead.
- **graph going up → growth**: ban. If the post has a real number, draw the thing the number describes, not the chart.
- **inert prop / pun on a noun → the topic**: an object that just *names* a word in the post (a chair for "seat", a fork for "fork", a bridge for "migration") with no actor and no action. Banned by Step 0.

If the only metaphor you can think of is on this list, you have not understood the post yet. Re-read the body and pick a concrete noun from it.

### Step 3: build the metaphor from the post's own materials

The strongest metaphors are built out of objects that physically belong to the topic. The user's canonical example:

- Post topic: a new agent-focused programming language.
- Weak metaphor: a robot writing on a chalkboard.
- Strong metaphor: a cartoon hand reaching out, where the fingers are built from `{ }`, `<>`, `;`, and bracket pairs the LLM emits, drawn in loose hand-inked line work.

The strong version uses the *actual symbols of the medium* as the material of the metaphor. Aim for that.

### Step 4: worked examples (use these as shape, not literal copies)

- **Constraint-decay paper (LLM agents in back-end code)** → A frazzled cartoon engineer juggling labeled stacks of paper (FLASK, FASTAPI, DJANGO), the heaviest stacks tipping over, tiny sweat drops flying off the brow.
- **npm supply-chain attack** → A cartoon mailman opening a parcel marked with package version numbers, ink in the shape of a skull-and-crossbones seeping out of the wrapping paper onto the floor.
- **Memory now 2/3 of AI chip cost** → A tiny cartoon GPU character labeled COMPUTE getting squeezed flat between two giant crates stamped HBM, sweat popping off its head.
- **Agent-focused programming language** → A cartoon hand reaching forward, fingers shaped from punctuation glyphs (`{ }`, `< >`, `;`, `[ ]`, `( )`), the symbols slightly off-register like misaligned line work.
- **Go-to-Rust migration** → Two cartoon mechanics in greasy overalls hoisting a heavy riveted engine block labeled RUST onto a worn workbench, a leaky lighter engine labeled GO on the floor behind them.
- **Ten years an engineer, zero a founder, first paying user** → A frazzled one-person band, each instrument tagged with a business function (SALES, SUPPORT, MARKETING), a single coin dropping into an otherwise-empty open instrument case at their feet.
- **Replaced a hire with a system** → A cartoon engineer bolting a hand-built contraption into an empty office chair labeled with the job title, the chair's name tag half-crossed-out, papers still landing in the in-tray faster than the contraption's arm can file them.

These are illustrations of the *thinking*. Do not lift them verbatim if a different concrete scene serves the post better.

### Step 5: write three metaphor sentences

Write **three** single declarative sentences, each naming one scene. One subject. One action. One moment. Concrete nouns only. The three must differ in **what the subject is doing**, not just in props — three angles on the same tension, the way the writer offers three hooks on the same wedge. If two sentences share a subject and a verb, replace one.

Run the **scroll-stop gate** on every sentence before continuing:

- Does it name a subject with a face or a body doing something? If not, fail — it is an inert prop (Step 0).
- Is there motion or tension a thumb would catch mid-scroll? If not, fail.
- Could this exact sentence illustrate a different post in the same topic family? If yes, it is too generic — fail.

A failing sentence is replaced, not shipped as "the third option". All three variants have to be scenes you would be glad the owner picked.

## Hook overlay rules

The hook is rendered IN-image as hand-lettered text and is identical across the three variants. It must stay legible at a glance — large, high-contrast, never decorative at the expense of readability. Compress it before rendering:

- Trim to 6 to 12 words.
- Strip quote marks, parentheses, em dashes, trailing punctuation.
- Keep the wording verbatim where possible. Do not paraphrase into something blander.
- Keep numbers — they survive image generation better than long words.
- All caps in the final overlay.

Example: `"A new paper benchmarks LLM coding agents on 100 back-end tasks across 8 web frameworks and finds something the leaderboard versions don't."` → `LLM AGENTS BROKE ON 100 BACK-END TASKS`.

**Bake the exact words into the prompt.** The hook overlay block below carries a `<HOOK_OVERLAY>` token. When you assemble each prompt, replace that token with this compressed all-caps hook, verbatim. If the literal words are not in the prompt body sent to the model, it invents its own paraphrase (a real failure: `YOUR DATABASE HAS A FAILOVER PLAN. GITHUB DOESN'T` came back as `WHEN DATABASE HAS A LEVER BUT GITHUB IS JUST PAINT`).

## The style (fixed)

Every variant includes these three blocks **verbatim**, plus the aspect ratio suffix and, when the scene has a figure, the anatomy guard. Never summarize them and never substitute another look.

Style spine:

```
Minimalist hand-drawn sketch: confident single-weight black ink lines on a solid
pure-white background, no color or fill, like a black marker on paper. One clear focal
subject with a strong silhouette and generous negative space. Reads in milliseconds.
All characters original. Hook hand-lettered in black across the upper third.
```

Hook overlay block:

```
Render this exact hook text IN-IMAGE, verbatim and unparaphrased, every word spelled
exactly as written, nothing added, dropped, reordered, or reworded:
<HOOK_OVERLAY>
Hand-lettered black marker capitals, slightly uneven, same line weight as the drawing.
All caps, large, high-contrast, readable at a glance. One line, or two or three centered
lines if needed.
```

Negative prompt block:

```
Avoid: color, fills, gradients, photorealism, 3D, halftone, watercolor, anime, emoji,
blurry or garbled text, busy backgrounds, clutter. Keep the background solid white and
lines pure black. No real or trademarked characters, logos, or brands; all figures
original. No cliché brains, lightbulbs, gears, locks-and-keys, robot faces, magnifying
glasses, chess pieces, rockets, plain handshakes, dollar signs, or upward graph lines
unless the post is literally about them.
```

## Aspect ratio suffix (append at the end so the model picks it up last)

```
Aspect ratio 1:1, 1200x1200, square; hook across the upper third, subject in the lower two-thirds.
```

## Anatomy and physics guard (append when the scene has a figure)

Any scene with a character, creature, or anthropomorphized object gets this block appended verbatim, right after the negative prompt block. Image models routinely break hands, grow a third arm, or twist a torso when a figure reaches or strains — which is exactly the kind of pose this skill asks for. Skip it only for a scene with no figure at all.

```
Anatomy and physics: keep every figure anatomically correct and physically plausible.
Exactly two arms and two legs unless the concept explicitly needs otherwise, in natural
human proportion. Each hand has one thumb and four fingers with correct left/right
handedness; shoulders, elbows, and wrists bend at natural angles and stay clearly
attached to the torso. Pick a clear front or three-quarter-front viewpoint so the pose
reads correctly and shirt pockets, buttons, faces, and hands sit on the front of the
body. No extra, missing, fused, stretched, or rubbery limbs or fingers, no malformed
hands, no twisted torso, no impossible or contorted pose.
```

When you write a Subject sentence, help the guard along: give the figure a pose that does not force one arm across the body or a view from behind. If two things must be touched, put them close together so both hands reach with bent elbows, and keep the character front-on or three-quarter-front.

## Persistence

This skill writes to disk before rendering, and again after the pick.

### Concept folder

For a draft at `drafts/<YYYY-MM-DD>-<slug>.md`, the folder is:

```
concepts/<YYYY-MM-DD>-<slug>/
  variant-1.md     # scene 1, full paste-ready prompt
  variant-2.md     # scene 2
  variant-3.md     # scene 3
  prompt.md        # written by select-variant after the pick; what concept_path points at
```

The variant files exist only between writing them and the pick — `select-variant` deletes all three when it writes `prompt.md`, so a finished concept folder holds one prompt. Create the folder if it does not exist. On a re-run, delete a stale `prompt.md` first, then write the new variants.

For a raw-hook invocation (no draft path), use today's date and the first 6 to 8 words of the hook as the slug.

### Variant file frontmatter

Each `variant-N.md` is self-contained:

```yaml
---
variant: <1 | 2 | 3>
draft_file: drafts/<YYYY-MM-DD>-<slug>.md   # omit if raw-hook mode
style: sketch-on-white
hook_overlay: <THE COMPRESSED HOOK IN ALL CAPS>
metaphor: <this variant's single-sentence scene from Step 5>
size: square
size_pixels: 1200x1200
generated_at: <ISO timestamp>
---
```

The body is the full prompt for that variant, in the format under Output below. `select-variant` copies this frontmatter (minus `variant`, plus `selected_variant`) onto `prompt.md`, so `metaphor` and `hook_overlay` must be accurate per variant — the critic and the dashboard read them from the promoted file.

The scraper may later append `post_url` and `post_path` to `prompt.md` when it matches the published post back to this concept. Do not author those by hand.

### Draft linkage

After the pick, if the input was a draft path, update the draft frontmatter with:

```yaml
concept_path: concepts/<YYYY-MM-DD>-<slug>/prompt.md
```

Use Edit, not Write — preserve the rest of the frontmatter and the body verbatim. Overwrite an existing `concept_path`. Never link the draft to a variant file; only to `prompt.md`.

## The pick, then the render

The owner picks **before** anything is rendered. The style is fixed and the scene is the only variable, so the metaphor sentence carries the whole decision; rendering three images to throw two away buys a thumbnail of a choice the words already settle.

Ask with `AskUserQuestion` (header `Pick image`, question `Which cover image should this post use?`), one option per variant:

- Label: `Variant 1`, `Variant 2`, `Variant 3`.
- Description: the variant's metaphor sentence.

Wait for the answer. Never pick on the owner's behalf; if no interactive channel is available, print the three metaphor sentences and end the skill without a `prompt.md`. The owner can finish with `bun run select-variant concepts/<date>-<slug> <N>` by hand.

On the pick, run:

```sh
bun run select-variant concepts/<YYYY-MM-DD>-<slug> <N>
```

It writes `prompt.md` from `variant-N.md` (frontmatter carried over, `selected_variant: N` added) and deletes every `variant-N.md`, the pick included — its prompt now lives in `prompt.md`, and that is the only concept the renderer should ever draw.

Then render that one concept:

```sh
bun run generate-image concepts/<YYYY-MM-DD>-<slug>
```

It renders `prompt.md` with OpenAI's `gpt-image-2` to `images/<YYYY-MM-DD>-<slug>/prompt.png` (a gitignored folder that mirrors `concepts/`), then shrinks the PNG in place with `pngquant`.

- If `OPENAI_API_KEY` is not set, the command exits with `OPENAI_API_KEY is not set — skipped`. This is expected, not a failure — record `skipped`. The prompt is on disk; the owner pastes it into an image tool by hand.
- Only report the image as `generated` when the command printed `saved images/.../prompt.png` for it.
- A `minify skipped — <reason>` line means pngquant was missing or declined to quantize. The render is still good; never report that as a failed image.
- A failed render is not a reason to stop the skill — `prompt.md` is written and the draft is still linked to it.

Then set the draft's `concept_path` (Draft linkage above).

## Output format

Print exactly this after the pick, nothing else:

```
Style: sketch-on-white
Size: square — 1200 x 1200 (1:1)
Hook overlay: <THE HOOK IN ALL CAPS>
Variants:
  1. <metaphor sentence 1>
  2. <metaphor sentence 2>
  3. <metaphor sentence 3>
Picked: variant <N>
Saved to: concepts/<YYYY-MM-DD>-<slug>/prompt.md
Image: images/<YYYY-MM-DD>-<slug>/prompt.png (generated) | skipped — OPENAI_API_KEY not set | failed — <one-line reason>
Linked from: drafts/<YYYY-MM-DD>-<slug>.md   (omit line in raw-hook mode)

Prompt:

<style spine>

Subject: <the picked variant's concrete tactile scene>

<hook overlay block, with <HOOK_OVERLAY> replaced by the compressed hook>

<aspect ratio suffix>

<negative prompt block>

<anatomy and physics guard — include whenever the scene has a figure; omit only for a figureless scene>
```

No preamble. No explanation. Just print so the user can paste. The `<HOOK_OVERLAY>` token must be gone from the printed prompt, replaced by the actual all-caps hook.

## Workflow

1. Resolve inputs:
   - If draft path: read the file, strip frontmatter, take the first non-empty body line as the raw hook, keep the body for metaphor selection.
   - If raw text: use directly. Ask the user for a one-line topic summary if you cannot pick a metaphor without it.
   - If neither: ask once which draft or hook to use.
2. Walk the metaphor selection steps (0 through 5) and produce **three** scenes that each pass the scroll-stop gate and differ in what the subject is doing.
3. Compress the hook to 6 to 12 words, all caps, no model-breaking punctuation. Same overlay for all three.
4. Assemble three prompts in the exact format, each with the style spine, the hook overlay block (token replaced), the aspect ratio suffix, the negative prompt block, and the anatomy guard when the scene has a figure.
5. Write `concepts/<date>-<slug>/variant-1.md`, `variant-2.md`, `variant-3.md`. Remove a stale `prompt.md` if one exists from an earlier run. Render nothing.
6. Ask the owner to pick from the three metaphor sentences (`AskUserQuestion`). Wait.
7. Run `bun run select-variant concepts/<date>-<slug> <N>` — it writes `prompt.md` and clears the variant files.
8. Run `bun run generate-image concepts/<date>-<slug>`. Record `generated`, `skipped`, or `failed`.
9. If a draft path was provided, Edit the draft frontmatter to set `concept_path`.
10. Print the output block, with the `Image:` line reflecting step 8.

## Hard rules

- Always read the whole draft body before choosing a metaphor. Never pick from the hook alone.
- Always build exactly three variants. Not one, not five. Each must pass the scroll-stop gate on its own; a weak third option is not filler, it is a failure.
- Always include the full style spine, hook overlay block, and negative prompt block verbatim in every variant, plus the aspect ratio suffix. Do not summarize. Do not offer or invent any other style.
- Every scene stages a subject in tension (Step 0). Never ship an inert prop or a visual pun on a noun from the post.
- Always render the hook in the image, and always bake the literal hook into the prompt: replace `<HOOK_OVERLAY>` with the compressed all-caps hook before writing the variant. A hook overlay block that still says only "render the hook" lets the model invent a paraphrase — never ship one.
- Whenever the scene has a figure, append the anatomy and physics guard, and write the Subject with a pose that does not force a cross-body reach or a from-behind view.
- The image must read in milliseconds: one clear focal subject, strong silhouette, no clutter or busy background.
- Never describe the subject in abstract terms ("a metaphor for X"). Always concrete.
- Never pick the variant yourself. The owner picks; `prompt.md` only exists after they do.
- Never render before the pick. `generate-image` runs once, on the promoted `prompt.md`, and never on the variants.
- Only report the image as `generated` when the CLI actually printed `saved images/...` — a missing key or a failed call is `skipped`/`failed`, never silently reported as success.
- A `skipped` or `failed` render is never a reason to stop the skill — `prompt.md` is written, the draft is linked, and the owner can render the prompt by hand.
- Never pick a metaphor from the banned-cliché list without an explicit literal justification (the post is about a physical robot, an actual chess game, etc.).

## When NOT to use

- The user wants a style other than the black sketch on white (color, photo, mid-century, neon). There is one style. Say so and continue with it.
- The user wants concept art for an already-published post in `posts/`. Out of scope.
- The draft is `format: carousel` or `format: decision-tree` — those have their own visual skills (`post-carousel`, `post-flowchart`), single-render, no variants.
