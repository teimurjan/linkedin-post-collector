import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export async function walkMarkdown(root: string): Promise<string[]> {
  const out: string[] = [];
  const exists = await stat(root)
    .then(() => true)
    .catch(() => false);
  if (!exists) return out;

  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}
