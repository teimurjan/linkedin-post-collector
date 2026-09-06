---
urn: 'urn:li:activity:7499081990344695808'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7499081990344695808/'
posted_at: '2026-08-28T12:34:32.704Z'
impressions: 143
likes: 2
comments: null
shares: null
scraped_at: '2026-09-01T10:41:38.895Z'
lane: experience
---
I shipped an image differ. The speed was the easy part.

Visual regression testing is mostly waiting. Hundreds of screenshots compared pixel by pixel in CI, almost all identical. Making it fast was mechanical: block scanning, a Rust core with SIMD, a custom PNG decoder once I found decoding ate 75% of the runtime. Four times faster than odiff on 4K.

None of it told me what actually changed.

A correct diff still hands you a wall of red pixels and walks off. A one-pixel antialiasing shift lights up the same as a broken layout. That is why your snapshot tests go flaky and half the team stopped trusting them.

The hard half was teaching the diff what kind of change it is. Addition, shift, color, rendering noise. Only the ambiguous regions go to a human or an agent.

Pixels were never the point. I wrote up the math behind it.

https://lnkd.in/dDCHcPA8
