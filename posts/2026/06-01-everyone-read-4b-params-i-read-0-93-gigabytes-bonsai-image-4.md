---
urn: 'urn:li:activity:7467198370764443648'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7467198370764443648/'
posted_at: '2026-06-01T13:00:25.427Z'
impressions: 7310
likes: 15
comments: 4
shares: null
scraped_at: '2026-06-09T09:36:26.734Z'
---
Everyone read 4B params. I read 0.93 gigabytes.

Bonsai Image 4B is a diffusion model quantized to 1-bit weights. The parameter count is the headline. The footprint is the story: 0.93 GB for the transformer, an 8x cut. That is the line between a model that lives in a datacenter and one that runs in your pocket. It draws a 512x512 image on an iPhone in 9.4 seconds, using 1.5 GB of memory.

I've shipped tiny models that run locally, a 0.6B model doing real work inside a browser tab. So here is the test I run before believing any on-device demo: quality-per-gigabyte, not quality-at-scale.

The 1-bit version keeps 88% of the full model's accuracy. An 8x size cut for a 12% quality drop. On a phone, you take that trade every time. That tradeoff is the whole game now, not the param count.

---

## Comments

**Devanshu Litoria**

> That 12% drop might sound small but would give very bad ouputs

↳ **Teimur Gasanov**

>> Devanshu Litoria Fair, 12% doesn't tell you whether it's spread thin or concentrated in a few broken outputs. Have you tested it on something specific?

**Himanshu Mehndiratta**

> For edge AI, FLOPs, memory bandwidth, and model footprint often dominate user experience more than raw parameter count.

↳ **Teimur Gasanov**

>> Himanshu Mehndiratta Exactly. On the 0.6B browser model I shipped, the bottleneck was never the math. It was memory pressure and load time.

