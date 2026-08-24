/**
 * تطبيع وإزالة تكرار الروابط الداخلية — مصدر واحد للمقارنة حسب الوجهة الحقيقية.
 */

export type LinkLike = {
  href: string;
  label?: string;
  title?: string;
  name?: string;
  url?: string;
  meta?: string;
  note?: string;
};

/** يُعيد مسارًا نسبيًا موحّدًا للمقارنة (بدون query/hash إلا عند الحاجة). */
export function normalizeLinkHref(
  href: string,
  opts?: { keepQuery?: boolean },
): string {
  const raw = String(href || "").trim();
  if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:")) return raw;

  let path: string;
  let query = "";
  let hash = "";

  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      path = u.pathname || "/";
      query = opts?.keepQuery ? u.search : "";
      hash = opts?.keepQuery ? u.hash : "";
    } else {
      const qIdx = raw.indexOf("?");
      const hIdx = raw.indexOf("#");
      const cut = [qIdx, hIdx].filter((i) => i >= 0).sort((a, b) => a - b)[0];
      path = cut != null ? raw.slice(0, cut) : raw;
      if (opts?.keepQuery && qIdx >= 0) {
        const end = hIdx >= 0 ? hIdx : raw.length;
        query = raw.slice(qIdx, end);
      }
      if (opts?.keepQuery && hIdx >= 0) hash = raw.slice(hIdx);
    }
  } catch {
    path = raw.split(/[?#]/)[0] || raw;
  }

  if (!path.startsWith("/")) path = `/${path.replace(/^\/+/, "")}`;
  path = path.replace(/\/+$/, "") || "/";

  return `${path}${query}${hash}`;
}

function linkHref(item: LinkLike): string {
  return item.href || item.url || "";
}

/** يُزيل التكرار حسب الوجهة مع الحفاظ على أول ظهور وترتيبه. */
export function dedupeLinksByHref<T extends LinkLike>(
  items: readonly T[],
  opts?: { keepQuery?: boolean },
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const href = linkHref(item);
    if (!href) continue;
    const key = normalizeLinkHref(href, opts);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** يكتشف href مكررة داخل مجموعة واحدة (للاختبارات والبوابات). */
export function findDuplicateHrefs(
  items: readonly LinkLike[],
  opts?: { keepQuery?: boolean },
): string[] {
  const seen = new Map<string, number>();
  const dupes: string[] = [];
  for (const item of items) {
    const href = linkHref(item);
    if (!href) continue;
    const key = normalizeLinkHref(href, opts);
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    if (n === 2) dupes.push(key);
  }
  return dupes;
}
