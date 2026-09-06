---
kind: postmortem
source_post: posts/2026/08-10-humans-catch-13-6-of-dangerous-agent-commands-a-classifier-c.md
topic_family: security
source_type: news
lane: news
hook_type: result
reach_tier: t0-vendor-paper-or-self
impressions: 163
likes: null
comments: null
shares: null
cohort: 1 to 4 weeks
cohort_median_at_run: 750
beat_median: false
likely_failure_modes:
  - news posts without firsthand signal
  - reach_ceiling scored from topical heat rather than standing-audience size
  - the one firsthand line is an assertion with no number behind it
decision: modify
summary: A vendor's own classifier benchmark was pre-scored a t2 on how loudly the topic was being discussed, landed at 163 against a 750 cohort median, and is the case that put the heat-is-not-size rule into the tier model.
wiki_candidate: A firsthand line without a number does not lift a post out of the news-without-firsthand-signal band.
wiki_pages: [audience]
wiki_ingested: true
generated_at: 2026-09-02T10:20:34.000Z
---

The post paired Anthropic's own 13.6%-vs-89% classifier result with LeadDev's 81%/7% agent-write-access split, arguing that the permission decision is made once, long before any classifier inspects a command.

It landed at 163 impressions against a 750 median for its 1-to-4-week scrape cohort — 22% of cohort — and sits inside the t0 band (76 to 236) in `wiki/audience.md`, where it is already recorded under `disputed` as the page's one predictive miss.

The primary failure is the one the tier model already absorbed: the brief scored `reach_ceiling: 2` because Claude Code auto mode was being argued about everywhere that week, not because a large crowd already stands around the subject. The subject was one vendor's self-reported classifier number, which is a textbook t0. That resolution is settled — it produced the heat-is-not-size rule — so this postmortem adds the second, still-open observation.

That second observation is about the firsthand line. The post does contain one — "I run this pipeline on Claude Code subagents. That default just changed under me too" — and the classifier still marks the post `hasFirsthandSignal: false`. Both readings are defensible, and that is the point: the line asserts exposure without measuring anything. It names no count of subagents, no blocked command, no boundary the owner had actually configured. Compare the security post that broke this family's losing streak at 77x median, which carried a prescriptive hook plus one concrete firsthand line. Presence of a first-person sentence is not the variable; a number the owner produced is.

The concrete change: modify rather than block — agent-permission boundaries remain a live builder subject. But the entry price is the owner's own configuration, measured. Run the classifier against this repo's own agent boundary, report how many of its tool calls would have been stopped, and lead with that. A vendor's benchmark plus a survey stat is two secondhand numbers wearing a first-person jacket.
