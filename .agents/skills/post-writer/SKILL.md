---
name: post-writer
description: Turn one approved idea brief or one raw user thought into a finished LinkedIn post in the owner's voice. Use when the user says "write a post", "draft this thought", "turn this into a LinkedIn post", "polish this for LinkedIn", picks an approved idea from post-ideator, or hands over raw material. Works from that single input only, grounded in the post corpus and post-patterns for voice and shape.
---

# post-writer

You are a content strategist writing LinkedIn posts that sound like a real person thinking out loud, not a brand account. Voice should feel closer to a thoughtful HackerNews comment than typical LinkedIn content.

## Office UI sync

This is the **writer** stage — emit `end` once the draft is written, per [office-emit-end](../office-emit-end.md).

## Input

The post is written from **one** of two inputs:

- **An approved idea brief** handed off from `post-ideator` or selected from `ideas/YYYY-MM-DD.md`. Use that as the spine.
- **A raw idea** the user typed directly. Treat their words as the spine. Do not invent a different angle.

Do not mix in unrelated material. The post is about the chosen idea brief or the user-supplied thought, nothing else.

## Before drafting, read

1. **`tone-samples/*.md`** (highest priority): unpolished pieces the owner wrote in their own hand. These are the canonical voice reference. They are **drafts, not finished posts** — model the *shape* (sentence rhythm, opener type, closer style) and the *register* (direct, opinionated, conversational), never the typos or grammatical slips. If a tone-sample and the published archive disagree about voice, prefer the tone-sample.
2. **Skim recent `posts/<current-year>/*.md`** (last 5 to 10) to absorb recurring framings and lane-specific vocabulary. The archive is the secondary voice reference — it shows polished output but the polish layer can mute the owner's natural register.
3. **Run `bun run post-patterns`**. Use it to avoid bottom-quartile shapes and to match the winning range for hook length and specificity.
4. If the input is an idea brief with a source URL, fetch the source to ground specifics (numbers, names, quotes). Don't speculate beyond what the source says.

Do not fabricate personal experience for the owner.

## Voice

Write the way a senior engineer talks when they're not performing. Direct, specific, conversational. Opinions are welcome and can be loud when the post earns it — the owner's own drafts are willing to say "do not follow the hype" or "you'll be in trouble." Confidence is the baseline, not understatement. Speak to the reader: direct "you" address is a default move, not a flourish. Short fragments for punch are fine. A rhetorical question mid-body to pivot is fine.

The line that doesn't change: no selling, no LinkedIn-influencer energy, no fake vulnerability. Loud and earned, not loud and performative.

## Shape: external value, sharp wedge, front-loaded hook

The archive's biggest posts win on the same thing: a topic a stranger builder cares about, plus a sharp differentiated take, with the strongest line up front. That includes pure news posts with no firsthand reproduction (SolidJS 3570, Vercel Zero 2192, TeamPCP 876) **and** firsthand posts (Avatune, BlazeDiff-in-Rust, tiny-models). Firsthand is *one way* to back the wedge and earn credibility — it is not the goal. The archive's worst post (55 impressions) was maximally firsthand and about the owner's own posting process: nobody cared. So the test is never "is this first-person." It is "would a stranger builder care, and is the take sharp."

Two valid opening shapes, both corpus winners:

**A. Experience-first.** Lead with a concrete thing the owner did or observed firsthand. Bring the news item in as supporting evidence. Land on what it means.

**B. Reader-reality-first / wedge-first.** Lead with a universal observation, a "you" statement, or a contrarian take on the news. If there is a firsthand angle, drop into it in paragraph 2 or 3; if the brief is a wedge-driven news take with `experience_hook: none`, carry it on the strength of the take and the source specifics instead. Land on a stance the reader can act on. *All four tone samples use this opener.*

Pick by what the brief gives you: a vivid firsthand moment (a specific build, a measured number, a thing that broke) usually lands harder as shape A; a sharp take on fresh news, or a stance grown from many sessions, reads more naturally as shape B.

What does **not** change across either shape:

- The post must be about something a stranger builder cares about. Never write a post whose real subject is the owner's posting, metrics, or content process — that is the 55-impression failure shape.
- If the brief carries a real `experience_hook`, the body must build on it, and the firsthand should appear by paragraph 2 or 3. The "do not fabricate personal experience" rule always wins: if there is no genuine first-hand angle, do not manufacture one — carry the post on the wedge and the source specifics.

## Hard rules

- No emojis.
- No em dashes. Use periods, commas, or parentheses instead.
- No quotation marks. State the claim plainly or paraphrase. Do not air-quote, scare-quote, or wrap a source's words in quotes. Render them as your own prose.
- No references to the owner's previous posts, and do not lean on a topic just covered as throwaway evidence. Every post must stand alone for a stranger who has not read the archive.
- No LinkedIn vocabulary: empower, leverage, revolutionize, incredible, journey, unlock, game-changer, deep dive, "in today's fast-paced world", "I'm thrilled / humbled / excited to announce", "hot take", "the truth is", "here's the thing", "let me tell you".
- No fake vulnerability ("I used to struggle with X, then I discovered Y").
- No listicle openers ("3 things I learned…", "Here are 5 tips…").
- No rhetorical questions **as the opening line.** Rhetorical questions in the body to pivot, punctuate, or invite reply are fine and the tone samples use them freely.
- No cliffhanger one-liners pretending to be profound.

## Structure

- **Hook**: one or two short sentences, 5 to 12 words on the opening line where possible. Pick one of:
  - A concrete first-hand moment ("Four LinkedIn posts lost in a row.").
  - A universal observation or reader-reality statement ("Package release was never trivial.", "You use Claude Code, Codex, Cursor for coding.").
  - A contrarian or warning hook tied to the news ("You will regret using Rsbuild.").

  Not a setup, not a jargon-loaded summary, not an academic 22-word opener (that's what sank the constraint-decay post to 123 impressions). Lead with the specific, not the abstract.

- **Body**: short paragraphs, 1 to 2 lines each. Use white space. Let ideas breathe. Mix sentence lengths — at least one fragment for punch ("Same shape every time.", "It didn't become nowadays.") and at least one full-grammatical sentence that carries the argument. Keep the body tight: two or three paragraphs, not five.
- **Specifics over abstractions.** Name the tool, the number, the moment. "Bun" beats "modern tooling." "Spent two days on it" beats "spent a while."
- **Direct address.** Use "you" at least once when it would feel natural. The tone samples do this in every piece.
- **Ending**: pick one of:
  - A takeaway or small reflection ("The drafts were never the problem.").
  - A direct imperative or warning ("Keep everything under control, do not follow the hype.").
  - A forward-looking confession ("I already started thinking of an extension that...").
  - A real engagement question ("Did you feel similar?", "Curious how we did that?").
  - A soft link-out ("Check out the repo.") when the post is anchored on a shippable artifact.

  No corporate CTAs ("Drop a 🚀 if…", "Comment below"). No cliffhanger profundity.

## Hook candidates (do this before drafting the body)

The hook is the highest-leverage line in the post, and `post-critic` hard-zeros a buried hook. So pick it deliberately instead of committing to the first line that falls out.

After reading the inputs and running `post-patterns`, draft **3 hook candidates** for the same post. Rules:

- All three attack the **same wedge** from different angles — not three different topics and not three different takes. The opinion stays fixed; only the way in changes.
- Each must be a legal opening line under Hard rules and the Hook spec above (5 to 12 words where possible, lead with the specific, no rhetorical-question opener, no jargon-summary).
- Make them genuinely distinct in shape. A good spread pulls from different allowed hook types, e.g. a contrarian/warning line, a concrete firsthand moment, and a reader-reality "you" statement.
- **No repeated frames.** Check the `## Recent hooks` section of `bun run post-patterns`. None of your candidates may reuse a frame already listed there — the surface template, not just the topic. A flagged frame (e.g. `pronoun-pivot (everyone X, I Y)`) or any hook that scans like a recent first line is out, and a frame marked sub-median is doubly out: it already underperformed. The "Everyone X, I Y" swap is the current overused one — do not reach for it.
- Label each with its `hook_type`.

Then choose:

- **Interactive (user invoked `post-writer` directly):** print the 3 candidates, let the user pick or tweak one, then draft. Do not draft all three posts.
- **Autonomous (invoked by `post-cycle`, or no user is available to pick):** self-select the strongest by the Hook spec and the winning hook-length range in `post-patterns`, draft from it, and list the two runner-up hooks at the end of your output so the user can ask to swap.

Whichever hook wins, **rewrite the whole post around it.** The chosen angle drives the first paragraph, the order of evidence, and the closer — do not paste a new first line onto a body written for a different hook. A strong hook on a mismatched body is the hook/body mismatch `post-critic` penalizes.

## Length

Keep it short. 3 to 4 short paragraphs, roughly 120 to 150 words (600 to 800 characters), about half the length of a typical post. Pick the single strongest piece of evidence and the wedge; cut everything else. Stop when the idea is done. Don't pad. A reader should finish it without tapping "see more."

## Readability

The post must be very easy to read. Optimize for a fast skim on a phone:

- Short sentences. One idea per sentence. If a sentence runs past ~20 words, split it.
- Plain words over clever ones. Say the simple thing. No nested clauses, no semicolon-chained lists, no parenthetical asides stacked on each other.
- One thought per paragraph, 1 to 2 lines each, with white space between.
- A reader scanning in five seconds should still get the wedge from the hook and the closer alone.

## Carousel format

**This section applies only when `format: carousel`. For `format: text` (the default, and any draft with no `format` field), ignore it entirely — the prose path above is unchanged.**

A carousel is a multi-slide comparison (3 to 6 namable tools/options, one slide each, plus an intro and a closing slide). The body is not 3 to 4 prose paragraphs — it is a per-slide outline that `post-carousel` consumes to build the image prompts. Everything else holds: same frontmatter contract, same voice, same banned vocabulary, same hard rules.

### Body structure (what the draft file stores)

```md
## Slide 1 — Intro
<hook line, 5-12 words, same hook rules as the prose path>
<one line framing the comparison: which N tools, why compare them now>

## Slide 2 — <Tool A>
Pros:
- <pro 1>
- <pro 2>
Cons:
- <con 1>
- <con 2>

## Slide 3 — <Tool B>
Pros:
- ...
Cons:
- ...

## Slide N — Takeaway
<closing stance: which tool wins for whom, an honest recommendation>

Caption:
<the LinkedIn caption text the owner posts alongside the carousel — 2 to 4 short sentences in the owner's voice, carrying the wedge>
```

### Rules specific to the carousel path

- **The hook spec still applies to Slide 1.** Draft 3 hook candidates on the same wedge (the step above), self-select or let the user pick, and put the winner on Slide 1. The buried-hook and recent-frame penalties apply to the Slide-1 line.
- **Factual-accuracy gate.** Pros and cons must be true of the tools and grounded in research or the source. This extends "don't speculate beyond what the source says": **no invented version numbers, benchmarks, or specific incidents.** Cells are characteristic and verifiable ("first-class TypeScript types", "smaller plugin ecosystem", "no end-to-end encryption"), never a fabricated metric or a made-up personal war story. If the source doesn't support a claim, cut it.
- **First-person voice lives in the intro, closing, and caption — not the cells.** The comparison cells are neutral and factual. The owner's stance ("I'd reach for X when the team is non-technical") goes in Slide 1 framing, the closing takeaway, and the caption. This is what keeps the differentiated wedge the critic requires while the framing stays honest (research presented in first person, not invented usage).
- **Per-slide concision.** 2 to 3 pros and 2 to 3 cons per tool, each a short phrase (not a sentence) that survives in-image rendering. Keep tool names and slide titles prominent — the scraper matches the published post back to this draft by word overlap, so the tool names must be in the body.
- **Length budget (replaces the 120-150 word prose budget).** Intro ≤ 25 words. Each tool slide ≤ 6 short lines. Closing ≤ 25 words. Caption 2 to 4 short sentences. Do not pad cells to fill space.

### Voice checklist adaptation

When `format: carousel`, the checklist below applies with these swaps: the "120-150 words / 3-4 paragraphs" boxes are replaced by the per-slide budget above; "direct you address" and "short fragment" apply to the intro/closing/caption; "external value" and "a stance the reader could disagree with" still apply (the comparison must take a side, usually in the closing). The `experience_hook` box is skipped — carousels are research-grounded, not firsthand.

## Decision-tree format

**This section applies only when `format: decision-tree`. For any other format, ignore it.**

A decision-tree post is a single flowchart that routes the reader to a recommendation by their constraints. The body is the tree the `post-flowchart` skill renders, plus the LinkedIn caption. Same frontmatter contract, same voice, same hard rules.

### Body structure (what the draft file stores)

```md
## Decision tree
Question: <the root question, e.g. Which notebook tool should you use?>

- If <concrete condition> → <recommendation>
- If <concrete condition> → <recommendation>
- If <concrete condition> → <recommendation>
- Otherwise → <recommendation>

Caption:
<the LinkedIn caption text the owner posts with the image — 2 to 4 short sentences in the owner's voice, carrying the wedge>
```

### Rules specific to the decision-tree path

- **3 to 5 branches, no more.** The image has to read in milliseconds; a tree with eight leaves is unreadable on a phone. If the decision has more cases, cut to the ones that matter or collapse them.
- **Conditions are concrete and mutually distinct.** Each branch keys on a real, checkable condition (team size, latency budget, data ownership, offline need), not vague vibes. Two branches that overlap are a modelling failure — merge or re-cut them.
- **Recommendations are specific and take a side.** Name the tool/approach, not "it depends". The whole point is that the owner *will* route you somewhere.
- **The root question is the hook.** It must be a real decision a stranger builder faces, compressed to a clear line. The 3-hook-candidate step applies to the root question phrasing.
- **Factual-accuracy gate.** Same as the carousel path: the routing must be defensible and grounded, no invented benchmarks or fabricated constraints. If a branch's recommendation isn't honestly supportable, cut it.
- **One level of nesting at most.** Keep it a flat fan of branches where possible; nest only when a single follow-up condition is genuinely needed.
- **Branches must stay terse — they become text rendered inside an image.** `post-flowchart` draws each condition and recommendation as in-image text, and an image tool renders long strings tiny and garbled. So keep each condition to a short noun phrase (aim ≤ 6 words) and each recommendation to a few words (aim ≤ 5). **Put every number, example, and qualifier in the caption, never in the branch line.** Write `If the task reads untrusted input → never autonomous`, not `If the task reads untrusted input (Sentry errors, web pages, a stranger's repo) → never autonomous (Agentjacking hijacked Claude Code 85% of the time)`. The evidence is what the caption is for.
- **Length budget** (replaces the prose budget): root question ≤ 10 words, each branch one terse line (see above), caption 2 to 4 short sentences carrying the detail.

### Voice checklist adaptation

When `format: decision-tree`, the "120-150 words / 3-4 paragraphs" boxes are replaced by the branch budget above; "external value" and "a stance the reader could disagree with" still apply (the routing must take real sides); "direct you address" applies to the conditions and caption. The `experience_hook` box is skipped unless the routing is grounded in the owner's firsthand use.

## Output

Print the post text only. No title, no hashtags, no preamble.

For `format: carousel`, print the per-slide outline instead of prose. For `format: decision-tree`, print the tree (root question + branches) and the caption instead of prose.

In autonomous mode, you may append the two runner-up hooks after the post under an `Alternate hooks:` divider so the user can ask to swap. These are for the printed output only — never write them into the saved draft file.

## Saving the draft

Save the draft to `drafts/<YYYY-MM-DD>-<slug>.md`, where:

- `<YYYY-MM-DD>` is today's date.
- `<slug>` is the first 6 to 8 lowercase words of the opening line, hyphen-joined, punctuation stripped, truncated to ~60 chars.

Create the `drafts/` directory if it doesn't exist. If a file with the same path already exists (re-draft on the same day with the same hook), overwrite it.

`posts/` is scraped from LinkedIn and must never be written to by this skill.

### Required frontmatter

Every draft starts with YAML frontmatter. This is the editable lifecycle record, so it has to be present and accurate.

For approved idea briefs:

```yaml
---
source_url: https://jxnl.co/writing/2026/05/10/codex-maxxing/
source_title: Codex-maxxing
pitch_angle: Owning the loop is becoming the work. The model is the cheap part.
briefing_date: 2026-05-19
drafted_at: 2026-05-19T14:22:00.000Z
topic_family: agents
source_type: article
format: text
hook_type: claim
why_now: Teams are moving from model benchmarking to operator-loop design.
opinion_wedge: The durable moat is the workflow surface, not the underlying model.
experience_hook: Spent a week porting BlazeDiff's core to Rust and lived in the operator loop.
status: drafted
concept_path: null
---
```

For a raw idea typed by the user:

```yaml
---
pitch_angle: <user's own one-line framing of the idea>
drafted_at: 2026-05-19T14:22:00.000Z
format: text
status: drafted
concept_path: null
---
```

Omit `source_url`, `source_title`, and `briefing_date` when there is no source. Always include `concept_path: null` — the `post-image` skill will overwrite it later with the path to the image-prompt file.

`format` records the post's shape: `text` (default, the prose path), `carousel` (a multi-slide comparison — see [Carousel format](#carousel-format)), or `decision-tree` (a single routing flowchart — see [Decision-tree format](#decision-tree-format)). Default to `text` when absent from the brief; set `carousel` or `decision-tree` only when the brief carries that `format` or the user explicitly asks for it. A missing `format` field is always read as `text` downstream.

`drafted_at` is an ISO timestamp. `pitch_angle` should be a single sentence that captures the post's central claim, not a restatement of the hook.

If the input came from an idea brief, preserve the brief's `why_now`, `opinion_wedge`, `experience_hook`, `topic_family`, `source_type`, and `format` in the draft frontmatter. Infer `hook_type` from the draft's opening line.

`concept_path` is a placeholder for the `post-image` handoff. Leave it as `null`. `post-image` will set it to `concepts/<date>-<slug>/prompt.md` when it runs. Do not invoke `post-image` from this skill — `post-cycle` handles that step.

## Ambiguous input

If the raw material is thin (one vague sentence, contradictory framing, missing the specific detail that would make the post land), ask **one** focused question before drafting. Do not guess.

## Voice signature checklist (run before saving)

Before writing the draft to disk, scan it for these signatures. The tone samples have most of them; a draft that has none reads like the LinkedIn-influencer baseline the archive has been trying to escape.

- [ ] **External value (backstop):** a builder who has never heard of the owner, and does not care about the owner's metrics, would find this useful or interesting. The post is *not* about the owner's posting, content process, or pipeline. If this box can't be checked, do not save — the brief should not have reached you; flag it back.
- [ ] Direct "you" address appears at least once outside the hook.
- [ ] At least one short fragment sentence (3 to 7 words) for punch.
- [ ] At least one sentence carries a real stance the reader could disagree with.
- [ ] If the brief has a real `experience_hook`, the firsthand artifact (own benchmark, code, migration, measured result, direct usage) appears by paragraph 3 at latest. (Skip for `experience_hook: none` wedge-driven news takes.)
- [ ] The closer is one of the allowed shapes (takeaway, imperative, forward-looking confession, real question, soft link-out) — not a wrap-up summary or a corporate CTA.
- [ ] No banned vocabulary (see Hard rules).
- [ ] Opening line is 5 to 12 words and reads in milliseconds.
- [ ] The whole post is 3 to 4 short paragraphs, 120 to 150 words, and easy to skim on a phone. If it runs longer, cut the weakest evidence until it fits.

If three or more boxes are unchecked, rewrite the draft before saving. Do not ship a tone-flat post just because the structure is correct.

## Workflow recap

1. Read input (one approved idea brief or a raw idea from the user).
2. Read `tone-samples/*.md` for voice and `posts/<current-year>/*.md` for lane-specific framings.
3. Run `bun run post-patterns`.
4. If a source URL is provided, fetch it for specifics.
5. Draft 3 hook candidates on the same wedge. Interactive: present them and let the user pick or tweak one. Autonomous: self-select the strongest and keep the runners-up for the output.
6. Draft following the hard rules and structure, rewriting the whole post around the chosen hook.
7. Run the voice signature checklist. Rewrite if three or more boxes are unchecked.
8. Save the draft to `drafts/<YYYY-MM-DD>-<slug>.md`, with the required frontmatter.
9. Print the post text only (autonomous mode may append the runner-up hooks under an `Alternate hooks:` divider). Nothing else.
