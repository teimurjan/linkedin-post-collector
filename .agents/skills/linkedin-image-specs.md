# LinkedIn image specs (canonical)

The accepted image sizes for LinkedIn, shared by every visual skill (`post-image`,
`post-carousel`, `post-flowchart`). Emit only these — LinkedIn crops or downscales
anything off-spec, so an arbitrary aspect ratio from the image tool gets mangled in the
feed. Always carry the exact pixel size and ratio into the prompt's aspect-ratio suffix
and the concept frontmatter (`size`, `size_pixels`).

## Feed single image (`post-image`, `post-flowchart`)

One of:

| size | pixels | ratio | use |
| --- | --- | --- | --- |
| `portrait` | 1080 x 1350 | 4:5 | most mobile feed space, highest engagement |
| `square` | 1200 x 1200 | 1:1 | announcements, quote cards, diagrams |
| `landscape` | 1200 x 627 | 1.91:1 | link-preview style |

## Carousel / document post (`post-carousel`)

A LinkedIn carousel is a **document post**: every slide is one page of a single PDF the
user uploads. Each slide (page) is one of:

| size | pixels | ratio | use |
| --- | --- | --- | --- |
| `portrait` | 1080 x 1350 | 4:5 | recommended — most mobile space |
| `square` | 1080 x 1080 | 1:1 | even desktop/mobile |

All slides in one carousel must share the same size. `post-carousel` forces `portrait`
(1080 x 1350). After generating the slide images, the user combines them into one PDF in
slide order and uploads that as a document post.

## File rules

- Format: PNG or JPEG for single images; PDF for carousels.
- Keep single images under 5 MB. Carousel PDF: under 100 MB, max 300 pages.

## Sources

- https://www.sendible.com/insights/linkedin-post-size
- https://contentdrips.com/blog/2026/03/ultimate-guide-to-linkedin-carousel-sizes-for-2026/
- https://www.linkedin.com/help/linkedin/answer/a563309/image-specifications-for-your-linkedin-pages-and-career-pages
