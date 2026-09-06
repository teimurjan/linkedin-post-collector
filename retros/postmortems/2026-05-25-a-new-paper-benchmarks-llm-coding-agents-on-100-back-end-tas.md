---
kind: postmortem
source_post: posts/2026/05-25-a-new-paper-benchmarks-llm-coding-agents-on-100-back-end-tas.md
topic_family: agents
source_type: experiment
lane: news
hook_type: result
reach_tier: t0-vendor-paper-or-self
impressions: 184
likes: 2
comments: null
shares: null
cohort: 1 to 4 weeks
cohort_median_at_run: 750
beat_median: false
likely_failure_modes:
  - news posts without firsthand signal
  - a single unreproduced paper is a t0 subject
decision: block
summary: A constraint-decay wedge built entirely on one unreproduced paper landed at 184 against a 750 cohort median; the paper recap is a t0 subject and nothing in it was rerun by the owner.
wiki_candidate: A paper recap without a reproduction stays inside the t0 band regardless of how strong the wedge is.
wiki_pages: [audience]
wiki_ingested: true
generated_at: 2026-09-02T10:21:13.000Z
---

The post summarized a benchmark of LLM coding agents across 100 back-end tasks and eight web frameworks, and pulled a constraint-decay argument out of the results.

It landed at 184 impressions against a 750 median for its 1-to-4-week scrape cohort — 25% of cohort — and sits in the t0 band in `wiki/audience.md` as one of the two "one paper" exemplars, alongside the 185-impression OpenAI benchmark post.

The validated flag applies: news posts without firsthand signal median 443 versus 750 (0.59x). Every number here belongs to the paper's authors. The post-specific failure is that a paper is structurally a t0 room — the standing audience for one preprint is the people who already read it — and the wedge, however good, argues *about* a document the audience has not seen rather than about something they can check. This postmortem drops the "announcement hook that reads like recap" flag carried by the previous revision: that flag is now on the corpus's **Tested and discredited** list (n=6, 1.22x — flagged posts do better), so it cannot be cited as a fault here.

The concrete change: block agents-plus-paper-recap until the owner has rerun some part of it. The reproduction does not have to be the whole benchmark — one framework, one task set, one number of the owner's own — but without it the post is a t0 subject with borrowed evidence, which is the shape the corpus punishes most consistently.
