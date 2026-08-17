---
draft_file: drafts/2026-07-10-rewrite-it-in-rust-used-to-be-a-joke.md
topic_family: other
source_type: news
published_url: 'https://www.linkedin.com/feed/update/urn:li:activity:7481331404467789825/'
published_at: '2026-07-10T13:00:03.241Z'
impressions_24h: null
impressions_72h: 32731
likes_72h: 72
comments_72h: 18
shares_72h: 5
beat_median_impressions: true
beat_peer_group: true
discussion_validated: true
hook_matched_body: true
decision: repeat
summary: 74x median with 18 comments, and the best ones argued the exact wedge — cost collapse is real, the bottleneck moved to proving equivalence. The template works; the firsthand number needs a citation next time.
---

## Reach

32731 impressions, 74x the 443 median, 10x the `news` source-type median of
3082, and the top of the `other` family. 18 comments and 5 shares — the second
highest comment count in the corpus after TabFM.

Unlike the Torvalds post, this did not travel on a famous name. The reach came
from a three-artifact week (Bun, Postgres, Cpp2Rust) plus a reframe that gave
readers something to disagree with.

## Discussion

This is the strongest thread the account has produced. Jose Robles wrote the
wedge's own next paragraph: "porting thousands of functions is now cheap,
proving behavioral equivalence is not … teams with strong coverage get cheap
rewrites; teams without it get a faster way to ship plausible-looking bugs."
Chinmay M. arrived independently at the same place with an unsafe-block count
from the pgrust codebase. Sergei Dudka pushed it toward maintenance ownership.

That is the intended angle — rewrite economics, not language preference —
being extended by readers rather than restated.

The drift is worth naming. Maybe a third of the thread went to language wars:
Rust aesthetics, why Java teams won't port to Kotlin, Rust-vs-Java jokes. The
hook contains the word Rust, so it recruits the Rust argument whether or not
the body is about Rust. Acceptable cost — those comments still fed reach — but
the on-angle share would be higher with a hook that names the economics
instead of the language.

One comment demands a fix. Ihor Shevchuk: "There is literally no way Rust is
faster than C. Can I assume that the rest in the post is the same quality?" The
libspng 3.8x claim was stated bare, with no method and no link. An unsourced
firsthand number invites exactly this, and it discredits the rest of the post
for anyone who agrees with the challenger.

## Decision: repeat

The structure is the account's best-performing shape and it now has two
independent wins behind it:

1. Multiple same-week artifacts, counted out in one line each.
2. An explicit "everyone's reading this as X — that's not the story" turn.
3. A firsthand miniature of the same phenomenon.
4. A closing question pointed at the reader's own stack.

**Repeat:** that four-beat structure, verbatim as a template.

**Modify:** never ship a firsthand benchmark number without the method or a
link in the same sentence. "3.8x faster on a single thread" should have read
"3.8x faster single-threaded on the same corpus, decode only." One clause would
have closed the only real attack surface in the post.
