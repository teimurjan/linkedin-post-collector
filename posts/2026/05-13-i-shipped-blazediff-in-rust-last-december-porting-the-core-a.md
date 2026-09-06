---
urn: 'urn:li:activity:7460360643075010561'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7460360643075010561/'
posted_at: '2026-05-13T16:09:44.107Z'
impressions: 415
likes: 3
comments: 2
shares: null
scraped_at: '2026-05-25T06:58:42.037Z'
lane: experience
---
I shipped BlazeDiff in Rust last December. Porting the core algorithm took weeks, and most of that time wasn't writing code.

It was figuring out ownership. What to do at the N-API boundary. The final Rust is small. The thinking wasn't.

This week, Bun rewrote 960k lines from Zig to Rust in six days with Claude. 99.8% of tests pass. The Rust version has 13,044 unsafe blocks. UV, a comparable Rust project, has 73.

That ratio tells you what kind of port this is. When you translate at AI speed, you keep the original structure intact and bypass the safety checks every time they get in your way. The compiler is still there. You just turned it off 13,000 times.

Jarred said the motivation was memory leaks, not the Rust idiom. But the slow part of a Rust port isn't typing. It's the design work that forces you to rethink ownership rather than preserve it.

I don't think the BlazeDiff approach scales to 960k lines. I also don't think six days does.

---

## Comments

**Malik Bakti**

> Looks like very rough primitive file-by-file translation and next phase would be eliminating those 13k unsafe blocks to a minimum

↳ **Teimur Gasanov**

>> Malik Bakti Yeah, but if it would it’s gonna be a tough one. Mimicking behavior is a lot easier than managing memory/enforcing code security for the agents. We’ll know soon 😁

