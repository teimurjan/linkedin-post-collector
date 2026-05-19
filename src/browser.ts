import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { launchPersistentContext } from "cloakbrowser";
import type { BrowserContext } from "playwright-core";

const AUTH_DIR = resolve(process.cwd(), ".auth");
const PROFILE_DIR = resolve(AUTH_DIR, "profile");

export async function openBrowser(): Promise<BrowserContext> {
  await mkdir(PROFILE_DIR, { recursive: true });
  return launchPersistentContext({
    userDataDir: PROFILE_DIR,
    headless: false,
    viewport: { width: 1440, height: 900 },
    humanize: true,
  });
}
