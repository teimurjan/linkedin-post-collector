---
urn: 'urn:li:activity:7437129981727526912'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7437129981727526912/'
posted_at: '2026-03-10T13:39:22.837Z'
impressions: 881
likes: 12
comments: null
shares: null
scraped_at: '2026-05-13T11:10:26.756Z'
lane: experience
---
Tiny models are getting weirdly useful.

I’ve been experimenting with SLMs running directly in the browser. No servers. No API calls. Just local inference inside a tab.

Using the browser-ai package (a wrapper around WebLLM integrated with Vercel’s AI SDK), I built a small component that behaves like a native browser feature.

Hover over a word in an article, and a tooltip explains it.

Everything runs locally on your machine. No infra. No tokens. No latency from remote models.

The surprising part: it’s powered by the 0.6B version of Qwen 3.

At that size, the model is extremely sensitive to prompting, so most of the work wasn’t UI. It was prompt optimization. I used a few datasets and ran GEPA-based optimization + validation to converge on prompts that consistently produce clear explanations.

The result is a tiny browser AI component that feels almost native.

It makes me think we’ll start seeing more micro-AI patterns in UI. Small models run locally and handle narrow tasks, while the cloud models step in only when real heavy lifting is needed.

Curious what other UI components could benefit from something like this.

---

## Comments

**Michael Mares**

> I think these are wildly underutilized

