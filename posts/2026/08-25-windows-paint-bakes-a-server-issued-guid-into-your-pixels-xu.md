---
urn: 'urn:li:activity:7498001328577851392'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7498001328577851392/'
posted_at: '2026-08-25T13:00:22.861Z'
impressions: 72
likes: null
comments: null
shares: null
scraped_at: '2026-09-01T10:41:34.508Z'
---
Windows Paint bakes a server-issued GUID into your pixels.

Xusheng Li took the Paint app apart last week. It ships local Stable Diffusion models, and on a Copilot+ PC the image generates on your NPU. Before any of that runs, AIServices.dll posts your prompt to a Microsoft endpoint for moderation. The response carries a GUID. That GUID goes into the image as an invisible watermark.

It is not optional. If the watermark write fails, Paint turns the whole generation into an error instead of handing you the picture.

The watermark setting you can see only controls the visible Copilot logo. C2PA metadata strips out in one command. This one lives in the pixels. On a 512 by 512 test, 193,376 of 262,144 pixels changed.

Local means the weights sit on your machine. It does not mean the request does. If you ship local inference, say which part is local.
