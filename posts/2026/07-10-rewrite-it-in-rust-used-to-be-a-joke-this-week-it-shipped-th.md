---
urn: 'urn:li:activity:7481331404467789825'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7481331404467789825/'
posted_at: '2026-07-10T13:00:03.241Z'
impressions: 32731
likes: 72
comments: 18
shares: 5
scraped_at: '2026-07-23T06:58:57.908Z'
---
Rewrite it in Rust used to be a joke. This week it shipped three times.

Bun is dropping Zig to rewrite its core in Rust. Postgres got a Rust rewrite that passes 100% of the regression tests. Cpp2Rust now auto-translates C++ into safe Rust.

Everyone's reading this as Rust won. That's not the story. The story is why now.

A full rewrite of load-bearing software used to be a multi-year budget nobody could justify. The grunt work, porting thousands of functions and matching behavior exactly, is what AI is good at. The cost dropped. Rewrites that were never worth attempting suddenly are.

I hit this in miniature. I rewrote libspng, a C image codec, in Rust and clocked it 3.8x faster on a single thread.

So look at your own stack. Which rewrite did you rule out because it was too expensive? That math just changed.

---

## Comments

**Eugene Nuribekov**

> The oldest engineering principle is: "If it ain't broke, don't fix it".
> Fixing ownership "errors" only to introduce new ones into the business logic.

↳ **Nikolay Nikolaev**

>> That's why COBOL software and Mainframes are (were?) still alive, no?

**Chinmay M.**

> AI cutting the time to produce Rust from C doesn't cut the time to prove it's behaviorally identical, and that's still mostly manual.
> 
> Tests are the floor, not the ceiling, passing 100% of regression tests proves behavioral compatibility for documented scenarios, not correctness in undocumented edge cases, race conditions, or crash recovery.
> 
> AI hype is real...and its engulfing everyone in it
> 
> Also, unsafe means unsafe code written in Rust, that actually strips Rust's safety guarantees. there is close to 1835 unsafe fn declarations in pgrust codebase, so what's the point in rewriting it in Rust again if huge block of codebase is unsafe ?

**Geoffrey Vincent**

> Can someone explain why only the java world is reluctant to do massive rewrite into better languages ? (should be Kotlin)
> Why in all others worlds like JavaScript to TypeScript, C and even C++ and go to Rust, everyone seems happy and even pushing toward it.
> It drives me crazy for years seriously...

**Jose Robles**

> The cost collapse is real, but the bottleneck moves: porting thousands of functions is now cheap, proving behavioral equivalence is not. Postgres passing 100% of regression tests is the real headline — the test suite did the heavy lifting there, not the AI. Teams with strong coverage get cheap rewrites; teams without it get a faster way to ship plausible-looking bugs.

**Matthew Hook**

> Oh wow let's just rewrite everything because we can and because rust is just the best language for everything. And AI makes it trivial now. 
> 
> Except when it isn't and it goes wrong. Which has happened several times over.

**Ihor Shevchuk**

> There is literally no way Rust is faster than C. Can I assume that the rest in the post is the same quality?

**Jaroslaw Postawa**

> Rust would be great if only it didn't look as unwanted child of Perl and Pascal.

↳ **Alexandru Alexandrescu**

>> Jaroslaw Postawa Yes, is really really ugly.

**Shai Cioara**

> This is a smoke screen. Those rewrites in Rust has been proven to be just a line by line port, using unsafe Rust and by doing that basically underline the purpose of using Rust

↳ **John Vandenberg**

>> Shai Cioara 4% of Bun's Rust code sits inside an unsafe blocks, and they are working to reduce those. 100% of C/C++ code is unsafe blocks. Safe C++ was rejected. C++ Safety Profiles *might* make it into C++29.

**Matthew Hook**

> I'm pretty sure we'll never see the original author and maintainer of sqlite rewrite it in rust.

↳ **John Vandenberg**

>> Matthew Hook true, but ppl are slowly moving to https://github.com/tursodatabase/libsql

**Hao Nguyen (Kunkka)**

> Still better than rewrite in JAVA!

**Vedhasagaran Mahalingam**

> $165000 it took !

**Alexey Lyashko**

> Thise hype will backfire one day.

**🇨🇭 Vlad Stelmahovsky**

> next step is to rewrite libpng with the same performance gain. waiting

**Sergei Dudka**

> Yes, but right motivation is the key. Do that only if your business requires so. Rewriting for the sake of rewriting is not only waste of resources, but also significantly increases the surface you now own and have to maintain. Strong ownership + maintenance is what drives adoption. I predict that many such rewrites will slowly die because authors don’t own/maintain it as well as original, so adoption never happens.

