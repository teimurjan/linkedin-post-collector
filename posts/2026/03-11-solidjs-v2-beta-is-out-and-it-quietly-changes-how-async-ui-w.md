---
urn: 'urn:li:activity:7437497920708395008'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7437497920708395008/'
posted_at: '2026-03-11T14:01:26.326Z'
impressions: 3570
likes: 11
comments: null
shares: null
scraped_at: '2026-05-13T11:10:17.691Z'
---
SolidJS v2 beta is out.

And it quietly changes how async UI works.

Solid has always been one of the most underrated UI libraries. I first ran into it while building Solid bindings for Avatune, and the model immediately felt different. No virtual DOM, fine-grained reactivity, JSX compiled directly to DOM.

It has the ergonomics of React, but a much lighter engine underneath.

The big shift in v2 is that async becomes part of the reactive graph itself.

Computations can return Promises, and the system knows how to suspend and resume work. Instead of juggling loading flags and effects, the UI reacts directly to async data.

The new primitives make that model explicit:
<Loading> for initial readiness, isPending() for subtle refresh indicators, and action() with optimistic helpers for mutations.

There’s also a more predictable scheduler, explicit derived state primitives, dev guardrails for async bugs, and a cleaned-up DOM model.

Solid was already extremely efficient at rendering.

V2 focuses on making the reactivity and async model more expressive.

https://lnkd.in/grC5aHc5
