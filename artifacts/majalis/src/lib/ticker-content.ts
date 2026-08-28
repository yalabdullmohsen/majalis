/**
 * مصدر محتوى الشريط العلوي الموحَّد.
 *
 * لماذا وحدة منفصلة عن HeaderTicker.tsx: المكوّن يعرض فقط، وهذا الملف
 * يجمع ويُطبِّع ويمنع التكرار — فيصير المنطق قابلًا للاختبار بلا DOM
 * (انظر src/lib/__tests__/ticker-content.test.ts).
 *
 * المصادر كلها **موجودة مسبقًا وموثّقة داخل المستودع**؛ لا محتوى جديد
 * أُنشئ هنا ولا نص وُلِّد آليًا، ولا يُقصّ أي نص: كل حديث/ذكر/آية/فائدة
 * يُعرض كاملًا من أوله إلى آخره كما هو مخزَّن في مصدره:
 *   • DAILY_HADITH_POOL  — أحاديث بدرجاتها ورواتها
 *   • DAILY_TICKER_DHIKR — أذكار الصباح والمساء فقط (شريحة رفيعة)
 *   • DAILY_AYAH_POOL    — آيات بمراجعها
 *   • DAILY_FAIDA_POOL   — فوائد بمصادرها
 *   • SECTION/FEATURE promos — نبذ موجزة عن الأقسام والمميزات (واجهة، لا تدقيق محتوى)
 * كلها محلية: لا طلب شبكة إضافي إطلاقًا.
 */

import { DAILY_HADITH_POOL, DAILY_AYAH_POOL, DAILY_FAIDA_POOL } from "./daily-content";
import { DAILY_TICKER_DHIKR } from "./daily-ticker-dhikr";
import { FEATURED, QUICK_LINKS } from "./home-feature-catalog";

export type TickerKind = "hadith" | "dhikr" | "ayah" | "faida" | "promo";

export type TickerContentItem = {
  /** معرّف فريد عبر كل المصادر (بادئة المصدر تمنع التصادم بين النطاقات). */
  id: string;
  kind: TickerKind;
  label: string;
  text: string;
  source?: string;
  href: string;
};

/** عدد العناصر في مسار الشريط المتحرك (إعلان متواصل). */
export const VISIBLE_ITEMS = 10;

/** كم عنصرًا سابقًا يُمنع تكرارها. */
export const RECENT_LIMIT = 20;

export const RECENT_STORAGE_KEY = "majlis:ticker:recent:v1";

/** نبذ موجزة عن الأقسام الرئيسية — واجهة/تنقّل، ليست تدقيق محتوى. */
export const SECTION_PROMOS: Omit<TickerContentItem, "kind">[] = [
  { id: "promo:tawhid", label: "قسم", text: "العقيدة والتوحيد — أصول الإيمان بمنهج واضح", href: "/tawhid" },
  { id: "promo:seerah", label: "قسم", text: "السيرة والتاريخ — سيرة النبي ﷺ ومفاصل الأمة", href: "/seerah" },
  { id: "promo:fiqh", label: "قسم", text: "الفقه والأحكام — عبادات ومعاملات بأسلوب ميسر", href: "/fiqh" },
  { id: "promo:hadith", label: "قسم", text: "الحديث وعلومه — أحاديث موثّقة مع التخريج", href: "/hadith" },
  { id: "promo:quran", label: "قسم", text: "مركز القرآن الكريم — مصحف وتلاوة وأدوات التعلّم", href: "/mushaf" },
  { id: "promo:quran-knowledge", label: "قسم", text: "القرآن وعلومه — فهرس وعلوم وأسباب نزول وقصص", href: "/quran-knowledge" },
  { id: "promo:tarikh", label: "قسم", text: "التاريخ الإسلامي — خط زمني بالأحداث من قبل البعثة إلى يومنا", href: "/tarikh-islami" },
  { id: "promo:learn", label: "قسم", text: "تعلّم — دروس ودورات واختبارات منظّمة", href: "/learn" },
];

function normalizeText(text: string): string {
  return String(text || "").replace(/\s+/g, " ").trim();
}

/** يبني المجمّع الموحَّد من المصادر المحلية. نقي: نفس المدخلات ⇒ نفس المخرجات. */
export function buildTickerPool(): TickerContentItem[] {
  const pool: TickerContentItem[] = [];

  for (const h of DAILY_HADITH_POOL) {
    if (!h?.text?.trim()) continue;
    pool.push({
      id: `hadith:${h.id}`,
      kind: "hadith",
      label: "حديث",
      text: normalizeText(h.text),
      source: [h.narrator, h.source].filter(Boolean).join(" — ") || undefined,
      href: "/hadith",
    });
  }

  for (const d of DAILY_TICKER_DHIKR) {
    if (!d?.text?.trim()) continue;
    pool.push({
      id: `dhikr:${d.id}`,
      kind: "dhikr",
      label: d.categoryId === "adh-morning" ? "أذكار الصباح" : "أذكار المساء",
      text: normalizeText(d.text),
      source: d.source || undefined,
      href: "/adhkar",
    });
  }

  for (const v of DAILY_AYAH_POOL) {
    if (!v?.text?.trim()) continue;
    pool.push({
      id: `ayah:${v.id}`,
      kind: "ayah",
      label: "آية",
      text: normalizeText(v.text),
      source: v.reference || v.surah || undefined,
      href: "/mushaf",
    });
  }

  for (const f of DAILY_FAIDA_POOL) {
    if (!f?.text?.trim()) continue;
    pool.push({
      id: `faida:${f.id}`,
      kind: "faida",
      label: f.category || "فائدة",
      text: normalizeText(f.text),
      source: f.source || undefined,
      href: "/flashcards",
    });
  }

  for (const p of SECTION_PROMOS) {
    pool.push({
      id: p.id,
      kind: "promo",
      label: p.label,
      text: normalizeText(p.text),
      href: p.href,
    });
  }

  for (const f of FEATURED) {
    pool.push({
      id: `feature:${f.href}`,
      kind: "promo",
      label: "ميزة",
      text: normalizeText(`${f.title} — ${f.desc}`),
      href: f.href,
    });
  }

  for (const q of QUICK_LINKS) {
    pool.push({
      id: `quick:${q.href}`,
      kind: "promo",
      label: "اكتشف",
      text: normalizeText(`${q.label} — ${q.desc}`),
      href: q.href,
    });
  }

  const seenText = new Set<string>();
  return pool.filter((item) => {
    if (seenText.has(item.text)) return false;
    seenText.add(item.text);
    return true;
  });
}

/* ── سجل آخر ما عُرض ─────────────────────────────────────────────── */

export function readRecent(storage?: Storage): string[] {
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (!s) return [];
    const raw = s.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeRecent(ids: string[], storage?: Storage): void {
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (!s) return;
    s.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids.slice(-RECENT_LIMIT)));
  } catch {
    /* تجاهل */
  }
}

export function pickNextBatch(
  pool: TickerContentItem[],
  recent: string[],
  count = VISIBLE_ITEMS,
  rand: () => number = Math.random,
): { batch: TickerContentItem[]; recent: string[] } {
  if (pool.length === 0) return { batch: [], recent };

  const lastShown = recent[recent.length - 1];
  const recentSet = new Set(recent.slice(-RECENT_LIMIT));

  let candidates = pool.filter((it) => !recentSet.has(it.id));

  if (candidates.length < count) {
    candidates = pool.filter((it) => it.id !== lastShown);
  }
  if (candidates.length === 0) candidates = pool.slice();

  const shuffled = candidates.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // مزج الأنواع: احرص أن الدفعة ليست كلها من نوع واحد (إحساس إعلاني متنوّع).
  const batch: TickerContentItem[] = [];
  const byKind = new Map<TickerKind, TickerContentItem[]>();
  for (const it of shuffled) {
    const list = byKind.get(it.kind) ?? [];
    list.push(it);
    byKind.set(it.kind, list);
  }
  const kinds = [...byKind.keys()];
  let ki = 0;
  while (batch.length < Math.min(count, shuffled.length) && kinds.length > 0) {
    const kind = kinds[ki % kinds.length];
    const list = byKind.get(kind);
    if (!list || list.length === 0) {
      kinds.splice(ki % kinds.length, 1);
      continue;
    }
    batch.push(list.shift()!);
    ki++;
  }

  const nextRecent = [...recent, ...batch.map((b) => b.id)].slice(-RECENT_LIMIT);
  return { batch, recent: nextRecent };
}

/** فاصل تدوير مسار الإعلان: 50–80 ثانية. */
export function nextRotationDelayMs(rand: () => number = Math.random): number {
  return Math.round((50 + rand() * 30) * 1000);
}

export const REFRESH_ON_RETURN_AFTER_MS = 45_000;

/**
 * مدة حركة الماركي (ثوانٍ): حسب عدد العناصر وطول النصوص حتى
 * يمرّ الحديث/الآية كاملًا بسرعة قابلة للقراءة (~35 حرفًا/ث).
 */
export function marqueeDurationSec(itemCount: number, totalChars = 0): number {
  const byCount = itemCount * 5.5;
  const byChars = totalChars > 0 ? totalChars / 35 : 0;
  return Math.max(28, Math.min(120, Math.max(byCount, byChars)));
}
