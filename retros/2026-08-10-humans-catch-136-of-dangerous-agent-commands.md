---
draft_file: drafts/2026-08-10-humans-catch-136-of-dangerous-agent-commands.md
source_post: posts/2026/08-10-humans-catch-13-6-of-dangerous-agent-commands-a-classifier-c.md
topic_family: agents
source_type: news
reach_tier: t0-vendor-paper-or-self
reach_ceiling_scored_at_ideation: 2
published_url: 'https://www.linkedin.com/feed/update/urn:li:activity:7492565507951493120/'
published_at: '2026-08-10T13:00:22.231Z'
impressions_72h: 135
impressions_24h: null
likes_72h: null
comments_72h: null
shares_72h: null
cohort: 2 to 7 days
cohort_median_at_run: 393
beat_median_impressions: false
beat_peer_group: false
discussion_validated: null
hook_matched_body: true
decision: modify
summary: Pre-scored reach_ceiling 2, landed at 135 — inside t0's 76-236 band and the worst of the last eight posts. The ideator scored topical heat, not standing-audience size.
wiki_candidate: A pre-scored reach_ceiling of 2 does not hold when the subject is one vendor's default-setting change; topical heat is not standing-audience size, and a process-level firsthand line does not promote the subject out of t0.
wiki_pages: [audience]
wiki_ingested: true
---

135 impressions against a 393 median for the 2-to-7-day scrape cohort, so 0.34x. It is
the lowest number in the last eight posts and the second-lowest in the corpus outside
the 2025 company-milestone post. Against peer cuts it is worse: `agents + news` bottom
group medians 181-192, and this landed under both.

The number that matters is not the impressions, it is the gap between them and the
score. This idea was pre-scored `reach_ceiling: 2` at ideation on 2026-08-10 and it
landed at 135, inside t0's observed band of 76 to 236 and three orders of magnitude
below t2's median. `wiki/audience.md` names this exact case as its dispute trigger:
"if a pre-scored t2 lands under 1000 ... record it in `disputed` and revise the tier
definitions." This is the first such case, and it is the first real test the page asked
for rather than a post-hoc label.

What went wrong in the scoring is legible. The brief's `why_now` and `opinion_wedge`
are about how hot agent permissions are right now — top HN story at 199 points, three
labs disclosing sandbox breaches, LeadDev's 81%/7% split. All true, and all about
**topical heat**. The tier question is different: name the subject in five words and
ask whether the reader already knows it. The subject here is *Claude Code's auto mode
default flipping on August 14*. That is one vendor's configuration change, on a plan
tier, in one tool. Heat around the category does not assemble a room around the config
flag. The ideator read the temperature of the conversation and scored the size of the
crowd.

The craft was not the problem. Hook matched body — 13.6% and 89% are Anthropic's own
numbers from the cited source, and the body turns on them honestly rather than walking
them back. The wedge is genuinely sharp and still looks correct: a per-action classifier
sits downstream of the scope decision and cannot see it. Length, numbers, and the close
all sit in the top-quartile shape. Comments and likes failed to scrape, so the wedge is
unvalidated rather than rejected.

One secondary finding. The firsthand line was "I run this pipeline on Claude Code
subagents. That default just changed under me too." `wiki/audience.md` asserts that a
firsthand artifact promotes t0 to t1 only when it is a real technical thing another
builder could run or learn from, and explicitly not when the subject is the owner's own
process. This line is the owner's process, and no promotion happened. That was one
exemplar before; it is two now.

Decision: modify — at the ideation step, not the writing step. Keep the wedge template,
it works. Change the scoring rule: `reach_ceiling` must be assigned from the subject
named in five words, checked against a tier exemplar in `wiki/audience.md`, and a
candidate whose case for `2` rests on how much the topic is being *discussed* rather
than on how many people already know the *subject* gets a `0`. Concretely: "Claude Code
auto mode default" should have scored `reach_ceiling: 0` and been dropped by the hard
gate before it was ever drafted.
