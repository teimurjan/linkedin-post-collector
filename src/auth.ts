import type { BrowserContext, Page } from "playwright-core";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { LOGGED_IN_URL_PATTERN, URLS } from "./selectors.ts";

const PROFILE_FILE = resolve(process.cwd(), ".auth", "profile.json");
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

type Profile = { handle: string };

export async function ensureLoggedIn(context: BrowserContext): Promise<{ page: Page; handle: string }> {
  const page = context.pages()[0] ?? (await context.newPage());

  await page.goto(URLS.feed, { waitUntil: "domcontentloaded" });

  if (!LOGGED_IN_URL_PATTERN.test(page.url())) {
    console.log("");
    console.log("  ▶ Not logged in. Sign in to LinkedIn in the browser window.");
    console.log("    Waiting up to 5 minutes for you to finish…");
    console.log("");

    await page.waitForURL(LOGGED_IN_URL_PATTERN, { timeout: LOGIN_TIMEOUT_MS });
  }

  const handle = await resolveHandle(page);
  console.log(`  ✓ Logged in as ${handle}`);
  return { page, handle };
}

async function resolveHandle(page: Page): Promise<string> {
  const cached = await readProfile();
  if (cached && cached.handle && cached.handle !== "me") return cached.handle;

  await page.goto(URLS.me, { waitUntil: "domcontentloaded" });
  // /in/me/ is a client-side redirect to /in/<real-handle>/, so we have to wait
  // for the URL to settle into something other than "me".
  await page
    .waitForFunction(
      () => /\/in\/(?!me\/?$)[^/]+/.test(window.location.pathname),
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => {});

  const match = page.url().match(/\/in\/([^/?#]+)/);
  const raw = match?.[1];
  if (!raw || raw === "me") {
    throw new Error(`Could not resolve LinkedIn handle from URL: ${page.url()}`);
  }
  const handle = decodeURIComponent(raw);
  await writeProfile({ handle });
  return handle;
}

async function readProfile(): Promise<Profile | null> {
  try {
    return JSON.parse(await readFile(PROFILE_FILE, "utf8")) as Profile;
  } catch {
    return null;
  }
}

async function writeProfile(profile: Profile): Promise<void> {
  await mkdir(resolve(process.cwd(), ".auth"), { recursive: true });
  await writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2));
}
