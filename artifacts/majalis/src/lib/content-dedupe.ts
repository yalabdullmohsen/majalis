/**
 * تطبيع نصوص العرض قبل مقارنة الملخص/النبذة لتجنّب تكرار الفقرة نفسها.
 * لا يغيّر النص المعروض للمستخدم — للمقارنة فقط.
 */

export function normalizeForCompare(text: string): string {
  return String(text || "")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[«»""'’()،,.\-–—:؛]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** أول جملة مستقلة قصيرة (≤ ~120 حرفًا) أو مقطع حتى أول نقطة. */
export function extractShortSummary(full: string, maxLen = 120): string {
  const raw = String(full || "").trim();
  if (!raw) return "";
  const sentence = raw.split(/(?<=[.。!?؟])\s+/)[0] || raw;
  if (sentence.length <= maxLen) return sentence.replace(/\s+/g, " ").trim();
  const cut = sentence.slice(0, maxLen).replace(/\s+\S*$/, "").trim();
  return cut ? `${cut}…` : sentence.slice(0, maxLen).trim();
}

/**
 * إذا كان الملخص يكرر النبذة أو بدايتها الطويلة (≥ 40 حرفًا متطابقًا بعد التطبيع)
 * يُعاد عرض النبذة فقط (أو الملخص إن كان هو الأطول قليلًا ولا يضيف معلومة).
 */
export function pickUniqueSummaryAndBio(
  summary: string | null | undefined,
  biography: string | null | undefined,
): { summary: string | null; biography: string } {
  const bio = String(biography || "").trim();
  const sum = String(summary || "").trim();
  if (!sum) return { summary: null, biography: bio };
  if (!bio) return { summary: sum, biography: "" };

  const nSum = normalizeForCompare(sum);
  const nBio = normalizeForCompare(bio);
  if (!nSum || !nBio) return { summary: sum, biography: bio };

  if (nSum === nBio) return { summary: null, biography: bio };

  const prefixLen = Math.min(nSum.length, 80);
  if (prefixLen >= 40 && nBio.startsWith(nSum.slice(0, prefixLen))) {
    return { summary: null, biography: bio };
  }
  if (prefixLen >= 40 && nSum.startsWith(nBio.slice(0, Math.min(nBio.length, 80)))) {
    return { summary: null, biography: bio.length >= sum.length ? bio : sum };
  }

  return { summary: sum, biography: bio };
}
