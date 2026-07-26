export function normalizeArabic(value: string): string {
  return value
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؐ-ًؚ-ٰٟٓ-ٕ]/g, "")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function entityKey(kind: string, id: string): string {
  return `${kind}:${id}`;
}

export function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalizeArabic(a).split(" ").filter((t) => t.length >= 3));
  const tb = new Set(normalizeArabic(b).split(" ").filter((t) => t.length >= 3));
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / Math.max(ta.size, tb.size);
}
