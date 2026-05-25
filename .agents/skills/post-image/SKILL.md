---
name: post-image
description: Generate an image-generation prompt for a LinkedIn post in 1930s rubber-hose cartoon style (vintage hand-inked animation) with the post's hook rendered into the image as title-card text. Picks a tactile, content-specific metaphor by reasoning over the whole draft, never a generic stand-in. Use when the user says "image for this post", "make a cover image", "generate the post image", "draw a vintage cartoon image for X", or picks a draft to illustrate. Saves the prompt to `concepts/<date>-<slug>/prompt.md`, updates the draft's `concept_path`, and prints the prompt for the user to paste into their image tool. Trigger phrases: "post-image", "cover image", "draw the post", "vintage cartoon image".
---

# post-image

Build a complete, ready-to-paste image-generation prompt for one LinkedIn post. The aesthetic is 1930s rubber-hose animation (early hand-inked American animation shorts) with the post hook rendered into the image as a vintage title-card overlay.

This skill writes a prompt to disk and updates the draft to link to it. It does not call an image model. The user pastes the printed prompt into Midjourney, GPT image, Imagen, Nano Banana, etc., and drops the resulting file into the same concept folder.

## Inputs

Two input modes. Accept whichever the user provides:

1. **Draft path** like `drafts/2026-05-25-a-new-paper-benchmarks-llm-coding-agents.md`. Read the file in full. Use the first non-frontmatter line as the raw hook. Use the whole body for metaphor selection. This is the path that lets the skill update the draft's `concept_path`.
2. **Raw hook text** typed directly. Use it verbatim. There is no body to reason over, so the metaphor selection step will require the user to provide a one-line topic summary.

Optional **size flag** as the last token of args:

- `landscape` → 1200 × 627, ratio 1.91:1 (link previews)
- `square` (default) → 1080 × 1080, ratio 1:1 (general LinkedIn feed)
- `portrait` → 1080 × 1350, ratio 4:5 (mobile vertical)

The skill does not accept `posts/...` paths. Concept art is for new drafts only.

## Metaphor selection

This is the part that decides whether the image lands. Do it before writing any prompt text.

### Step 1: read the whole post

Strip frontmatter. Read the body in full. Identify:

- The **central concrete noun** (paper, package, framework, runtime, vendor, model, language, attack, dataset).
- The **central action or tension** (a benchmark collapses, a vendor folds three products into one, a port doubles unsafe blocks, a package leaks secrets).
- The **opinion wedge** (what the post argues that the news itself does not).

### Step 2: ban the easy cliché

A metaphor is bad when it could illustrate any post in the same topic family. Banned mappings, with the reason each one fails:

- **brain → AI**: the laziest possible AI illustration. Every AI post on LinkedIn already has this. Ban.
- **lightbulb → ideas**: signals "I had a thought" with zero specificity. Ban.
- **gears → engineering**: same energy as a stock photo. Ban.
- **lock + key → security**: every security post has this. Ban.
- **robot face → AI / agents**: only acceptable if the post is literally about a physical robot.
- **magnifying glass → analysis / investigation**: detective-show cliché. Ban.
- **chess pieces → strategy**: corporate-deck cliché. Ban.
- **rocket → launch / growth**: ban, unless the post is literally about aerospace.
- **handshake → partnership**: the existing imagery memory notes "handshake but weird" worked once. The wedge there was *weird*, not *handshake*. Do not use plain handshakes.
- **money / dollar signs → cost or value**: lazy. Use the actual thing being bought or paid for instead.
- **graph going up → growth**: ban. If the post has a real number, draw the thing the number describes, not the chart.

If the only metaphor you can think of is on this list, you have not understood the post yet. Re-read the body and pick a concrete noun from it.

### Step 3: build the metaphor from the post's own materials

The strongest metaphors are built out of objects that physically belong to the topic. The user's canonical example:

- Post topic: a new agent-focused programming language.
- Weak metaphor: a robot writing on a chalkboard.
- Strong metaphor: a cartoon hand reaching out, where the fingers are built from `{ }`, `<>`, `;`, and bracket pairs the LLM emits, slightly off-register like a 1930s ink plate.

The strong version uses the *actual symbols of the medium* as the material of the metaphor. Aim for that.

### Step 4: worked examples (use these as shape, not literal copies)

- **Constraint-decay paper (LLM agents in back-end code)** → A frazzled cartoon engineer in 1930s overalls juggling labeled stacks of paper (FLASK, FASTAPI, DJANGO), the heaviest stacks tipping over, tiny sweat drops flying off the brow.
- **npm supply-chain attack** → A cartoon mailman in 1930s uniform opening a parcel marked with package version numbers, black ink in the shape of a skull-and-crossbones seeping out of the wrapping paper onto the floor.
- **Memory now 2/3 of AI chip cost** → A tiny cartoon GPU character labeled COMPUTE getting squeezed flat between two giant wooden crates stamped HBM, sweat popping off its head.
- **Agent-focused programming language** → A cartoon hand reaching forward, fingers shaped from punctuation glyphs (`{ }`, `< >`, `;`, `[ ]`, `( )`), the symbols slightly off-register like misaligned ink plates.
- **Go-to-Rust migration** → Two cartoon mechanics in greasy overalls hoisting a heavy riveted engine block labeled RUST onto a worn workbench, a leaky lighter engine labeled GO on the floor behind them, a wrench character watching from the corner.
- **Vendor folds three CLI tools into one agent platform** → A 1930s tailor stitching three half-finished cartoon coats together at the seams, one sleeve too short, one button hanging on a thread, the resulting garment labeled with the new product name on a sewn-in tag.
- **Coding agent retrospective from a real database company** → A cartoon mechanic with a clipboard checking off a long scroll of repairs on a vintage steam engine labeled CLICKHOUSE, oil stains on the page, some items crossed out angrily.

These are illustrations of the *thinking*. Do not lift them verbatim if a different concrete scene serves the post better.

### Step 5: write the chosen metaphor as one sentence

Before assembling the prompt, write a single declarative sentence that names the scene. One subject. One action. One moment. Concrete nouns only. If you cannot do it in one sentence, the metaphor is still too abstract — go back to Step 1.

## Hook overlay rules

The hook is rendered IN-image as a hand-painted title-card banner. Compress it before rendering:

- Trim to 6 to 12 words.
- Strip quote marks, parentheses, em dashes, trailing punctuation.
- Keep the wording verbatim where possible. Do not paraphrase into something blander.
- Keep numbers — they survive image generation better than long words.
- All caps in the final overlay.

Example: `"A new paper benchmarks LLM coding agents on 100 back-end tasks across 8 web frameworks and finds something the leaderboard versions don't."` → `LLM AGENTS BROKE ON 100 BACK-END TASKS`.

## Style spine (always include verbatim)

```
1930s rubber-hose cartoon illustration in the style of early hand-inked American animation shorts.
Hand-inked black outlines with slight wobble, off-model character squash and stretch,
bendy tube-like limbs, expressive overacted poses. All characters are original designs,
not based on any existing, recognizable, or trademarked cartoon mascot.
Aged film texture, visible halftone dot shading, faint film grain, slight registration
misalignment between ink and color plates, gentle vignette at the edges.
Warm sepia and cream palette with one or two muted accent colors (rust red, ink teal,
or burnt yellow). No neon, no gradients, no chrome.
Composition framed like a vintage title card with a hand-lettered banner across
the upper third carrying the hook text.
```

## Hook overlay block (always include verbatim)

```
The hook text must be rendered IN-IMAGE on a hand-painted ribbon, scroll, or
art-deco banner. Bold vintage display lettering, slightly uneven, slight ink
bleed at the strokes. Single line if it fits, otherwise two centered lines.
All caps. Do not stylize the letters into illegibility. The hook must be
readable at a glance.
```

## Aspect ratio suffix

Append at the end so the model picks it up last.

- `landscape`:

  ```
  Aspect ratio 1.91:1, 1200 by 627 pixels, landscape orientation, composition
  laid out horizontally with the hook banner across the top and the subject
  filling the lower two-thirds.
  ```

- `square`:

  ```
  Aspect ratio 1:1, 1080 by 1080 pixels, square composition, hook banner
  occupying the upper third and the subject centered in the lower two-thirds.
  ```

- `portrait`:

  ```
  Aspect ratio 4:5, 1080 by 1350 pixels, portrait orientation optimized for
  mobile feed, hook banner near the top quarter and the subject filling
  most of the vertical canvas.
  ```

## Negative prompt block (always include verbatim)

```
Avoid: photorealism, 3D render, modern flat design, neon, chrome, gradients,
glossy plastic, generic AI-art faces, blurry text, garbled letters,
sci-fi cyberpunk, vector art, isometric, low-poly, anime, manga, watercolor
splash style, sticker style, emoji. Do not depict or resemble any existing,
recognizable, or trademarked cartoon mascot or character; all figures must be
original designs. Avoid the following clichés unless the
post is literally about them: brains, lightbulbs, gears, locks-and-keys,
robot faces, magnifying glasses, chess pieces, rockets, plain handshakes,
dollar signs, and upward-pointing graph lines.
```

## Persistence

This skill writes to disk before printing.

### Concept folder

For a draft at `drafts/<YYYY-MM-DD>-<slug>.md`, write the prompt to:

```
concepts/<YYYY-MM-DD>-<slug>/prompt.md
```

Create the folder if it does not exist. If `prompt.md` already exists, overwrite it.

For a raw-hook invocation (no draft path), use today's date and the first 6 to 8 words of the hook as the slug, mirroring `post-writer`'s slug rules.

### Prompt file frontmatter

```yaml
---
draft_file: drafts/<YYYY-MM-DD>-<slug>.md   # omit if raw-hook mode
hook_overlay: <THE COMPRESSED HOOK IN ALL CAPS>
metaphor: <single-sentence scene description from Step 5>
size: square | landscape | portrait
size_pixels: 1080x1080 | 1200x627 | 1080x1350
generated_at: <ISO timestamp>
---
```

### Prompt file body

The body of `prompt.md` is the full prompt as printed to stdout, in the format below.

### Draft linkage

If the input was a draft path, update the draft frontmatter with:

```yaml
concept_path: concepts/<YYYY-MM-DD>-<slug>/prompt.md
```

If `concept_path` already exists in the draft frontmatter, overwrite it. Use Edit, not Write — preserve the rest of the frontmatter and the body verbatim.

## Output format

Print exactly this, nothing else:

```
Size: <landscape | square | portrait> — <WIDTH> x <HEIGHT> (<ratio>)
Hook overlay: <THE HOOK IN ALL CAPS>
Metaphor: <one-sentence scene description>
Saved to: concepts/<YYYY-MM-DD>-<slug>/prompt.md
Linked from: drafts/<YYYY-MM-DD>-<slug>.md   (omit line in raw-hook mode)

Prompt:

<style spine>

Subject: <one concrete tactile scene tied to the post>

<hook overlay block>

<aspect ratio suffix>

<negative prompt block>
```

No preamble. No explanation. Just print so the user can paste.

## Workflow

1. Resolve inputs:
   - If draft path: read the file, strip frontmatter, take first non-empty body line as raw hook, keep body for metaphor selection.
   - If raw text: use directly. Ask the user for a one-line topic summary if you cannot pick a metaphor without it.
   - If neither: ask once which draft or hook to use.
2. Walk the metaphor selection steps (1 through 5). Refuse to settle on a banned cliché — re-read the body if the only metaphor that comes to mind is on the ban list.
3. Compress the hook to 6 to 12 words, all caps, no model-breaking punctuation.
4. Resolve the size flag (default `square`).
5. Assemble the prompt in the exact output format.
6. Write `concepts/<date>-<slug>/prompt.md` with the frontmatter and body above.
7. If a draft path was provided, Edit the draft frontmatter to set `concept_path`.
8. Print the prompt block to stdout.

## Hard rules

- Always read the whole draft body before choosing a metaphor. Never pick from the hook alone.
- Always include the full style spine, hook overlay block, aspect ratio suffix, and negative prompt block verbatim. Do not summarize.
- Always render the hook in the image. The hook is the point.
- Never write multiple alternative prompts. One prompt per invocation.
- Never describe the subject in abstract terms ("a metaphor for X"). Always concrete.
- Never claim the image was generated. This skill only emits and persists the prompt.
- Never pick a metaphor from the banned-cliché list without an explicit literal justification (the post is about a physical robot, an actual chess game, etc.).

## When NOT to use

- The user wants to actually call an image model. That is a separate step the user runs in their image tool.
- The user wants a non-cartoon style. Do not bend the style spine. Tell them this skill is vintage rubber-hose cartoon only.
- The user wants concept art for an already-published post in `posts/`. Out of scope.
