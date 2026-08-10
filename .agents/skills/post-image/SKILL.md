---
name: post-image
description: 'Generate an image-generation prompt for a LinkedIn post in one of three selectable styles (a black sketch on white, a warm mid-century hand-drawn illustration, or a believable real-world photo with room for the hook) with the post''s hook rendered into the image as overlaid text. Prompts for the style when none is given. Always square — the project standardizes on 1:1 for every visual. Picks a tactile, content-specific metaphor by reasoning over the whole draft, always staging a subject in tension, never a generic stand-in or inert prop. Use when the user says "image for this post", "make a cover image", "generate the post image", "draw an image for X", or picks a draft to illustrate. Saves the prompt to `concepts/<date>-<slug>/prompt.md`, updates the draft''s `concept_path`, then calls OpenAI (`gpt-image-2`, if `OPENAI_API_KEY` is set) to render it to `images/<date>-<slug>/prompt.png`, and prints the prompt either way so the user can paste it into another image tool. Trigger phrases: "post-image", "cover image", "draw the post".'
---

# post-image

Build a complete, ready-to-paste image-generation prompt for one LinkedIn post. The post hook is rendered into the image as an overlay. The rendering style is one of three looks: **sketch-on-white** (black line drawing on white, the default), **hand-drawn** (a warm, textured mid-century-modern illustration), or **photo** (a believable, naturally-lit real-world photograph with a clean area reserved for the hook). The metaphor/scene is chosen the same way for all three; only the rendering descriptors change. Whatever the style, the image must read in milliseconds — one clear focal subject, no clutter — and the hook must be legible at a glance.

The two hand-drawn looks are deliberate: they pattern-interrupt a feed full of polished templates and stock photos, and read as something a person actually drew rather than generated, which sidesteps the reach penalty LinkedIn applies to obviously-AI imagery. The `photo` style is the opt-in alternative for when a real, candid scene lands the wedge harder than an illustration — it must look like an honest documentary photograph, never glossy AI-slop or stock-photo cliché (see its negative prompt). **The `photo` style is also the one exception to the in-image hook:** it renders no text and instead reserves a clean empty region where the user adds the hook by hand. The two hand-drawn styles still render the hook in-image as before.

This skill writes a prompt to disk, updates the draft to link to it, then renders it with OpenAI's `gpt-image-2` when `OPENAI_API_KEY` is set, saving the PNG into a gitignored `images/` folder that mirrors `concepts/`. If the key is not set (or generation fails), the prompt is still saved and printed — the user pastes it into Midjourney, GPT image, Imagen, Nano Banana, etc., and drops the resulting file into the same concept folder by hand.

## Office UI sync

This is the **illustrator** stage — emit `end` once `concepts/<date>-<slug>/prompt.md` is written, per [office-emit-end](../office-emit-end.md).

## Inputs

Two input modes. Accept whichever the user provides:

1. **Draft path** like `drafts/2026-05-25-a-new-paper-benchmarks-llm-coding-agents.md`. Read the file in full. Use the first non-frontmatter line as the raw hook. Use the whole body for metaphor selection. This is the path that lets the skill update the draft's `concept_path`.
2. **Raw hook text** typed directly. Use it verbatim. There is no body to reason over, so the metaphor selection step will require the user to provide a one-line topic summary.

Optional **style flag** as a token of args (`sketch-on-white`, `hand-drawn`, or `photo`). If absent, **prompt the user** to pick one of the three before assembling the prompt (see Workflow). Default to `sketch-on-white` only if the user declines to choose. When this skill runs inside `/post-cycle`, do not silently take the default — surface the style choice, since the style is the highest-leverage variable for whether the image stops the scroll.

Size is always **square**, 1200 × 1200, ratio 1:1 — the LinkedIn-accepted general-feed size (see [linkedin-image-specs](../linkedin-image-specs.md)). There is no size flag; do not ask the user to pick one.

The skill does not accept `posts/...` paths. Concept art is for new drafts only.

## Metaphor selection

This is the part that decides whether the image lands. Do it before writing any prompt text. It is **independent of the chosen style** — pick the scene first, then let the style pack supply the rendering descriptors. Keep the metaphor sentence rendering-neutral.

### Step 0: the scene must have a subject in tension (the scroll-stop rule)

The single most common failure is illustrating the *noun* instead of the *story*: an inert prop that is really a visual pun on a word in the post. An office chair for "per-seat pricing" is the canonical miss — it names the topic, has no face, no motion, no stakes, and the thumb scrolls past it.

Every scene must stage a **subject in a moment of tension**: a character, creature, or anthropomorphized object that is *doing something under pressure* — straining, panicking, juggling, getting squeezed, fleeing, breaking. It needs at least two of: a **face/expression**, **motion** (speed lines, falling, spilling, tipping), and **visible stakes** (something about to go wrong). Every worked example below has this; the chair did not.

Hard test before you proceed: name the subject and the verb. If the verb is "sits", "stands", "exists", or "represents", you have an inert prop — go back and find the actor and the action. A pun on a noun in the post is not a metaphor.

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
- **inert prop / pun on a noun → the topic**: an object that just *names* a word in the post (a chair for "seat", a fork for "fork", a bridge for "migration") with no actor and no action. Banned by Step 0. Put a character under stress *using* or *fighting* the object instead.

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

Then run the **scroll-stop gate** on that sentence before continuing:

- Does it name a subject with a face or a body doing something? If not, fail — it is an inert prop (Step 0).
- Is there motion or tension a thumb would catch mid-scroll? If not, fail.
- Could this exact sentence illustrate a different post in the same topic family? If yes, it is too generic — fail.

If any check fails, do not assemble the prompt. Return to Step 0 and rebuild the scene around an actor under pressure.

## Hook overlay rules

The hook is rendered IN-image as a text overlay for the two hand-drawn styles; the exact treatment comes from the chosen style. It must stay legible at a glance — large, high-contrast, never decorative at the expense of readability. (For the `photo` style the hook is **not** rendered — the user adds it by hand — but still compress it the same way and record it in the `hook_overlay` frontmatter so the manual placement is documented.) Compress it before rendering:

- Trim to 6 to 12 words.
- Strip quote marks, parentheses, em dashes, trailing punctuation.
- Keep the wording verbatim where possible. Do not paraphrase into something blander.
- Keep numbers — they survive image generation better than long words.
- All caps in the final overlay.

Example: `"A new paper benchmarks LLM coding agents on 100 back-end tasks across 8 web frameworks and finds something the leaderboard versions don't."` → `LLM AGENTS BROKE ON 100 BACK-END TASKS`.

## Styles

Three styles are supported. The metaphor/scene is identical across all three (see Metaphor selection); only the rendering changes. For the **chosen** style, include its style spine, hook overlay block, and negative prompt block **verbatim**. Never mix blocks across styles. The aspect ratio suffix below is shared.

### sketch-on-white — black line drawing on white (default)

Style spine:

```
Minimalist hand-drawn sketch: confident single-weight black ink lines on a solid
pure-white background, no color or fill, like a black marker on paper. One clear focal
subject with a strong silhouette and generous negative space. Reads in milliseconds.
All characters original. Hook hand-lettered in black across the upper third.
```

Hook overlay block:

```
Render the hook IN-IMAGE as hand-lettered black marker capitals, slightly uneven, same
line weight as the drawing. All caps, large, high-contrast, readable at a glance. One
line, or two centered lines if needed.
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

Hook overlay block:

```
Render the hook IN-IMAGE as hand-lettered display capitals across the upper third, in
the same hand-inked line as the illustration, one dark mid-century tone against the warm
paper. All caps, large, high-contrast, readable at a glance. One line, or two centered
lines if needed.
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

### photo — believable real-world photograph

Use when a real, candid scene lands the wedge harder than an illustration. It must look like an honest documentary or editorial photograph, never glossy AI-slop, neon, or stock-photo cliché. The metaphor rules still apply in full: stage a real subject in a moment of tension. **The photo style does NOT render the hook in the image** — the user adds the hook by hand afterward. The image only reserves a clean, empty region where that hook will go. This is the one style exception to the "always render the hook" rule.

Style spine:

```
Photorealistic editorial photograph, shot like honest documentary or press photography:
natural light, real materials and texture, shallow depth of field on a 35mm prime, focal
subject sharp against a soft background. A believable, candid, un-staged scene with one
clear subject caught mid-action in a moment of tension, and a deliberately clean empty
region (wall, sky, table, or floor) left for a hook added later. Honest color, no heavy
filters. Reads in milliseconds. Any people are original and unrecognizable.
```

Hook space block (no text is rendered — the user adds the hook manually):

```
Render NO text, lettering, captions, labels, or watermark anywhere. Leave the clean
region (upper third: plain wall, open sky, or dark window) completely empty and
unobstructed for a hook added by hand later. The only numerals allowed are ones that
physically belong to the scene (e.g. a real meter reading).
```

Negative prompt block:

```
Avoid: any overlaid or composited text, lettering, captions, or watermark; illustration,
cartoon, 3D, CGI, painterly looks, neon, cyberpunk, glossy over-processing, HDR halos,
plastic skin, AI-slop sheen, holograms, glowing UI, floating HUD panels, the
developer-at-a-laptop cliché, code spilling from a screen, busy backgrounds, clutter.
Keep it a believable, naturally-lit photo with honest texture and a clean empty area for
a hand-added hook. No real public figures, trademarked products, logos, or brands; people
original and unrecognizable. No cliché brains, lightbulbs, gears, locks-and-keys, robot
faces, magnifying glasses, chess pieces, rockets, plain handshakes, dollar signs, or
upward graph lines unless the post is literally about them.
```

## Aspect ratio suffix (append at the end so the model picks it up last)

```
Aspect ratio 1:1, 1200x1200, square; hook across the upper third, subject in the lower two-thirds.
```

For the `photo` style, reword `hook` to `the clean empty region` so the image is not nudged to render any lettering.

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
style: sketch-on-white | hand-drawn | photo
hook_overlay: <THE COMPRESSED HOOK IN ALL CAPS>
metaphor: <single-sentence scene description from Step 5>
size: square
size_pixels: 1200x1200
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

## Image generation

Once `prompt.md` is written, run:

```sh
bun run generate-image concepts/<YYYY-MM-DD>-<slug>
```

This calls OpenAI's `gpt-image-2` with the saved prompt, requesting a standard square image, and writes the finished PNG to `images/<YYYY-MM-DD>-<slug>/prompt.png` (a gitignored folder that mirrors `concepts/`). No cropping or resizing — the model is only ever asked for square, so the raw output is the final file.

- If `OPENAI_API_KEY` is not set, the command exits with `OPENAI_API_KEY is not set — skipped`. This is expected, not a failure — record it as `skipped` in the output and move on.
- If the command fails for any other reason (network, moderation, an unverified OpenAI org), surface the one-line error and record `failed` in the output. **Do not stop the skill or fail the run** — the prompt is already saved and the user can still paste it into an image tool by hand.
- Only report `generated` when the command actually printed `saved images/...`.

## Output format

Print exactly this, nothing else:

```
Style: <sketch-on-white | hand-drawn | photo>
Size: square — 1200 x 1200 (1:1)
Hook overlay: <THE HOOK IN ALL CAPS>
Metaphor: <one-sentence scene description>
Saved to: concepts/<YYYY-MM-DD>-<slug>/prompt.md
Image: images/<YYYY-MM-DD>-<slug>/prompt.png (generated) | skipped — OPENAI_API_KEY not set | failed — <one-line reason>
Linked from: drafts/<YYYY-MM-DD>-<slug>.md   (omit line in raw-hook mode)

Prompt:

<chosen style's style spine>

Subject: <one concrete tactile scene tied to the post>

<chosen style's hook overlay block — for `photo`, its hook space block instead>

<aspect ratio suffix>

<chosen style's negative prompt block>
```

No preamble. No explanation. Just print so the user can paste.

## Workflow

1. Resolve inputs:
   - If draft path: read the file, strip frontmatter, take first non-empty body line as raw hook, keep body for metaphor selection.
   - If raw text: use directly. Ask the user for a one-line topic summary if you cannot pick a metaphor without it.
   - If neither: ask once which draft or hook to use.
2. Resolve the style: if a style flag (`sketch-on-white`, `hand-drawn`, `photo`) is in args, use it. Otherwise prompt the user to choose one of the three; default to `sketch-on-white` only if they decline. Inside `/post-cycle`, surface the choice rather than taking the default silently.
3. Walk the metaphor selection steps (0 through 5), including the scroll-stop gate. Refuse to settle on a banned cliché or an inert prop — re-read the body if the only metaphor that comes to mind is on the ban list or has no actor under tension.
4. Compress the hook to 6 to 12 words, all caps, no model-breaking punctuation.
5. Assemble the prompt in the exact output format, using the chosen style's spine, hook overlay block, and negative prompt block.
6. Write `concepts/<date>-<slug>/prompt.md` with the frontmatter and body above.
7. If a draft path was provided, Edit the draft frontmatter to set `concept_path`.
8. Run `bun run generate-image concepts/<date>-<slug>` (see Image generation above). Record `generated`, `skipped`, or `failed`.
9. Print the prompt block to stdout, with the `Image:` line reflecting the outcome of step 8.

## Hard rules

- Always read the whole draft body before choosing a metaphor. Never pick from the hook alone.
- Always include the chosen style's full style spine, hook overlay block, and negative prompt block, plus the shared aspect ratio suffix, verbatim. Do not summarize. Never mix blocks across styles.
- The scene must stage a subject in tension (Step 0). Never ship an inert prop or a visual pun on a noun from the post. If the metaphor sentence's verb is "sits", "stands", "exists", or "represents", rebuild it.
- Always render the hook in the image for the two hand-drawn styles. The hook is the point, and it must be legible at a glance. The `photo` style is the sole exception: render no text and leave a clean region for the user to add the hook by hand.
- The image must read in milliseconds: one clear focal subject, strong silhouette, no clutter or busy background. If the scene needs a paragraph to parse, it is too busy — simplify.
- Never write multiple alternative prompts. One prompt per invocation.
- Never describe the subject in abstract terms ("a metaphor for X"). Always concrete.
- Only report the image as `generated` when `bun run generate-image` actually printed `saved images/...` — a missing key or a failed call is `skipped`/`failed`, never silently reported as success.
- A `skipped` or `failed` generation is never a reason to stop the skill — the prompt is already saved and usable on its own.
- Never pick a metaphor from the banned-cliché list without an explicit literal justification (the post is about a physical robot, an actual chess game, etc.).

## When NOT to use

- The user wants a style outside the three offered (sketch-on-white, hand-drawn, photo). Do not invent a new style spine. Tell them only these three are supported.
- The user wants concept art for an already-published post in `posts/`. Out of scope.
