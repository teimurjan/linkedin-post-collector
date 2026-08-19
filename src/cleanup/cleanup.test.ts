import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type DatedEntry,
  collectDatedEntries,
  cutoffDate,
  findRetroPendingDrafts,
  planCleanup,
} from "./cleanup.ts";

const roots: string[] = [];

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "cleanup-"));
  roots.push(root);
  return root;
}

async function writeAt(root: string, path: string): Promise<void> {
  const full = join(root, path);
  await mkdir(join(full, ".."), { recursive: true });
  await writeFile(full, "x");
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

function entry(path: string, date: string): DatedEntry {
  const [dir = "", name = ""] = path.split("/");
  return { path, dir, name, date, kind: "file" };
}

describe("cutoffDate", () => {
  test("a 3-day window keeps today and the two days before it", () => {
    expect(cutoffDate(new Date(2026, 7, 19), 3)).toBe("2026-08-17");
  });

  test("a 1-day window keeps only today", () => {
    expect(cutoffDate(new Date(2026, 7, 19), 1)).toBe("2026-08-19");
  });

  test("the window crosses a month boundary", () => {
    expect(cutoffDate(new Date(2026, 7, 1), 3)).toBe("2026-07-30");
  });
});

describe("collectDatedEntries", () => {
  test("collects dated markdown files and dated image directories", async () => {
    const root = await tempRoot();
    await writeAt(root, "briefings/2026-08-19.md");
    await writeAt(root, "ideas/2026-08-19.md");
    await writeAt(root, "drafts/2026-08-13-a-slug.md");
    await mkdir(join(root, "images/2026-08-13-a-slug"), { recursive: true });

    const entries = await collectDatedEntries(root);

    expect(entries.map((e) => e.path)).toEqual([
      "briefings/2026-08-19.md",
      "ideas/2026-08-19.md",
      "drafts/2026-08-13-a-slug.md",
      "images/2026-08-13-a-slug",
    ]);
    expect(entries.map((e) => e.date)).toEqual([
      "2026-08-19",
      "2026-08-19",
      "2026-08-13",
      "2026-08-13",
    ]);
  });

  test("ignores undated names, non-markdown files, and durable directories", async () => {
    const root = await tempRoot();
    await writeAt(root, "briefings/README.md");
    await writeAt(root, "drafts/2026-08-13-a-slug.txt");
    await writeAt(root, "images/2026-08-13-loose.png");
    await writeAt(root, "posts/2026/08-13-a-slug.md");
    await writeAt(root, "concepts/2026-08-13-a-slug/prompt.md");

    expect(await collectDatedEntries(root)).toEqual([]);
  });

  test("missing directories are not an error", async () => {
    expect(await collectDatedEntries(await tempRoot())).toEqual([]);
  });
});

describe("findRetroPendingDrafts", () => {
  test("holds a published draft whose retro is not written yet", async () => {
    const root = await tempRoot();
    await writeAt(root, "drafts/2026-08-13-a-slug.md");
    await writeAt(root, "posts/2026/08-13-a-slug-with-a-longer-tail.md");

    expect([...(await findRetroPendingDrafts(root))]).toEqual([
      "drafts/2026-08-13-a-slug.md",
    ]);
  });

  test("releases a draft once its retro exists", async () => {
    const root = await tempRoot();
    await writeAt(root, "drafts/2026-08-13-a-slug.md");
    await writeAt(root, "posts/2026/08-13-a-slug-with-a-longer-tail.md");
    await writeAt(root, "retros/2026-08-13-a-slug.md");

    expect([...(await findRetroPendingDrafts(root))]).toEqual([]);
  });

  test("an unpublished draft is never held", async () => {
    const root = await tempRoot();
    await writeAt(root, "drafts/2026-08-13-a-slug.md");

    expect([...(await findRetroPendingDrafts(root))]).toEqual([]);
  });
});

describe("planCleanup", () => {
  test("keeps entries on or after the cutoff and removes the rest", () => {
    const entries = [
      entry("briefings/2026-08-19.md", "2026-08-19"),
      entry("briefings/2026-08-17.md", "2026-08-17"),
      entry("briefings/2026-08-16.md", "2026-08-16"),
    ];

    const plan = planCleanup(entries, "2026-08-17", new Set());

    expect(plan.remove.map((e) => e.path)).toEqual(["briefings/2026-08-16.md"]);
    expect(plan.keep.map((e) => e.reason)).toEqual(["recent", "recent"]);
  });

  test("an old draft awaiting its retro is kept, not removed", () => {
    const draft = entry("drafts/2026-07-01-a-slug.md", "2026-07-01");

    const plan = planCleanup([draft], "2026-08-17", new Set([draft.path]));

    expect(plan.remove).toEqual([]);
    expect(plan.keep).toEqual([{ ...draft, reason: "retro_pending" }]);
  });
});
