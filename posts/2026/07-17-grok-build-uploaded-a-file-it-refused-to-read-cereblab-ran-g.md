---
urn: 'urn:li:activity:7483868126212714496'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7483868126212714496/'
posted_at: '2026-07-17T13:00:04.835Z'
impressions: 1380
likes: 2
comments: null
shares: null
scraped_at: '2026-08-06T06:28:39.467Z'
concept_path: concepts/2026-07-17-grok-build-uploaded-a-file-it-refused-to/prompt.md
---
Grok Build uploaded a file it refused to read.

Cereblab ran Grok 0.2.93, told it to open nothing, then captured the traffic. The agent obeyed. The client still sent xAI a git bundle with every tracked file and full commit history. Cloning the upload recovered the denied canary file verbatim. This proves upload and storage, not model training.

The permission screen hides this boundary. A Read denial controls what enters model context. It says nothing about what the CLI sends over the wire. Turning off Improve the model did not stop the upload either.

If you put private code behind an agent, audit the transport, not just the prompts. You need an outbound-data policy enforced outside the agent. Have you checked what your coding tool sends before its first model call?

Source: https://lnkd.in/gNHNR6BK
