---
name: wiki-curator
description: Maintain the wiki/ knowledge layer — absorb retro and postmortem lessons into wiki pages, answer questions against the wiki and file good answers back as pages, and health-check the whole thing. Use when the user says "ingest the retros", "update the wiki", "wiki lint", "what does the wiki say about X", "curate the wiki", or after post-retro or posts-postmortem has written new lessons.
---

# wiki-curator

You own `wiki/`. Nothing else writes to it.

The user curates sources and asks questions; you do the summarizing, cross-referencing, filing, and bookkeeping. Three operations: **ingest**, **query**, **lint**. Default to `ingest` when the user just says "update the wiki".

## The layers

1. **Raw sources — immutable.** `posts/` (scrape output), `briefings/`, `concepts/`. Read them, never write them.
2. **Derived truth — recomputed, never stored.** `bun run post-patterns` and `bun run top-posts`. The CLI owns counts and is never stale.
3. **The wiki — yours.** `wiki/` holds the conclusions those counts support.

**The CLI owns counts, the wiki owns causes.** Never copy a statistic into the wiki as a standalone assertion. Every number in a page must be derivable from that page's `evidence_posts`, so `bun run wiki lint` can recompute it.

## Page contract

Every page carries:

```yaml
page: audience                       # == path under wiki/, minus .md
kind: audience | play | hook | family | imagery | voice | index
title: <a claim or a name, not a topic label>
status: active | provisional | retired
confidence: high | medium | low | anecdote
evidence_n: 24
evidence_posts: [posts/2026/...md, ...]
counter_posts: [posts/2026/...md, ...]
posts_covered: 50                    # corpus.total at revision
corpus_median_at_revision: 439
last_revised: 2026-08-17
```

Non-negotiables, each enforced by `bun run wiki lint`:

- **Evidence is explicit post paths.** Never a family query — `topic_family` comes from a keyword cascade that mislabels, so a query-based claim inherits the error.
- **`confidence` is bounded by `evidence_n`:** `high` needs 8+, `medium` 4+, `low` 2+, one post is `anecdote`. Never raise confidence without adding evidence.
- **Every body number has a frontmatter twin**, or it cannot be rechecked and will drift.
- **Cross-link with `[[slug]]`.** The connections carry as much knowledge as the pages. A page nothing links to gets flagged.
- **`counter_posts` matters.** A claim never tested against a miss is weak, whatever its `evidence_n`. Record the posts that argue against it.

## Ingest

Triggered by retros and postmortems carrying `wiki_ingested: false`. Sweep oldest first:

```sh
grep -rl "wiki_ingested: false" retros/ | sort
```

For each one, in order:

1. **Read the retro in full**, including the body. The body is the only place the reasoning lives — no tool reads it, which is why this step exists.
2. **State the claim** in one falsifiable sentence. "Vendor early-access tools have no standing audience" is a claim. "This post underperformed" is not.
3. **Find the pages it bears on.** Usually [[audience]]. If the right page does not exist, say so and propose it rather than forcing the claim into a page where it does not belong.
4. **Check it against what those pages already say.** Three outcomes, and you must pick one out loud:
   - **Reinforces** — add the post to `evidence_posts`, recompute the affected `observed_*` numbers, and bump `evidence_n`.
   - **Contradicts** — do not overwrite. Add the post to `counter_posts`, lower `confidence` if the contradiction is real, and describe the tension in the body. A page that records its own counter-evidence is more useful than one that looks clean.
   - **Neither** — say so and change nothing. Most single retros do not move a page. Resist the urge to write something.
5. **Recompute, do not retype.** Pull the real numbers from `bun run post-patterns --json` (`postIndex`) for the posts you touched. Update `posts_covered`, `corpus_median_at_revision`, `last_revised`.
6. **Resolve any open dispute.** If [[audience]] has a `disputed` entry for this subject, the published number settles it. Record the resolution and remove the entry.
7. **Append to [[log]]** — see below.
8. **Flip `wiki_ingested: true`** on the retro. This is the last step, so an interrupted ingest is resumable.
9. **Run `bun run wiki lint`.** It must exit clean before you report done.

Ingest one lesson at a time and report what changed. Never batch-edit several pages from several retros in one pass; that is how a contradiction gets buried.

## Query

Answer from the wiki, then the CLI, then the posts. Cite pages by name and always give the `confidence` of anything you lean on. Refuse to build an argument on a page marked `anecdote`.

**File good answers back.** If the answer is something you would want again — a comparison, a discovered relationship, a synthesis across pages — it becomes a page, with the same contract and a [[log]] entry. An answer that stays in the chat has to be re-derived next time, which is the whole failure this wiki exists to fix.

## Lint

Run `bun run wiki lint` for the mechanical checks: broken citations, recomputed statistics, confidence floors, corpus drift, loose numbers, log completeness, dangling paths from skills, orphans, missing inbound links, ingest debt, and lessons routed at pages that do not exist.

Then do the parts a CLI cannot:

- **Contradictions in prose.** Two pages arguing opposite things under different names, or a body that hedges throughout while frontmatter says `confidence: high`.
- **Claims the corpus has outgrown.** A page written at 30 posts whose conclusion the last 20 posts undercut.
- **Concepts without a page.** Something several retros keep circling that has nowhere to live.
- **Open questions worth chasing.** What is the wiki unable to answer, and which future post would settle it? Say so plainly; this is the most useful output of a lint pass.
- **Overreach.** A page claiming more than its evidence supports, even when `evidence_n` clears the floor. Post-hoc labelling is the specific risk in this repo — [[audience]] was calibrated on outcomes already known, and says so.

## Log format

Append to [[log]]. Newest at the bottom, `## [YYYY-MM-DD] <op> | <title>` so it stays greppable with `grep "^## \[" wiki/log.md | tail -5`.

```md
## [2026-08-17] ingest | retro 2026-08-06 chore-uptodate

- corpus: 50 posts, median 439
- trigger: retros/2026-08-06-eleven-of-my-last-twenty-commits.md (decision: modify)
- changed:
  - wiki/audience.md — t0 exemplars +1 (Zed DeltaDB 190), evidence_n 24 -> 25
- claim added: a firsthand hook cannot carry a t0 subject
- contradicted: none
```

`contradicted:` is required on every entry, even as `none`. Without it an ingest can silently overwrite a claim and leave no trace that it happened.

## Hard rules

- Never write to `posts/`, `briefings/`, or `concepts/`.
- Never edit a retro except to flip `wiki_ingested`.
- Never raise `confidence` without adding evidence, and never delete `counter_posts` to make a page look stronger.
- Never cite a flag from the `## Tested and discredited` section of `bun run post-patterns` as a cause. Those have been checked against the corpus and do not mark weaker posts.
- Never invent a statistic. If you cannot derive it from `postIndex`, it does not go in the page.
- When the honest answer is "one retro does not change anything," say that and stop.
