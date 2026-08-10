# LinkedIn image specs (canonical)

The accepted image sizes for LinkedIn. LinkedIn crops or downscales anything off-spec,
so an arbitrary aspect ratio from the image tool gets mangled in the feed.

**This project standardizes on `square` for every visual skill** (`post-image`,
`post-carousel`, `post-flowchart`) — one size, no per-post choice, and it maps cleanly to
`gpt-image-2`'s standard output with no cropping. The `portrait`/`landscape` rows below
are kept for reference (LinkedIn does accept them) but none of the skills currently offer
them; do not reintroduce a size flag without updating all three skills together.

## Feed single image (`post-image`, `post-flowchart`)

| size | pixels | ratio | use |
| --- | --- | --- | --- |
| `square` (only one in use) | 1200 x 1200 | 1:1 | announcements, quote cards, diagrams |
| `portrait` | 1080 x 1350 | 4:5 | most mobile feed space, highest engagement |
| `landscape` | 1200 x 627 | 1.91:1 | link-preview style |

## Carousel / document post (`post-carousel`)

A LinkedIn carousel is a **document post**: every slide is one page of a single PDF the
user uploads. Each slide (page) is one of:

| size | pixels | ratio | use |
| --- | --- | --- | --- |
| `square` (only one in use) | 1080 x 1080 | 1:1 | even desktop/mobile |
| `portrait` | 1080 x 1350 | 4:5 | most mobile space |

All slides in one carousel must share the same size. `post-carousel` forces `square`
(1080 x 1080). After generating the slide images, the user combines them into one PDF in
slide order and uploads that as a document post.

## File rules

- Format: PNG or JPEG for single images; PDF for carousels.
- Keep single images under 5 MB. Carousel PDF: under 100 MB, max 300 pages.

## Sources

- https://www.sendible.com/insights/linkedin-post-size
- https://contentdrips.com/blog/2026/03/ultimate-guide-to-linkedin-carousel-sizes-for-2026/
- https://www.linkedin.com/help/linkedin/answer/a563309/image-specifications-for-your-linkedin-pages-and-career-pages
