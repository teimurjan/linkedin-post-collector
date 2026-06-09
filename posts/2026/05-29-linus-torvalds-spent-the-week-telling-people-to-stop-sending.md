---
urn: 'urn:li:activity:7466111163492196352'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7466111163492196352/'
posted_at: '2026-05-29T13:00:15.014Z'
impressions: 128280
likes: 267
comments: 8
shares: 13
scraped_at: '2026-06-09T09:36:24.343Z'
---
Linus Torvalds spent the week telling people to stop sending AI patches.

Not all of them. Just the ones where someone points an agent at the kernel, it flags a bug, and they forward it without understanding it. In the Linux 7.1-rc5 notes he asked people to stick to real regressions.

I maintain a small open-source library. I'll take a PR an agent helped write. I won't merge one the author can't walk me through line by line.

Everyone posts that agents now write a quarter of commits. Here's the part they skip. The projects with the highest reliability bars are the ones slamming the door. Generation was never the bottleneck. Comprehension is.

The teams banning agents aren't behind. They're pricing comprehension correctly while everyone else gives it away.

---

## Comments

**Rusty Brewer**

> generation was never the bottleneck. we could always write the wrong code fast too. 
> 
> engineering isn't really about writing code, it's about fully understanding the problem, being able to come up with multiple solutions, walking through the consequences of each solution, and picking the best one to implement. 
> 
> the coding was always the easy part.

**Igor S.**

> Great framing. "Comprehension is the bottleneck, not generation" is exactly right, and so is the walk-me-through-it bar. The real question is what happens when generation keeps accelerating and that bar turns into a queue.
> 
> Line-by-line review is manual repayment of knowledge debt, one PR at a time. It works, but it scales linearly while generation scales exponentially, and it puts your most expensive people on your most repetitive task.
> 
> The way I see teams winning, and the way I'm trying to build, isn't dropping the bar. It's automating it. Build so every change documents itself from enough angles that an AI can actually hold the comprehension, then put that AI on the gate.
> 
> It checks every commit and scales with the generation instead of choking on it, and it hands the full picture back to a human the moment someone needs it. People keep the hard calls. The machine keeps the routine from ever turning into debt.

**Jari Ronkainen**

> Those aren't patches. They are a distributed denial of service attack on your time.
> 
> In open-source projects where your time is limited, I'd say it's reasonable approach to see if contributors start acting like CIA's Simple Sabotage Field Manual (it's in project gutenberg), it's time to say no.
> 
> And I'm not kidding, a lot of AI agents act like they took that as a textbook, few picks:
> 
>  (7) Insist on perfect work in relatively unimportant products; send back for refinishing those which have the least flaw. Approve other defective parts whose flaws are not visible to the naked eye. 
>  (9) When training new workers, give incomplete or misleading instructions. 
> 
>  (6) Never pass on your skill and experience to a new or less skillful worker. 
>  (10) Mix good parts with unusable scrap and rejected parts. 
>  (e) Misunderstand all sorts of regulations concerning such matters as rationing, transportation, traffic regulations. 
> 
> ...and so on.

**Jonathan L.**

> Why ban, reviewers should fight back with AI review agents that question the heck out of every line change

↳ **Teimur Gasanov**

>> Jonathan L. I don’t think it’s a 100% correct decision. You just go in a way that suits you better, either right now or in the future (ideally both). The question is whether banning is the long-term option.

**Tanvir Roshid**

> Asking individuals to explain their code line-by-line is an **excellent** test to determine if they understand their work.

**Robert Van Dell II**

> AI generated post and image is a nice touch 😅

**Gaël Rostang**

> Soon he's going to make an AI-agent that'll reject all GenAI merge requests 😂

