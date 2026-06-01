// Generates the README banner: the office envelope mark + "The Post Office"
// centered on the same paper background as the live dashboard header.
//
//   bun run logo                       → writes assets/banner.png
//   bun run logo --out path.png        → custom output
//   bun run logo --tagline "for builders"
//   bun run logo --width 1200 --height 200 --scale 2
//
// Faithful to src/office/web/index.html + src/office/web/post-office/app.jsx: same color tokens,
// paper grain, #roughen hand-drawn filter, envelope path, and Caveat type. We
// render real HTML in the already-installed chromium so the font and grain
// match the header pixel-for-pixel instead of re-deriving them as vector paths.

import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright-core";

// ---- design tokens (mirrored from src/office/web/index.html :root) -------------------

const TOKENS = {
  paper: "#f1e9d8",
  paper2: "#ece2cd",
  ink: "#221d16",
  inkSoft: "#6a5f4e",
  grainOpacity: 0.275, // calc(--grain-opacity 0.5 * 0.55)
} as const;

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

type BannerOpts = {
  width: number;
  height: number;
  tagline: string;
};

function buildHtml({ width, height, tagline }: BannerOpts): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  .banner {
    position: relative;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${Math.round(height * 0.07)}px;
    color: ${TOKENS.ink};
    background: radial-gradient(120% 90% at 50% -10%, ${TOKENS.paper} 40%, ${TOKENS.paper2} 100%);
  }
  .grain {
    position: absolute;
    inset: 0;
    pointer-events: none;
    mix-blend-mode: multiply;
    opacity: ${TOKENS.grainOpacity};
    background-image: url("${GRAIN_SVG}");
    background-size: 180px 180px;
  }
  .mark { color: ${TOKENS.ink}; display: block; }
  .brand-text { position: relative; }
  .brand-text h1 {
    margin: 0;
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: ${Math.round(height * 0.34)}px;
    line-height: 0.9;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .brand-text p {
    margin: ${Math.round(height * 0.03)}px 0 0;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: ${Math.round(height * 0.05)}px;
    letter-spacing: 0.3px;
    color: ${TOKENS.inkSoft};
    text-transform: lowercase;
  }
</style>
</head>
<body>
  <div class="banner">
    <div class="grain"></div>
    <svg class="mark" viewBox="0 0 60 60" width="${Math.round(height * 0.34)}" height="${Math.round(height * 0.34)}"
         fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="roughen" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.014" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <path d="M8,18 L52,14 L52,46 L8,50 Z" filter="url(#roughen)" />
      <path d="M8,18 L30,34 L52,14" filter="url(#roughen)" />
    </svg>
    <div class="brand-text">
      <h1>The Post Office</h1>
      ${tagline ? `<p>${tagline}</p>` : ""}
    </div>
  </div>
</body>
</html>`;
}

async function renderToPng(
  html: string,
  {
    width,
    height,
    scale,
    outPath,
  }: BannerOpts & { scale: number; outPath: string },
): Promise<void> {
  const browser = await chromium
    .launch({ headless: true })
    .catch(() => chromium.launch({ headless: true, channel: "chrome" }));
  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: scale,
    });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const banner = page.locator(".banner");
    await mkdir(dirname(outPath), { recursive: true });
    await banner.screenshot({ path: outPath });
  } finally {
    await browser.close();
  }
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const width = Number(flag(argv, "width")) || 1200;
  const height = Number(flag(argv, "height")) || 200;
  const scale = Number(flag(argv, "scale")) || 2;
  const tagline = flag(argv, "tagline") ?? "";
  const outPath = resolve(
    process.cwd(),
    flag(argv, "out") ?? "assets/banner.png",
  );

  const html = buildHtml({ width, height, tagline });
  await renderToPng(html, { width, height, tagline, scale, outPath });
  process.stdout.write(
    `banner → ${outPath} (${width * scale}×${height * scale}px)\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`logo: ${err}\n`);
  process.exit(1);
});
