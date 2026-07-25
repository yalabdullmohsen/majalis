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
 *   • DAILY_HADITH_POOL  — أحاديث بدرجاتها ورواتها (تشمل الأربعين النووية
 *     مدمَجةً مسبقًا؛ لا يُستورَد ARBAEEN_NAWAWI هنا مرة ثانية كي لا يتكرر
 *     نفس الحديث بمعرّفين مختلفين في الشريط)
 *   • ADHKAR_ITEMS       — أذكار الصباح والمساء فقط
 *   • DAILY_AYAH_POOL    — آيات بمراجعها
 *   • DAILY_FAIDA_POOL   — فوائد بمصادرها
 * كلها محلية: لا طلب شبكة إضافي إطلاقًا. `buildTickerPool` تُسقط أي عنصر
 * بلا نص كامل تلقائيًا (حرص أول)، ثم تُزيل أي تكرار نصّي حرفي عبر كل
 * المصادر (حرص ثانٍ — بعض أذكار الصباح والمساء يتطابق نصّها).
 *
 * قواعد منع التكرار المطلوبة والمطبَّقة أثناء الدوران (مستقلة عن إزالة
 * التكرار البنيوي أعلاه):
 *   ١) لا يتكرر عنصر ظهر ضمن آخر RECENT_LIMIT (=20) عرضًا.
 *   ٢) لا يظهر العنصر نفسه مرتين متتاليتين (حالة خاصة من ١، وتبقى قائمة
 *      حتى لو نفدت العناصر واضطررنا لإعادة الخلط).
 *   ٣) عند نفاد غير المكرر يُعاد الخلط وتبدأ دورة جديدة مع إبقاء القاعدة ٢.
 */

import { DAILY_HADITH_POOL, DAILY_AYAH_POOL, DAILY_FAIDA_POOL } from "./daily-content";
import { ADHKAR_ITEMS } from "./adhkar-seed";

export type TickerKind = "hadith" | "dhikr" | "ayah" | "faida";

export type TickerContentItem = {
  /** معرّف فريد عبر كل المصادر (بادئة المصدر تمنع التصادم بين النطاقات). */
  id: string;
  kind: TickerKind;
  label: string;
  text: string;
  source?: string;
  href: string;
};

/** عدد العناصر المعروضة في دورة واحدة من الشريط. */
export const VISIBLE_ITEMS = 4;

/** كم عنصرًا سابقًا يُمنع تكرارها. */
export const RECENT_LIMIT = 20;

export const RECENT_STORAGE_KEY = "majlis:ticker:recent:v1";

/** يُطبِّع المسافات فقط (لا يقصّ الطول) — التطبيع يمنع اختلافات شكلية
    زائفة عند مقارنة النصوص لإزالة التكرار. */
function normalizeText(text: string): string {
  return String(text || "").replace(/\s+/g, " ").trim();
}

/** يبني المجمّع الموحَّد من المصادر المحلية. نقي: نفس المدخلات ⇒ نفس المخرجات.
    كل عنصر بلا نص كامل يُستبعَد (لا يُعرض ناقصًا)، والنص المعروض هو المتن
    الكامل من مصدره دون أي قصّ أو تلخيص. */
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

  for (const d of ADHKAR_ITEMS) {
    if (!d?.text?.trim()) continue;
    // أذكار الصباح والمساء فقط: بقية التصنيفات (أذكار النوم/السفر…) مرتبطة
    // بسياق لا يناسب شريطًا يعمل طوال اليوم.
    if (d.categoryId !== "adh-morning" && d.categoryId !== "adh-evening") continue;
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
      href: "/quran-hub",
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
      href: "/fawaid",
    });
  }

  // إزالة التكرار النصّي الحرفي عبر كل المصادر (مثلًا: بعض أذكار الصباح
  // والمساء نصّها متطابق تمامًا) — يُبقي أول ظهور فقط.
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
    // تخزين معطّل (وضع خاص/حصة ممتلئة) — الشريط يعمل بلا سجل، لا يتعطّل.
    return [];
  }
}

export function writeRecent(ids: string[], storage?: Storage): void {
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (!s) return;
    s.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids.slice(-RECENT_LIMIT)));
  } catch {
    /* تجاهل: تعذّر الحفظ لا يمنع العرض */
  }
}

/**
 * يختار دفعة العرض التالية.
 *
 * @param pool     المجمّع الكامل
 * @param recent   معرّفات آخر ما عُرض (الأحدث في النهاية)
 * @param count    كم عنصرًا نريد
 * @param rand     مولّد عشوائي قابل للحقن (يجعل الاختبار حتميًا)
 * @returns الدفعة المختارة وسجل «الأخيرة» بعد التحديث
 */
export function pickNextBatch(
  pool: TickerContentItem[],
  recent: string[],
  count = VISIBLE_ITEMS,
  rand: () => number = Math.random,
): { batch: TickerContentItem[]; recent: string[] } {
  if (pool.length === 0) return { batch: [], recent };

  const lastShown = recent[recent.length - 1];
  const recentSet = new Set(recent.slice(-RECENT_LIMIT));

  // المرشّحون: ما لم يظهر ضمن آخر 20.
  let candidates = pool.filter((it) => !recentSet.has(it.id));

  // نفدت العناصر غير المكررة ⇒ دورة جديدة. القاعدة (٢) تبقى سارية: نستبعد
  // آخر عنصر عُرض تحديدًا كي لا يظهر مرتين متتاليتين عبر حدّ الدورتين.
  if (candidates.length < count) {
    candidates = pool.filter((it) => it.id !== lastShown);
  }
  if (candidates.length === 0) candidates = pool.slice();

  // خلط Fisher–Yates على نسخة (لا نطفر على المجمّع الأصلي).
  const shuffled = candidates.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const batch = shuffled.slice(0, Math.min(count, shuffled.length));
  const nextRecent = [...recent, ...batch.map((b) => b.id)].slice(-RECENT_LIMIT);
  return { batch, recent: nextRecent };
}

/** فاصل التدوير: 45–90 ثانية (بالمللي ثانية). */
export function nextRotationDelayMs(rand: () => number = Math.random): number {
  return Math.round((45 + rand() * 45) * 1000);
}

/** أقل زمن يمرّ قبل أن تُعدّ العودة من الخلفية سببًا كافيًا للتحديث. */
export const REFRESH_ON_RETURN_AFTER_MS = 45_000;
