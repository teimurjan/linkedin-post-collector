import { fetchHackerNews } from "../sources/hackernews";

function argValue(name: string): string | undefined {
  const i = Bun.argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = Bun.argv[i + 1];
  return v && !v.startsWith("--") ? v : undefined;
}

const limit = Number(argValue("limit") ?? 30);
const items = await fetchHackerNews(limit);
process.stdout.write(JSON.stringify(items, null, 2));
