/**
 * ربط اسم مؤلّف الكتاب بصفحة التاريخ الإسلامي عند تطابق موثوق.
 */
import authorAliases from "@/data/islamic-history/author-aliases.json";
import { ISLAMIC_HISTORY_ITEMS } from "@/data/islamic-history";

function normalizeName(value: string): string {
  return value
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^(الإمام|الامام|الشيخ|الحافظ|القاضي|العلّامة|العلامة)\s+/i, "")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const LAQAB_PAIRS = /(?:\S+\s+الدين|حجه\s+الاسلام|شيخ\s+الاسلام|شمس\s+الائمه|امام\s+الحرمين)\s*/g;
const KUNYA_HEAD = new Set(["ابو", "ابي"]);
const NON_DISTINCTIVE = new Set([
  "بن", "ابن", "ابو", "ابي", "الامام", "الامامان", "الشيخ", "الحافظ", "القاضي", "العلامه", "الدكتور", "د",
]);

function nameTokens(value: string): string[] {
  const raw = normalizeName(value).replace(LAQAB_PAIRS, " ").split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    if (KUNYA_HEAD.has(raw[i]) && raw[i - 1] !== "ابن" && raw[i - 1] !== "بن") {
      i += raw[i + 1] === "عبد" ? 2 : 1;
      continue;
    }
    if (!NON_DISTINCTIVE.has(raw[i])) kept.push(raw[i]);
  }
  return kept;
}

type AliasRow = { legacyId: string; name: string; fullName?: string; href: string };

const BY_NAME = new Map<string, string>();
const ALIAS_TOKENS: Array<{ tokens: Set<string>; identity: Set<string>; href: string }> = [];

for (const row of authorAliases as AliasRow[]) {
  const href = row.href;
  const key = normalizeName(row.name);
  if (key && !BY_NAME.has(key)) BY_NAME.set(key, href);
  if (row.fullName) {
    const fk = normalizeName(row.fullName);
    if (fk && !BY_NAME.has(fk)) BY_NAME.set(fk, href);
  }
  const parts = key.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    const short = parts.slice(-2).join(" ");
    if (short.length >= 6 && !BY_NAME.has(short)) BY_NAME.set(short, href);
  }
  ALIAS_TOKENS.push({
    href,
    tokens: new Set([...nameTokens(row.name), ...nameTokens(row.fullName || "")].filter(Boolean)),
    identity: new Set(nameTokens(row.name)),
  });
}

for (const item of ISLAMIC_HISTORY_ITEMS) {
  const href = item.portalHref || `/tarikh-islami/${item.id}`;
  for (const label of [item.title, ...(item.relatedPersons ?? [])]) {
    const key = normalizeName(label);
    if (key && !BY_NAME.has(key)) BY_NAME.set(key, href);
  }
}

function matchByTokens(author: string): string | null {
  const required = nameTokens(author);
  if (!required.length || !required.some((token) => token.length >= 4)) return null;
  const hits = ALIAS_TOKENS.filter(
    (entry) =>
      required.every((token) => entry.tokens.has(token)) &&
      required.some((token) => entry.identity.has(token)),
  );
  return hits.length === 1 ? hits[0].href : null;
}

export type AuthorScholarLink = {
  label: string;
  scholarId: string | null;
  href: string | null;
};

export function resolveAuthorScholarLink(author: string | null | undefined): AuthorScholarLink {
  const label = (author || "").trim();
  if (!label) return { label: "", scholarId: null, href: null };

  const key = normalizeName(label);
  const exact = BY_NAME.get(key);
  if (exact) {
    const id = exact.match(/\/tarikh-islami\/([^/?#]+)/)?.[1] ?? null;
    return { label, scholarId: id, href: exact };
  }

  const byTokens = matchByTokens(label);
  if (byTokens) {
    const id = byTokens.match(/\/tarikh-islami\/([^/?#]+)/)?.[1] ?? null;
    return { label, scholarId: id, href: byTokens };
  }

  let bestHref: string | null = null;
  let bestScore = 0;
  for (const [aliasKey, href] of BY_NAME) {
    if (aliasKey.length < 5) continue;
    if (key.includes(aliasKey) || aliasKey.includes(key)) {
      const score = Math.min(key.length, aliasKey.length);
      if (score > bestScore) {
        bestHref = href;
        bestScore = score;
      }
    }
  }
  if (bestHref && bestScore >= 8) {
    const id = bestHref.match(/\/tarikh-islami\/([^/?#]+)/)?.[1] ?? null;
    return { label, scholarId: id, href: bestHref };
  }

  return { label, scholarId: null, href: null };
}
