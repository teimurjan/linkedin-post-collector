---
name: post-carousel
description: 'Generate the image-generation prompts for a multi-slide LinkedIn carousel from a `format: carousel` draft — one paste-ready prompt per slide, in a consistent hand-drawn visual system, with each tool''s pros/cons rendered in-image and a reserved blank band for the product logo. Use when a carousel draft is approved, the user says "carousel image", "slide prompts for this", "generate the carousel", or `post-cycle` reaches the visual step on a carousel draft. Writes an index `concepts/<date>-<slug>/prompt.md` plus `slide-NN.md` files, updates the draft''s `concept_path`, and prints each slide prompt for the user to paste into their image tool. Trigger phrases: "post-carousel", "carousel image", "slide prompts".'
---

# post-carousel

Build the complete set of ready-to-paste image-generation prompts for one LinkedIn **carousel** — a multi-slide comparison post (intro slide, one slide per tool/option, closing slide). It is the carousel sibling of [post-image](../post-image/SKILL.md): same metaphor discipline, same banned-cliché list, same hand-drawn looks that pattern-interrupt a templated feed — but it emits **N prompts**, one per slide, tied together by a single consistent visual system, with each tool's **pros and cons rendered in-image** and a reserved blank band where the user drops the product logo afterward.

This skill writes prompts to disk and updates the draft to link to them. It does not call an image model. The user pastes each printed slide prompt into their image tool (one generation per slide), then drops each result into the same concept folder and adds the logos by hand.

**Use this only for `format: carousel` drafts.** For a normal text post, use `post-image`.

## Office UI sync

This is the **illustrator** stage (the carousel branch of it) — emit `end` once the index `concepts/<date>-<slug>/prompt.md` is written, per [office-emit-end](../office-emit-end.md). Use `--stage illustrator --response-file concepts/<date>-<slug>/prompt.md`. There is no separate carousel stage; the index is named `prompt.md` so the dashboard finds it exactly as it finds a text post's concept.

## Inputs

1. **Draft path** like `drafts/2026-06-16-the-notebook-tools-i-actually-trust.md`. Required. Read the file in full. The draft must have `format: carousel` in its frontmatter and a per-slide body outline (intro, one `## Slide N — <Tool>` block per tool with `Pros:`/`Cons:` lists, a closing slide, and a `Caption:` block) as written by `post-writer`'s carousel path. If the draft is `format: text`, stop and tell the user to use `post-image` instead.

2. **Style flag** as a token of args (`sketch-on-white` or `hand-drawn`). If absent, **prompt the user** to pick one; default to `sketch-on-white`. Inside `/post-cycle`, surface the choice rather than taking the default silently — the visual system is the highest-leverage variable for whether the carousel stops the scroll. The **`photo` style is not offered for carousels**: a comparison carousel renders the title and pros/cons text in-image, and the photo style deliberately renders no text. If the user asks for photo, explain this and offer the two line-art styles.

Size is **forced to portrait 1080×1350** (the LinkedIn carousel/document format — see [linkedin-image-specs](../linkedin-image-specs.md)). Ignore any other size flag; note that carousels are always portrait, all slides identical size.

The skill does not accept `posts/...` paths. Concept art is for new drafts only.

## The visual system (what makes N images read as one carousel)

A carousel fails when the slides look like N unrelated images. Before writing any slide, fix a **visual system** every slide shares — write it as one sentence and record it in the index frontmatter (`visual_system`). It must pin down:

- **The recurring frame**: the same border/margins, the same title placement (top), the same two-column pros/cons layout on tool slides, the same logo band position (bottom).
- **The palette and line weight**: identical across slides (for `hand-drawn`, the same restrained mid-century palette; for `sketch-on-white`, the same single-weight black ink on white).
- **A recurring motif** that ties the set: e.g. the same little ink character acting as a guide on every slide, or the same desk/surface the tools sit on. Keep it simple — one motif, not a busy theme.

Every per-slide prompt repeats the visual-system sentence so the slides render consistently even though they are generated one at a time.

## The logo region

Every slide reserves a **blank band for the product logo**: bottom-center, roughly 1080×180px, kept completely empty — no text, no art, no border decoration inside it. This is the carousel analog of the `photo` style's reserved hook region. The user drops the real product logo there after generation (the image model must never attempt a real or trademarked logo). Record the band in the index frontmatter (`logo_region`) and repeat the "keep this band empty" instruction in every slide prompt.

## Per-slide content

Read the draft body and build one prompt per slide, in order:

- **Slide 1 — intro.** Role `intro`. Renders the **Slide-1 hook** (compressed per the hook overlay rules below) as the in-image title, plus a one-line framing of the comparison. The scroll-stop burden sits here: stage a subject in tension per `post-image`'s Step 0–5 (a character under pressure choosing between tools), built from the post's own materials, never a banned cliché.
- **Slides 2..N-1 — one per tool.** Role `tool`. Each renders the tool's title across the top and its **pros/cons in two columns** (a `+` column and a `–` column) pulled verbatim from the draft's `Pros:`/`Cons:` lists. Interior slides are information-dense, so the "subject in tension" rule is **relaxed** here: prioritize a clean, legible comparison and a small content-specific icon for the tool over a dramatic actor. Still no banned clichés, still no real logos.
- **Slide N — closing.** Role `closing`. Renders the closing takeaway/recommendation as the in-image title. May restage a light subject-in-tension if it lands the stance.

### Hook / title overlay rules (per slide)

The slide title is rendered IN-image (for both line-art styles). Compress it the same way `post-image` does:

- Trim the title to 6 to 12 words (tool slides: the tool name is the title, kept short).
- Strip quote marks, parentheses, em dashes, trailing punctuation.
- Keep wording verbatim where possible; keep numbers (they survive generation better than long words).
- All caps in the final overlay.

Pros/cons cells are rendered as short phrases (2 to 3 per side), legible at a glance at portrait size. Keep them in the draft's wording; do not invent claims the draft does not contain.

## Metaphor selection

Reuse `post-image`'s metaphor discipline (its Step 0–5 and the **banned-cliché list**) for the **intro** and **closing** slides, where a subject in tension does the scroll-stop work. For **tool** slides, the icon must still be content-specific and avoid the banned-cliché list (no brains, lightbulbs, gears, locks-and-keys, robot faces, magnifying glasses, chess pieces, rockets, plain handshakes, dollar signs, upward charts), but it does not need to be a dramatic actor — a clean, recognizable, original object that evokes the tool is enough. Never render a real product logo as the icon; the logo band is where the real logo goes later.

## Styles

Two styles are supported for carousels: **sketch-on-white** (default) and **hand-drawn**. The visual system and metaphor are identical across both; only the rendering descriptors change. For the chosen style, include its style spine and negative prompt block **verbatim** in every slide prompt and in the index. These are copied from `post-image` so the cliché ban and the hand-drawn look are identical across the two skills.

### sketch-on-white — black line drawing on white (default)

Style spine:

```
Minimalist hand-drawn sketch: confident single-weight black ink lines on a solid
pure-white background, no color or fill, like a black marker on paper. One clear focal
subject with a strong silhouette and generous negative space. Reads in milliseconds.
All characters original. Hook hand-lettered in black across the upper third.
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

### hand-drawn — warm mid-century-modern illustration

Style spine:

```
Hand-drawn illustration in a warm 1960s mid-century-modern style: sleek organic curves,
clean confident lines with a lightly textured hand-sketched feel, on warm off-white
paper. Restrained muted palette (mustard, teal, burnt orange, ochre, cream) used
sparingly, subtle paper grain. One clear focal subject with a strong silhouette and
generous negative space. Reads in milliseconds. All characters original. Hook
hand-lettered across the upper third.
```

Negative prompt block:

```
Avoid: photorealism, 3D, neon, chrome, glossy gradients, harsh saturated color,
halftone, watercolor bleed, anime, emoji, blurry or garbled text, busy backgrounds,
clutter. Keep the palette muted, the paper warm, the texture subtle. No real or
trademarked characters, logos, or brands; all figures original. No cliché brains,
lightbulbs, gears, locks-and-keys, robot faces, magnifying glasses, chess pieces,
rockets, plain handshakes, dollar signs, or upward graph lines unless the post is
literally about them.
```

## In-image text rendering block (carousel, per slide)

Append this to each slide prompt (reword "hook" as appropriate per role), in the chosen style's lettering:

```
Render the slide title IN-IMAGE as hand-lettered capitals across the top, large,
high-contrast, readable at a glance. On tool slides, render the pros under a "+" column
on the left and the cons under a "–" column on the right, each as 2 to 3 short
hand-lettered lines, evenly spaced and legible at portrait size. Keep the bottom band
(about 1080x180) completely empty — no text, no art — reserved for a product logo added
later. Keep the same frame, margins, palette, and line weight as the other slides in the set.
```

## Aspect ratio suffix (shared, append last)

```
Aspect ratio 4:5, 1080x1350, portrait for mobile; title across the top, the comparison
filling the middle, the empty logo band across the bottom.
```

## Persistence

This skill writes to disk before printing.

### Concept folder

For a draft at `drafts/<YYYY-MM-DD>-<slug>.md`, write to:

```
concepts/<YYYY-MM-DD>-<slug>/
  prompt.md        # the INDEX (this file is what concept_path points at)
  slide-01.md      # intro
  slide-02.md      # tool A
  ...
  slide-NN.md      # closing
```

Create the folder if it does not exist. Overwrite existing files on a re-run. **The index file must be named exactly `prompt.md`** — the dashboard (`src/office/server/agents.ts`) and the scraper (`src/scraper/concepts.ts`) both key off that name, so a different name silently breaks both. `concept_path` always points at this index.

### Index `prompt.md` frontmatter

```yaml
---
draft_file: drafts/<YYYY-MM-DD>-<slug>.md
format: carousel
style: sketch-on-white | hand-drawn
size: portrait
size_pixels: 1080x1350
slide_count: <N>
hook_overlay: <SLIDE 1 HOOK IN ALL CAPS>
visual_system: <one sentence: the recurring frame, palette, and motif tying the slides together>
logo_region: bottom-center reserved band ~1080x180px, kept empty on every slide
slides:
  - slide-01.md
  - slide-02.md
  - ...
generated_at: <ISO timestamp>
---
```

Keep `hook_overlay` set to Slide 1's compressed hook — the dashboard reads it to title the illustrator card. The scraper may later append `post_url` and `post_path` to this frontmatter; do not author those by hand.

### Index `prompt.md` body

The body documents the carousel as a whole:

- The chosen style's **style spine verbatim**.
- The chosen style's **negative prompt block verbatim**.
- The **visual-system** paragraph (the recurring frame, palette, motif, logo band).
- A short **slide manifest**: a one-line summary of each slide (role + title) in order.

### Per-slide `slide-NN.md`

Each slide file is self-contained and paste-ready. Frontmatter:

```yaml
---
slide: <N>
role: intro | tool | closing
title: <SLIDE TITLE IN ALL CAPS>
tool_name: <only for role: tool>
pros:
  - <short phrase>
cons:
  - <short phrase>
---
```

Body (the paste-ready prompt), assembled in this order:

1. The chosen style's **style spine** (verbatim — so the file stands alone when pasted).
2. **Subject**: for `intro`/`closing`, the metaphor scene (subject in tension); for `tool`, a clean content-specific icon for the tool plus the comparison layout.
3. The **in-image text rendering block** above (title + pros/cons two-column for tool slides; title only for intro/closing).
4. The **visual-system** sentence (so this slide matches the others).
5. The **aspect ratio suffix**.
6. The chosen style's **negative prompt block** (verbatim).

### Draft linkage

Update the draft frontmatter:

```yaml
concept_path: concepts/<YYYY-MM-DD>-<slug>/prompt.md
```

Point it at the index, never at a slide file. Use Edit, not Write — preserve the rest of the frontmatter and the body verbatim. Overwrite an existing `concept_path`.

## Output format

Print the index summary, then each slide prompt in order, each clearly delimited so the user can paste them one at a time:

```
Style: <sketch-on-white | hand-drawn>
Size: portrait — 1080 x 1350 (4:5)
Slides: <N>
Visual system: <one-sentence recurring frame/palette/motif>
Saved to: concepts/<YYYY-MM-DD>-<slug>/ (index prompt.md + N slide files)
Linked from: drafts/<YYYY-MM-DD>-<slug>.md

--- SLIDE 01 (intro) ---

<full slide-01 prompt body>

--- SLIDE 02 (<Tool A>) ---

<full slide-02 prompt body>

...

--- SLIDE NN (closing) ---

<full slide-NN prompt body>
```

End with one line: generate one image per slide, add each product logo into the empty bottom band, then combine the slides in order into a single PDF (portrait 1080×1350) and upload it to LinkedIn as a document post. No other preamble or explanation.

## Workflow

1. Read the draft in full. Confirm `format: carousel`; if not, stop and point the user to `post-image`.
2. Parse the per-slide outline: the Slide-1 hook + framing, each tool's pros/cons, the closing line. Count the slides → `slide_count`.
3. Resolve the style: `sketch-on-white` (default) or `hand-drawn`. Inside `/post-cycle`, surface the choice. Refuse `photo` with the reason above.
4. Fix the **visual system** (recurring frame, palette, motif, logo band) and write it as one sentence.
5. For the intro and closing slides, run `post-image`'s metaphor steps (0–5) including the scroll-stop gate; refuse banned clichés and inert props. For tool slides, pick a clean content-specific icon (relaxed tension rule) that avoids the cliché list and any real logo.
6. Compress each slide title to 6–12 words, all caps; keep pros/cons as short verbatim phrases.
7. Write `concepts/<date>-<slug>/prompt.md` (index) and `slide-NN.md` for every slide.
8. Edit the draft frontmatter to set `concept_path` to the index.
9. Print the index summary and every slide prompt, delimited.

## Hard rules

- Only for `format: carousel` drafts. Send text posts to `post-image`.
- The index file is always named `prompt.md` and `concept_path` always points at it. Never rename it or point the draft at a slide file.
- Always portrait 1080×1350. Ignore other size flags.
- Include the chosen style's full style spine and negative prompt block verbatim in the index and in every slide file. Never mix the two styles. Never offer `photo` for a carousel.
- Every slide reserves the same empty logo band. Never render a real or trademarked product logo — the user adds it later.
- Pros/cons must come from the draft. Never invent claims, version numbers, benchmarks, or incidents the draft does not contain.
- Every slide shares the visual system (frame, palette, motif, line weight) so the set reads as one carousel.
- Intro and closing slides stage a subject in tension and avoid banned clichés; tool-slide icons are content-specific and never a banned cliché or a real logo.
- Each slide must read in milliseconds at portrait size: title, two short pros/cons columns, one icon, empty logo band. If a slide needs a paragraph to parse, it is too busy — cut cells.
- Never claim the images were generated. This skill only emits and persists the prompts.

## When NOT to use

- The draft is a normal text post (`format: text` or no `format`). Use `post-image`.
- The user wants to actually call an image model. That is a separate step they run in their image tool.
- The user wants a style outside the two offered (sketch-on-white, hand-drawn). Do not invent a new style spine; `photo` is not offered for carousels.
- The user wants concept art for an already-published post in `posts/`. Out of scope.
