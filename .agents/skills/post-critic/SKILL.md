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
