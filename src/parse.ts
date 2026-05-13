/**
 * Pure parsing helpers — no DOM, no network. Easy to unit-test if/when needed.
 */

/**
 * LinkedIn activity URNs are snowflake-like: the upper 41 bits of the numeric
 * ID encode milliseconds since Unix epoch. This is the most reliable post
 * timestamp source — no selectors, no relative-time strings to parse.
 *
 * Format: urn:li:activity:7268542123456789012
 */
export function urnToDate(urn: string): Date {
  const last = urn.split(":").pop();
  if (!last) throw new Error(`Invalid URN: ${urn}`);
  const id = BigInt(last);
  const ms = Number(id >> 22n);
  return new Date(ms);
}

/**
 * Parse counts like "1,234", "1.2K", "5M" → integer. Returns null on garbage.
 */
export function parseCount(input: string): number | null {
  const m = input.match(/([\d,.]+)\s*([KMB]?)/i);
  if (!m || !m[1]) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  if (!isFinite(n)) return null;
  const mult: Record<string, number> = { "": 1, K: 1e3, M: 1e6, B: 1e9 };
  const factor = mult[(m[2] ?? "").toUpperCase()] ?? 1;
  return Math.round(n * factor);
}

/**
 * Slugify text for filenames. Lowercase, alnum + dashes, max 60 chars.
 * Falls back to "untitled" if input has no usable characters.
 */
export function slugify(text: string, max = 60): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
  return slug || "untitled";
}
