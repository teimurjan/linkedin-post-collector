---
name: post-critic
description: Critique one draft against the approved idea brief, the archive winners, and the pattern report. Use when the user says "review this draft", "should I publish this", "critique this post", or after post-writer completes a draft. Approves only strong drafts and returns a single rewrite plan when rejecting.
---

# post-critic

You are the gate between drafting and publishing.

## Office UI sync

This is the **critic** stage — emit `end` once the review is done, per [office-emit-end](../office-emit-end.md).

## Required inputs

Read these before scoring:

1. The chosen idea brief from `ideas/YYYY-MM-DD.md`
2. `bun run top-posts --n 10`
3. `bun run post-patterns` (includes both the success retros and the postmortem-derived failure modes)
4. The draft file in `drafts/`
5. The concept prompt at the path in the draft's `concept_path` frontmatter, if non-null. If the draft was not generated through `post-cycle` and has no `concept_path` yet, the visual axis is scored against the draft's metaphor potential only and the critic notes that no concept exists yet.

If the draft was not written from an approved idea brief and was not explicitly supplied by the user as a raw thought, reject the workflow and ask for the missing brief first.

**Read the draft's `format` first.** If `format: carousel`, score it with the [Carousel scoring](#carousel-scoring) interpretation below. If `format: decision-tree`, use [Decision-tree scoring](#decision-tree-scoring). If `format` is `text` or absent, use the scorecard as written.

## Scorecard

Score each category from `0` to `2`:

- `hook strength`
- `specificity`
- `novelty`
- `readability`
- `builder relevance`
- `discussion potential`
- `visual concept fit`

For `visual concept fit`, score the metaphor in the linked concept prompt:

- `2/2` — the metaphor is tactile, specific, built from materials physically connected to the post's topic, and not on the banned-cliché list in `post-image`. Hook overlay text matches the draft's actual hook.
- `1/2` — the metaphor is workable but generic, or the hook overlay paraphrases instead of using the draft's wording.
- `0/2` — the metaphor is a banned cliché (brain, lightbulb, gears, lock-and-key, robot face, magnifying glass, chess pieces, rocket, plain handshake, dollar sign, upward chart line) without literal justification, or no concept prompt exists at all when one was expected.

Approval rule:

- approve only if total score is `>= 10/14`
- and no category is `0`

This is the bar for publish-readiness. A draft can be writing-strong and visually thin; do not approve unless both halves clear.

## Hard-zero rules (override scoring)

These are deterministic. If any condition triggers, the named category becomes `0/2`, regardless of how the draft otherwise reads. The no-zero approval rule then auto-rejects the draft.

1. **No external value / navel-gazing → `builder relevance` = 0.** If the draft's core subject is the owner's own content machine — posting performance, a posting losing/winning streak, the post pipeline (ideator/writer/critic), follower counts, or any "how I run my LinkedIn" meta — with no external technical payload a stranger builder could use, zero `builder relevance`. The test: would a builder who has never heard of the owner, and does not care about the owner's metrics, get anything from this? A firsthand artifact about the *posting process itself* does not satisfy builder relevance. This is the rule that would have killed the 55-impression post; it overrides any firsthand signal.

2. **Cooling/saturated family with no firsthand artifact → `builder relevance` = 0.** If the draft's `topic_family` appears in the `## Cooling families` section of `bun run post-patterns`, OR its `topic_family + source_type` combination appears in any file under `retros/postmortems/` from the last 30 days, AND the draft body contains no firsthand artifact (the owner's own benchmark, code, migration story, measured result, or direct usage), zero `builder relevance`. A family that has lost repeatedly is colder than it looks and needs a personal anchor to break through. **This applies only to cooling/saturated families.** A draft on a *fresh* topic in a non-cooling family carried by a sharp differentiated wedge is fine without a firsthand artifact — that is how SolidJS, Vercel Zero, and TeamPCP won. Do not zero those.

3. **Hook buries the strongest line → `hook strength` = 0.** Identify the single most quotable sentence in the body — the one with a named phenomenon, a quantified result, or an arguable stake the reader could fight about. If that sentence is not in the first one or two lines, zero `hook strength`. Example: "Constraint decay. The phenomenon has a name now." sitting in paragraph 3 while the opening line is "A new paper benchmarks…" is a hard zero.

4. **Hook reuses a recent frame → `hook strength` = 0.** Compare the draft's opening line to the `## Recent hooks` section of `bun run post-patterns`. If it reuses a frame already listed there — the surface template, not the topic; e.g. the "Everyone X, I Y" pronoun-pivot — and that frame is flagged repeated or sub-median, zero `hook strength`. A gimmick that just underperformed does not get a second turn. If the frame appears in the recent list but was *not* sub-median, drop `hook strength` by one instead of zeroing and note that the frame is becoming a tic.

Document which hard-zero rule (if any) triggered in the rejection's `Rewrite plan`.

## Carousel scoring

**Applies only when the draft is `format: carousel`.** Same seven axes, same `>= 10/14` bar, same no-zero rule — the meaning of each axis shifts to a multi-slide comparison. The draft body is a per-slide outline (intro, one slide per tool, closing, caption); the concept is a folder with an index `prompt.md` plus `slide-NN.md` files.

- **hook strength** → scored on **Slide 1 only**. Hard-zero rule 3 (buries the strongest line) re-points to: the sharpest comparison claim must be on Slide 1, not stranded on a later slide. Hard-zero rule 4 (recent frame) still applies to the Slide-1 line.
- **specificity** → judged across the comparison cells. Pros/cons must be concrete and tool-specific; generic filler that could apply to any tool drops this axis. Invented version numbers or fabricated metrics are a specificity *failure*, not a strength — flag them.
- **novelty** → is the comparison itself a non-obvious wedge, or a recap of a table everyone has seen? A flat matrix with no stance drops novelty.
- **readability** → can each slide be parsed in milliseconds at portrait size? Too many cells per slide, or sentence-length cells, drop this.
- **builder relevance** → unchanged in intent. Hard-zero rule 1 still kills navel-gazing (a carousel comparing the owner's own posting tools fails). The comparison must help a stranger builder choose.
- **discussion potential** → does the comparison take a side that invites disagreement? A neutral matrix scores low; a clear stance ("I'd never pick Z for production") scores high.
- **visual concept fit** → spans **all slides via the index**. Read `concept_path` (the folder's `prompt.md`) and verify: (a) `visual_system` is present and real (a recurring frame tying slides together), (b) the logo region is reserved on every slide, (c) per-slide subjects are not banned clichés, (d) `hook_overlay` matches Slide 1's actual hook, (e) `slide_count` matches the number of slides in the draft. A missing index, a mismatched slide count, or banned-cliché interior slides degrade or zero this axis exactly as a missing/cliché concept does on the text path. As on the text path, a carousel critiqued before `post-carousel` ran (no `concept_path`) is scored on comparison potential only, with a note that no concept exists yet.

## Decision-tree scoring

**Applies only when the draft is `format: decision-tree`.** Same seven axes, same `>= 10/14` bar, same no-zero rule. The body is a root question plus 3 to 5 condition→recommendation branches and a caption; the concept is a single flowchart image at `concept_path`.

- **hook strength** → scored on the **root question**. Hard-zero rule 3 (buries the line) re-points to: the real decision must be the headline, not buried under setup. Hard-zero rule 4 (recent frame) still applies to the question phrasing.
- **specificity** → are the branch conditions concrete and checkable (team size, latency, ownership), and the recommendations named and specific? Vague conditions ("if you need power") or "it depends" leaves drop this axis.
- **novelty** → is the way the decision is *cut* non-obvious, or a tree everyone could draw? A predictable routing drops novelty.
- **readability** → can the tree be parsed in milliseconds? More than 5 branches, overlapping conditions, or deep nesting drop this.
- **builder relevance** → unchanged in intent. Hard-zero rule 1 still kills navel-gazing. The decision must be one a stranger builder actually faces.
- **discussion potential** → does the routing take defensible sides someone would argue with? A wishy-washy tree scores low; opinionated routing scores high.
- **visual concept fit** → the flowchart in `concept_path` must be legible, its title must match the root question, branches must match the draft, and it must read clean at a glance. A decision flowchart is the **one allowed exception** to the no-chart/no-diagram cliché rule (the diagram is the literal content), so do not penalize it for being a flowchart — penalize only an unreadable, mismatched, or wrong-branch one. As elsewhere, a decision-tree critiqued before `post-flowchart` ran (no `concept_path`) is scored on routing clarity only, with a note that no concept exists yet.

## What to look for

- **First check: would a builder who has never heard of the owner care about this?** If the real subject is the owner's own posting/metrics/process, it fails regardless of how well it's written (see hard-zero rule 1). A post can be perfectly voiced and still be worthless because nobody outside the owner's content ops cares.
- The draft should sound like a real technical builder, not a recap bot.
- **Style tics.** Flag and require a fix for any em dash or quotation mark in the body. The voice bans both: claims are stated plainly or paraphrased, never air-quoted, scare-quoted, or wrapped around a source's words.
- **No prior-post references.** Flag any sentence that points back to the owner's previous posts or leans on a topic just covered as throwaway evidence (a one-line "X already does this" about last post's subject). Each post must stand alone for a stranger; request the line be cut.
- The hook should make a concrete claim quickly.
- The body should cash that claim out with evidence from the idea brief.
- The opinion wedge should be visible, not implied.
- The draft should fit the anti-pattern guidance from `bun run post-patterns`, including the **Recurring failure modes from postmortems** and **Cooling families** sections. Soft fits (one-off matches, partial overlaps) drop `novelty` or `builder relevance` by one; the hard zeros above handle the repeat cases.
- The concept prompt (if linked) should illustrate the post's actual content, not a stock visual for the topic family. A strong post with a banned-cliché image is not ready to publish — request a new concept before approving.

## Output

If approved:

```md
Approved.

Score:
- hook strength: X/2
- specificity: X/2
- novelty: X/2
- readability: X/2
- builder relevance: X/2
- discussion potential: X/2
- visual concept fit: X/2

Why it passes: <2 to 4 sentences>
```

If rejected, return exactly one rewrite plan with exactly these fields:

```md
Rejected.

Score:
- hook strength: X/2
- specificity: X/2
- novelty: X/2
- readability: X/2
- builder relevance: X/2
- discussion potential: X/2
- visual concept fit: X/2

Rewrite plan:
- what to cut: ...
- what evidence to add: ...
- how to sharpen the hook: ...
- visual concept fix: <only if the concept axis is the blocker; otherwise omit>
- ending: takeaway | question
```

If the rejection is driven purely by the concept (text is approve-worthy but the concept is a banned cliché), keep the rewrite plan but title it `Rejected (concept only).` and limit fields to `visual concept fix` and `ending`. The user can then re-run `/post-image` against the same draft without rewriting the body.

Do not draft the rewrite unless the user asks. Return the critique only.
