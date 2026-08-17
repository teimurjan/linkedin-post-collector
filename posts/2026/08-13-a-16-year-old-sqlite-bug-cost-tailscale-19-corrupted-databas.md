---
urn: 'urn:li:activity:7493652714107760641'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7493652714107760641/'
posted_at: '2026-08-13T13:00:32.378Z'
impressions: 6565
likes: null
comments: null
shares: null
scraped_at: '2026-08-17T10:33:55.988Z'
---
A 16-year-old SQLite bug cost Tailscale 19 corrupted databases.

Six months of outages. Not one reproduction. Not by shard, customer, load, or time of day. They ended up shipping forensic telemetry into live production and waiting for the next corruption to happen.

The race between a checkpoint and a write was so rare that SQLite's own developers had to add code to deliberately trigger it in testing. CI was never going to catch this. What put Tailscale in front of it was one step off the default. They control checkpointing manually, and they do it aggressively.

Choosing boring technology is a bet that someone else already found the bugs. Go look at what you have tuned away from defaults. That is where your version of this is sitting.
