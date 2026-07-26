/**
 * ربط اسم مؤلّف الكتاب بصفحة العالم عند تطابق موثوق للاسم.
 * لا يغيّر بيانات العلماء أو المكتبة — مطابقة عرض فقط.
 */
import { SCHOLARS, type Scholar } from "@/lib/scholars-data";

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

const BY_NAME = new Map<string, Scholar>();
for (const s of SCHOLARS) {
  const key = normalizeName(s.name);
  if (key && !BY_NAME.has(key)) BY_NAME.set(key, s);
  // كنية قصيرة شائعة: آخر مقطعين إن كانا كافيين
  const parts = key.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    const short = parts.slice(-2).join(" ");
    if (short.length >= 6 && !BY_NAME.has(short)) BY_NAME.set(short, s);
  }
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
  if (exact) return { label, scholarId: exact.id, href: `/scholars/${exact.id}` };

  // تطابق جزئي حذر: اسم العالم ⊆ المؤلف أو العكس
  let best: Scholar | null = null;
  let bestScore = 0;
  for (const s of SCHOLARS) {
    const sk = normalizeName(s.name);
    if (sk.length < 5) continue;
    if (key.includes(sk) || sk.includes(key)) {
      const score = Math.min(key.length, sk.length);
      if (score > bestScore) {
        best = s;
        bestScore = score;
      }
    }
  }
  if (best && bestScore >= 8) {
    return { label, scholarId: best.id, href: `/scholars/${best.id}` };
  }

  return { label, scholarId: null, href: null };
}
