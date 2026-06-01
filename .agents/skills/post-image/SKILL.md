---
name: post-image
description: 'Generate an image-generation prompt for a LinkedIn post in one of two selectable hand-drawn sketch styles (black sketch on white, or white sketch on black) with the post''s hook rendered into the image as overlaid text. Prompts for the style when none is given. Picks a tactile, content-specific metaphor by reasoning over the whole draft, never a generic stand-in. Use when the user says "image for this post", "make a cover image", "generate the post image", "draw an image for X", or picks a draft to illustrate. Saves the prompt to `concepts/<date>-<slug>/prompt.md`, updates the draft''s `concept_path`, and prints the prompt for the user to paste into their image tool. Trigger phrases: "post-image", "cover image", "draw the post".'
---

# post-image

Build a complete, ready-to-paste image-generation prompt for one LinkedIn post. The post hook is rendered into the image as an overlay. The rendering style is one of two hand-drawn sketch looks: **sketch-on-white** (black line drawing on white, the default) or **sketch-on-black** (white line drawing on black). The metaphor/scene is chosen the same way for both; only the rendering descriptors change. Whatever the style, the image must read in milliseconds — one clear focal subject, no clutter — and the hook must be legible at a glance.

The hand-drawn look is deliberate: it pattern-interrupts a feed full of polished templates and stock photos, and it reads as something a person actually drew rather than generated, which sidesteps the reach penalty LinkedIn applies to obviously-AI imagery.

This skill writes a prompt to disk and updates the draft to link to it. It does not call an image model. The user pastes the printed prompt into Midjourney, GPT image, Imagen, Nano Banana, etc., and drops the resulting file into the same concept folder.

## Inputs

Two input modes. Accept whichever the user provides:

1. **Draft path** like `drafts/2026-05-25-a-new-paper-benchmarks-llm-coding-agents.md`. Read the file in full. Use the first non-frontmatter line as the raw hook. Use the whole body for metaphor selection. This is the path that lets the skill update the draft's `concept_path`.
2. **Raw hook text** typed directly. Use it verbatim. There is no body to reason over, so the metaphor selection step will require the user to provide a one-line topic summary.

Optional **style flag** as a token of args (`sketch-on-white` or `sketch-on-black`). If absent, **prompt the user** to pick one of the two before assembling the prompt (see Workflow). Default to `sketch-on-white` if the user declines to choose.

Optional **size flag** as a token of args:

- `landscape` → 1200 × 627, ratio 1.91:1 (link previews)
- `square` (default) → 1080 × 1080, ratio 1:1 (general LinkedIn feed)
- `portrait` → 1080 × 1350, ratio 4:5 (mobile vertical)

The skill does not accept `posts/...` paths. Concept art is for new drafts only.

## Metaphor selection

This is the part that decides whether the image lands. Do it before writing any prompt text. It is **independent of the chosen style** — pick the scene first, then let the style pack supply the rendering descriptors (black-on-white or white-on-black line work). Keep the metaphor sentence rendering-neutral.

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
- Strong metaphor: a cartoon hand reaching out, where the fingers are built from `{ }`, `<>`, `;`, and bracket pairs the LLM emits, drawn in loose hand-inked line work.

The strong version uses the *actual symbols of the medium* as the material of the metaphor. Aim for that.

### Step 4: worked examples (use these as shape, not literal copies)

- **Constraint-decay paper (LLM agents in back-end code)** → A frazzled cartoon engineer juggling labeled stacks of paper (FLASK, FASTAPI, DJANGO), the heaviest stacks tipping over, tiny sweat drops flying off the brow.
- **npm supply-chain attack** → A cartoon mailman opening a parcel marked with package version numbers, ink in the shape of a skull-and-crossbones seeping out of the wrapping paper onto the floor.
- **Memory now 2/3 of AI chip cost** → A tiny cartoon GPU character labeled COMPUTE getting squeezed flat between two giant crates stamped HBM, sweat popping off its head.
- **Agent-focused programming language** → A cartoon hand reaching forward, fingers shaped from punctuation glyphs (`{ }`, `< >`, `;`, `[ ]`, `( )`), the symbols slightly off-register like misaligned line work.
- **Go-to-Rust migration** → Two cartoon mechanics in greasy overalls hoisting a heavy riveted engine block labeled RUST onto a worn workbench, a leaky lighter engine labeled GO on the floor behind them, a wrench character watching from the corner.
- **Vendor folds three CLI tools into one agent platform** → A tailor stitching three half-finished cartoon coats together at the seams, one sleeve too short, one button hanging on a thread, the resulting garment labeled with the new product name on a sewn-in tag.
- **Coding agent retrospective from a real database company** → A cartoon mechanic with a clipboard checking off a long scroll of repairs on a steam engine labeled CLICKHOUSE, oil stains on the page, some items crossed out angrily.

These are illustrations of the *thinking*. Do not lift them verbatim if a different concrete scene serves the post better.

### Step 5: write the chosen metaphor as one sentence

Before assembling the prompt, write a single declarative sentence that names the scene. One subject. One action. One moment. Concrete nouns only. If you cannot do it in one sentence, the metaphor is still too abstract — go back to Step 1.

## Hook overlay rules

The hook is rendered IN-image as a text overlay; the exact treatment comes from the chosen style. It must stay legible at a glance — large, high-contrast, never decorative at the expense of readability. Compress it before rendering:

- Trim to 6 to 12 words.
- Strip quote marks, parentheses, em dashes, trailing punctuation.
- Keep the wording verbatim where possible. Do not paraphrase into something blander.
- Keep numbers — they survive image generation better than long words.
- All caps in the final overlay.

Example: `"A new paper benchmarks LLM coding agents on 100 back-end tasks across 8 web frameworks and finds something the leaderboard versions don't."` → `LLM AGENTS BROKE ON 100 BACK-END TASKS`.

## Styles

Two styles are supported. The metaphor/scene is identical across both (see Metaphor selection); only the rendering changes. For the **chosen** style, include its style spine, hook overlay block, and negative prompt block **verbatim**. Never mix blocks across the two styles. The aspect ratio suffix below is shared.

### sketch-on-white — black line drawing on white (default)

Style spine:

```
Minimalist hand-drawn sketch: clean black ink lines on a solid pure-white background.
Single-weight confident line work, loose expressive strokes, no color and no fill,
the look of a black marker or pen on white paper. High-contrast monochrome, one clear
focal subject with a strong readable silhouette, generous negative space, a few quick
cross-hatch marks only where depth demands them. The scene must read in milliseconds.
All characters are original designs, not based on any existing or trademarked property.
Composition framed like a notebook diagram with the hook hand-lettered in black
across the upper third.
```

Hook overlay block:

```
The hook text must be rendered IN-IMAGE as hand-lettered black marker lettering on
the white background. Loose hand-drawn display capitals, slightly uneven, the same
black line weight as the drawing. Single line if it fits, otherwise two centered lines.
All caps, large and high-contrast. Do not stylize the letters into illegibility. The
hook must be readable at a glance.
```

Negative prompt block:

```
Avoid: color of any kind, filled shapes, shading gradients, photorealism, 3D render,
neon, chrome, sepia, rubber-hose cartoon, halftone, watercolor, anime, manga, sticker
style, emoji, blurry text, garbled letters, busy backgrounds, clutter. The background
must stay solid white and the lines pure black. Do not depict or resemble any existing,
recognizable, or trademarked character, logo, or brand; all figures must be original.
Avoid the following clichés unless the post is literally about them: brains,
lightbulbs, gears, locks-and-keys, robot faces, magnifying glasses, chess pieces,
rockets, plain handshakes, dollar signs, and upward-pointing graph lines.
```

### sketch-on-black — white line drawing on black

Style spine:

```
Minimalist hand-drawn sketch: clean white ink lines on a solid pure-black background.
Single-weight confident line work, loose expressive strokes, no color and no fill,
the look of white chalk or a white marker on a blackboard. High-contrast monochrome,
one clear focal subject with a strong readable silhouette, generous negative space,
a few quick cross-hatch marks only where depth demands them. The scene must read in
milliseconds. All characters are original designs, not based on any existing or
trademarked property. Composition framed like a blackboard diagram with the hook
hand-lettered in white across the upper third.
```

Hook overlay block:

```
The hook text must be rendered IN-IMAGE as hand-lettered white chalk or marker
lettering on the black background. Loose hand-drawn display capitals, slightly
uneven, the same white line weight as the drawing. Single line if it fits, otherwise
two centered lines. All caps, large and high-contrast. Do not stylize the letters
into illegibility. The hook must be readable at a glance.
```

Negative prompt block:

```
Avoid: color of any kind, filled shapes, shading gradients, photorealism, 3D render,
neon, chrome, sepia, rubber-hose cartoon, halftone, watercolor, anime, manga, sticker
style, emoji, blurry text, garbled letters, busy backgrounds, clutter. The background
must stay solid black and the lines pure white. Do not depict or resemble any existing,
recognizable, or trademarked character, logo, or brand; all figures must be original.
Avoid the following clichés unless the post is literally about them: brains,
lightbulbs, gears, locks-and-keys, robot faces, magnifying glasses, chess pieces,
rockets, plain handshakes, dollar signs, and upward-pointing graph lines.
```

## Aspect ratio suffix (shared, append at the end so the model picks it up last)

- `landscape`:

  ```
  Aspect ratio 1.91:1, 1200 by 627 pixels, landscape orientation, composition
  laid out horizontally with the hook text across the top and the subject
  filling the lower two-thirds.
  ```

- `square`:

  ```
  Aspect ratio 1:1, 1080 by 1080 pixels, square composition, hook text
  occupying the upper third and the subject centered in the lower two-thirds.
  ```

- `portrait`:

  ```
  Aspect ratio 4:5, 1080 by 1350 pixels, portrait orientation optimized for
  mobile feed, hook text near the top quarter and the subject filling
  most of the vertical canvas.
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
style: sketch-on-white | sketch-on-black
hook_overlay: <THE COMPRESSED HOOK IN ALL CAPS>
metaphor: <single-sentence scene description from Step 5>
size: square | landscape | portrait
size_pixels: 1080x1080 | 1200x627 | 1080x1350
generated_at: <ISO timestamp>
---
```

The scraper may later append `post_url` and `post_path` to this frontmatter
when it matches the published post back to this concept. Do not author those by
hand; leave them for the scrape step.

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
Style: <sketch-on-white | sketch-on-black>
Size: <landscape | square | portrait> — <WIDTH> x <HEIGHT> (<ratio>)
Hook overlay: <THE HOOK IN ALL CAPS>
Metaphor: <one-sentence scene description>
Saved to: concepts/<YYYY-MM-DD>-<slug>/prompt.md
Linked from: drafts/<YYYY-MM-DD>-<slug>.md   (omit line in raw-hook mode)

Prompt:

<chosen style's style spine>

Subject: <one concrete tactile scene tied to the post>

<chosen style's hook overlay block>

<aspect ratio suffix>

<chosen style's negative prompt block>
```

No preamble. No explanation. Just print so the user can paste.

## Workflow

1. Resolve inputs:
   - If draft path: read the file, strip frontmatter, take first non-empty body line as raw hook, keep body for metaphor selection.
   - If raw text: use directly. Ask the user for a one-line topic summary if you cannot pick a metaphor without it.
   - If neither: ask once which draft or hook to use.
2. Resolve the style: if a style flag (`sketch-on-white`, `sketch-on-black`) is in args, use it. Otherwise prompt the user to choose one of the two; default to `sketch-on-white` if they decline.
3. Walk the metaphor selection steps (1 through 5). Refuse to settle on a banned cliché — re-read the body if the only metaphor that comes to mind is on the ban list.
4. Compress the hook to 6 to 12 words, all caps, no model-breaking punctuation.
5. Resolve the size flag (default `square`).
6. Assemble the prompt in the exact output format, using the chosen style's spine, hook overlay block, and negative prompt block.
7. Write `concepts/<date>-<slug>/prompt.md` with the frontmatter and body above.
8. If a draft path was provided, Edit the draft frontmatter to set `concept_path`.
9. Print the prompt block to stdout.

## Hard rules

- Always read the whole draft body before choosing a metaphor. Never pick from the hook alone.
- Always include the chosen style's full style spine, hook overlay block, and negative prompt block, plus the shared aspect ratio suffix, verbatim. Do not summarize. Never mix blocks across styles.
- Always render the hook in the image. The hook is the point, and it must be legible at a glance.
- The image must read in milliseconds: one clear focal subject, strong silhouette, no clutter or busy background. If the scene needs a paragraph to parse, it is too busy — simplify.
- Never write multiple alternative prompts. One prompt per invocation.
- Never describe the subject in abstract terms ("a metaphor for X"). Always concrete.
- Never claim the image was generated. This skill only emits and persists the prompt.
- Never pick a metaphor from the banned-cliché list without an explicit literal justification (the post is about a physical robot, an actual chess game, etc.).

## When NOT to use

- The user wants to actually call an image model. That is a separate step the user runs in their image tool.
- The user wants a style outside the two offered (sketch-on-white, sketch-on-black). Do not invent a new style spine. Tell them only these two are supported.
- The user wants concept art for an already-published post in `posts/`. Out of scope.
