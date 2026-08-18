---
draft_file: drafts/2026-08-13-a-16-year-old-sqlite-bug-cost-tailscale.md
source_post: posts/2026/08-13-a-16-year-old-sqlite-bug-cost-tailscale-19-corrupted-databas.md
topic_family: other
source_type: news
reach_tier: t2-universal
reach_ceiling_scored_at_ideation: 2
published_url: 'https://www.linkedin.com/feed/update/urn:li:activity:7493652714107760641/'
published_at: '2026-08-13T13:00:32.378Z'
impressions_72h: 6565
impressions_24h: null
likes_72h: null
comments_72h: null
shares_72h: null
cohort: 2 to 7 days
cohort_median_at_run: 393
beat_median_impressions: true
beat_peer_group: true
discussion_validated: null
hook_matched_body: true
decision: repeat
summary: 16.7x cohort median with no firsthand signal at all. First pre-scored t2 to hold, and the paired control for the 08-10 miss — same score of 12, same risk label, 49x the reach.
wiki_candidate: A t2 subject carries a wedge-driven news take to multi-thousand reach with no firsthand signal, and reach_ceiling scored 2 on subject recognizability holds where the same score assigned from topical heat does not.
wiki_pages: [audience]
wiki_ingested: true
---

6565 impressions against a 393 median for the 2-to-7-day scrape cohort, so 16.7x. Top
five in the corpus, and the best post since the TypeScript 7 one on 08-03. Every peer
cut it beats: `news` top-group median is 5855, `other` family top median 19648 on n=2
(too few to cite), and the pooled corpus median 439.

The reason to read this retro next to the 08-10 one is that they are a controlled pair.
Both were scored on the same rubric three days apart. Both scored `12`. Both carried
`risk: rehash`. Both were pre-scored `reach_ceiling: 2`. One landed 6565 and the other
135 — a 49x spread with identical scores on every axis the ideator records.

The only thing that separates them is the subject. SQLite is something the reader has
already used and has an opinion about; the room was assembled before the post existed.
Claude Code's auto-mode default flipping on a plan tier is one vendor's configuration
change, however hot the surrounding conversation was. `wiki/audience.md` calls exactly
this distinction, and this pair is the first time the corpus tested it prospectively
rather than by post-hoc labelling. The t2 pre-score held — 6565 clears the page's
`t0_beat_above` / `t2_miss_below` thresholds cleanly — so the dispute is with the 08-10
scoring, not with the tier model.

Two things worth naming about the draft itself. First, `experience_hook: none — wedge-driven
news take`, and it still returned 16.7x. That is more evidence against the
news-without-firsthand flag, which `post-patterns` already reports as discredited at
0.76x on n=25. Firsthand signal is not what carries a post; subject recognizability is.
Second, the close is prescriptive and second-person — "go look at what you have tuned
away from defaults, that is where your version of this is sitting" — which converts a
story about someone else's outage into the reader's own unresolved risk. That is the
same closing move as the dependency-bot post at 34,287.

Where it fell short: 6565 is near t2's floor (5144) rather than its median (32731).
Comments and likes failed to scrape, so the boring-technology wedge is unvalidated. The
draft also spends its middle two paragraphs on the debugging narrative and only reaches
the wedge in the last one, which reads as a strong story with the argument bolted on.
The two t2 posts above 30,000 both put the wedge in the hook itself.

Decision: repeat. Keep the shape — t2 subject, result hook with a hard number, prescriptive
second-person close, no firsthand signal required. The one modification: move the wedge
forward. "Choosing boring technology is a bet that someone else already found the bugs"
is the sharpest line in the post and it is sitting in the last paragraph.
