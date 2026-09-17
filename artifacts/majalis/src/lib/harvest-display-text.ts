/**
 * تنظيف عرض بطاقات الحصاد فقط — منفصل عن cleanDisplayText العام (حجم الحزمة).
 */
import { cleanDisplayText } from "./display-text";

const HARVEST_NOISE_RE = [
  /Photo by\s+.+?(?:on\s+\w+\s+\d{1,2},?\s+\d{4})?/giu,
  /May be(?:\s+an)?\s+image of[^.]*/giu,
  /بطاقة تعريف من بيانات الحلقة في المنصة\.?/giu,
  /https?:\/\/\S+/giu,
  /\bwww(?:\.\S*)?/giu,
  /&nbsp;|&#\d+;|&amp;|&quot;|&lt;|&gt;/giu,
  /@[\w.]+/gu,
  /(?:^|\s)(?:للتواصل|للتسجيل|واتس(?:اب)?|واتساب|تواصل)[:\s]*[٠-٩0-9+\-()\s]{6,}/giu,
  /(?:^|\s)[٠-٩0-9]{7,12}(?=\s|$)/gu,
];

export function cleanHarvestDisplayText(text: string | null | undefined): string {
  let value = cleanDisplayText(text);
  for (const pattern of HARVEST_NOISE_RE) {
    value = value.replace(pattern, " ").replace(/\s+/g, " ").trim();
  }
  return value.replace(/\s*[.…]+$/u, "").replace(/\s+/g, " ").trim();
}

export function isPresentableDisplayText(text: string | null | undefined, minLen = 4): boolean {
  const v = String(text ?? "").replace(/\s+/g, " ").trim();
  if (v.length < minLen) return false;
  if (/^(الله|www|Erth|erth)$/iu.test(v)) return false;
  const latin = (v.match(/[A-Za-z]/g) || []).length;
  const arabic = (v.match(/[\u0600-\u06FF]/g) || []).length;
  if (latin > 12 && latin > arabic) return false;
  return true;
}
