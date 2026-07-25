/**
 * مصدر محتوى الشريط العلوي الموحَّد.
 *
 * لماذا وحدة منفصلة عن HeaderTicker.tsx: المكوّن يعرض فقط، وهذا الملف
 * يجمع ويُطبِّع ويمنع التكرار — فيصير المنطق قابلًا للاختبار بلا DOM
 * (انظر src/lib/__tests__/ticker-content.test.ts).
 *
 * المصادر كلها **موجودة مسبقًا وموثّقة داخل المستودع**؛ لا محتوى جديد
 * أُنشئ هنا ولا نص وُلِّد آليًا:
 *   • DAILY_HADITH_POOL       — أحاديث بدرجاتها ورواتها (لا "ضعيف" بينها أصلًا)
 *   • ARBAEEN_NAWAWI     (42)  — متن الأربعين النووية، يمثّل «سنة نبوية»
 *   • ADHKAR_ITEMS            — أذكار الصباح/المساء (kind=dhikr)، وبقية
 *     التصنيفات (استغفار/كرب/استخارة/سفر/نوم…) تمثّل «دعاء مأثور» (kind=dua)
 *   • SEED_FAWAID       (496) — فوائد علمية، مصفّاة بـfilterQualityFawaid
 *     (دالة جودة موجودة أصلًا في content-quality.ts) بدل DAILY_FAIDA_POOL
 *     الصغير (6 فقط)
 *   • DAILY_AYAH_POOL    (30) — آيات بمراجعها (تنويع إضافي غير مذكور صراحة
 *     في الأنواع المطلوبة، أُبقي عليه لأنه محتوى قرآني موثوق ولا يعارض شيئًا)
 * كلها محلية: لا طلب شبكة إضافي إطلاقًا.
 *
 * ⚠ نوع «حكمة/اقتباس» غير مُنفَّذ عمدًا: مصدره الوحيد المتاح في المستودع
 * (HIKAM في src/views/HikamSalafPage.tsx) معرَّف داخل ملف عرض (view) لا
 * lib/، وتصديره يستلزم لمس ملف خارج نطاق «أعلى الصفحة الرئيسية» الذي حصره
 * التكليف صراحة. إن رغب المالك بإضافته، يكفي سطر `export` واحد هناك.
 *
 * قواعد منع التكرار المطلوبة والمطبَّقة (2026-07-25، تكليف تنويع/منع تكرار):
 *   ١) لا يتكرر عنصر ظهر ضمن آخر RECENT_LIMIT (=15) عرضًا.
 *   ٢) لا يظهر نفس النوع (kind) أكثر من مرتين متتاليتين.
 *   ٣) الاختيار عبر «Shuffle Bag»: تُخلط كل المعرّفات مرة واحدة وتُسحب
 *      بالترتيب حتى تفرغ الحقيبة، ثم تُعاد بناؤها — توزيع عادل بدل
 *      اختيار عشوائي مباشر قد يُعيد نفس العنصر بلا داعٍ قبل استنفاد الباقي.
 *   ٤) عند تعارض القيدين ١+٢ مع صغر المجمّع: يُخفَّف القيد الأضعف (النوع)
 *      أولًا، ثم قيد عدم التكرار، وفي أسوأ الأحوال يُستبعد آخر عنصر معروض
 *      تحديدًا فقط — لا يتوقف العرض أبدًا.
 *   ٥) «ميزة التطبيق» (kind=feature): عنصر واحد يومي ثابت طوال اليوم
 *      (getDailyFeatureItem)، يتغيّر تلقائيًا كل يوم هجري/ميلادي بالتوقيت
 *      المحلي ولا يتكرر يومين متتاليين (dayIndex % length يضمن ذلك
 *      رياضيًا طالما عدد الميزات ≥ 2).
 */

import { DAILY_HADITH_POOL, DAILY_AYAH_POOL, getDayIndex } from "./daily-content";
import { ADHKAR_ITEMS } from "./adhkar-seed";
import { ARBAEEN_NAWAWI } from "./arbaeen-nawawi-seed";
import { SEED_FAWAID } from "./fawaid-seed";
import { filterQualityFawaid } from "./content-quality";

export type TickerKind = "hadith" | "sunnah" | "dhikr" | "dua" | "faida" | "ayah" | "feature";

export type TickerContentItem = {
  /** معرّف فريد عبر كل المصادر (بادئة المصدر تمنع التصادم بين النطاقات). */
  id: string;
  kind: TickerKind;
  /** نص كامل بلا قصّ — يُعرض على سطرين أو ثلاثة حسب الطول، لا يُختصر. */
  text: string;
  /**
   * مصدر/تخريج/راوٍ — **داخلي فقط**، لا يُعرض في HeaderTicker.tsx (طلب
   * صريح: إخفاء التخريج ورقم الحديث واسم الكتاب من الواجهة). يبقى هنا
   * لأي استخدام مستقبلي (تصدير، صفحة تفصيل) دون فقدان بيانات التوثيق.
   */
  source?: string;
  href: string;
};

/** شارة نوع صغيرة تُعرض أعلى النص (حديث/ذكر/دعاء/سنة/فائدة/آية/اكتشف). */
export const KIND_LABEL: Record<TickerKind, string> = {
  hadith: "حديث",
  sunnah: "سنة",
  dhikr: "ذكر",
  dua: "دعاء",
  faida: "فائدة",
  ayah: "آية",
  feature: "اكتشف",
};

/** كم عنصرًا سابقًا يُمنع تكرارها. */
export const RECENT_LIMIT = 15;

/** فاصل التدوير: كل 25 ثانية بالضبط (لا نطاق عشوائي). */
export const ROTATION_INTERVAL_MS = 25_000;

/** أقل زمن يمرّ قبل أن تُعدّ العودة من الخلفية سببًا كافيًا للتحديث. */
export const REFRESH_ON_RETURN_AFTER_MS = 25_000;

export const RECENT_STORAGE_KEY = "majlis:ticker:recent:v2";
const DAILY_FEATURE_STORAGE_KEY = "majlis:ticker:daily-feature:v1";

/** تصنيفات adhkar-seed التي تمثّل «أذكار الصباح/المساء» — kind=dhikr. */
const DHIKR_CATEGORY_IDS = new Set(["adh-morning", "adh-evening"]);

/** أي درجة تحوي «ضعيف» تُستبعد — لا عرض جازم لمحتوى غير ثابت. */
function isWeakGrade(grade?: string): boolean {
  return !!grade && grade.includes("ضعيف");
}

/** مؤشرات ميزات فعلية قائمة في الموقع — لا نص تسويقي، ولا صفحات وهمية. */
const FEATURES: TickerContentItem[] = [
  { id: "feature-nations", kind: "feature", text: "الأمم السابقة: قصص وعبر من أخبار الأمم التي أهلكها الله بتكذيبها للرسل", href: "/nations" },
  { id: "feature-prophets", kind: "feature", text: "قصص الأنبياء: سِيَر الأنبياء والمرسلين عليهم السلام كاملة وموثّقة", href: "/prophets" },
  { id: "feature-mushaf", kind: "feature", text: "المصحف: اقرأ القرآن الكريم كاملًا برواياته ومصاحفه المعتمدة", href: "/mushaf" },
  { id: "feature-qa", kind: "feature", text: "سؤال وجواب: اطرح سؤالك الشرعي وابحث في إجابات موثّقة", href: "/qa" },
  { id: "feature-reading-plans", kind: "feature", text: "خطط القراءة: نظّم ختمة القرآن الكريم بخطة تناسب وقتك", href: "/reading-plans" },
  { id: "feature-mawarith", kind: "feature", text: "المواريث: احسب أنصبة الورثة الشرعية بدقة وفق الأحكام الشرعية", href: "/mawarith" },
  { id: "feature-rulings", kind: "feature", text: "الموسوعة العلمية: آلاف المسائل الفقهية الموثّقة في مكان واحد", href: "/rulings" },
];

/**
 * ميزة اليوم — ثابتة طوال اليوم، تتغيّر يوميًا ولا تتكرر يومين متتاليين.
 * dayIndex يزيد بمقدار ١ كل يوم (بتوقيت الكويت، نفس getDayIndex المستخدَم
 * في daily-content.ts)، فـ dayIndex % FEATURES.length يضمن رياضيًا عدم
 * تكرار نفس القيمة يومين متتاليين طالما عدد الميزات ≥ ٢.
 */
export function getDailyFeatureItem(date = new Date(), storage?: Storage): TickerContentItem {
  const todayKey = String(getDayIndex(date));
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (s) {
      const raw = s.getItem(DAILY_FEATURE_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && (parsed as { day?: string }).day === todayKey) {
          const found = FEATURES.find((f) => f.id === (parsed as { id?: string }).id);
          if (found) return found;
        }
      }
    }
    const chosen = FEATURES[getDayIndex(date) % FEATURES.length];
    if (s) s.setItem(DAILY_FEATURE_STORAGE_KEY, JSON.stringify({ day: todayKey, id: chosen.id }));
    return chosen;
  } catch {
    // تخزين معطّل — لا يمنع العرض، فقط لا يُضمن ثبات الاختيار عبر إعادة تحميل الصفحة.
    return FEATURES[getDayIndex(date) % FEATURES.length];
  }
}

/** يبني المجمّع الموحَّد من المصادر المحلية. نقي: نفس المدخلات ⇒ نفس المخرجات. */
export function buildTickerPool(date = new Date(), storage?: Storage): TickerContentItem[] {
  const pool: TickerContentItem[] = [];

  for (const h of DAILY_HADITH_POOL) {
    if (!h?.text || isWeakGrade(h.grade)) continue;
    pool.push({
      id: `hadith:${h.id}`,
      kind: "hadith",
      text: h.text,
      source: [h.narrator, h.source].filter(Boolean).join(" — ") || undefined,
      href: "/hadith",
    });
  }

  for (const a of ARBAEEN_NAWAWI) {
    if (!a?.text) continue;
    pool.push({
      id: `sunnah:${a.id}`,
      kind: "sunnah",
      text: a.text,
      source: a.source || a.title || undefined,
      href: `/arbaeen-nawawi/${a.id}`,
    });
  }

  for (const d of ADHKAR_ITEMS) {
    if (!d?.text || isWeakGrade(d.grade)) continue;
    const isDailyDhikr = DHIKR_CATEGORY_IDS.has(d.categoryId);
    pool.push({
      id: `${isDailyDhikr ? "dhikr" : "dua"}:${d.id}`,
      kind: isDailyDhikr ? "dhikr" : "dua",
      text: d.text,
      source: [d.narrator, d.source].filter(Boolean).join(" — ") || undefined,
      href: "/adhkar",
    });
  }

  for (const f of filterQualityFawaid(SEED_FAWAID)) {
    if (!f?.text || f.status !== "approved") continue;
    pool.push({
      id: `faida:${f.id}`,
      kind: "faida",
      text: f.text,
      source: f.source || undefined,
      href: "/fawaid",
    });
  }

  for (const v of DAILY_AYAH_POOL) {
    if (!v?.text) continue;
    pool.push({
      id: `ayah:${v.id}`,
      kind: "ayah",
      text: v.text,
      source: v.reference || v.surah || undefined,
      href: "/quran-hub",
    });
  }

  pool.push(getDailyFeatureItem(date, storage));

  return pool;
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

/* ── Shuffle Bag ─────────────────────────────────────────────────── */

export type ShuffleBagState = { bag: string[] };

export function createShuffleBag(): ShuffleBagState {
  return { bag: [] };
}

function shuffleIds(ids: string[], rand: () => number): string[] {
  const arr = ids.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * يختار العنصر التالي للعرض عبر حقيبة خلط (Shuffle Bag) مع قيدين:
 * لا تكرار ضمن آخر RECENT_LIMIT، ولا نفس النوع أكثر من مرتين متتاليتين.
 * عند تعذّر تحقيق قيد ما يُخفَّف تدريجيًا (النوع أولًا) بدل توقّف العرض.
 *
 * @param pool      المجمّع الكامل
 * @param recent    معرّفات آخر ما عُرض (الأحدث في النهاية)
 * @param bagState  حالة الحقيبة الحالية (تُحدَّث وتُعاد كإخراج)
 * @param rand      مولّد عشوائي قابل للحقن (يجعل الاختبار حتميًا)
 */
export function pickNextItem(
  pool: TickerContentItem[],
  recent: string[],
  bagState: ShuffleBagState,
  rand: () => number = Math.random,
): { item: TickerContentItem; recent: string[]; bag: ShuffleBagState } {
  if (pool.length === 0) throw new Error("empty ticker pool");

  const byId = new Map(pool.map((p) => [p.id, p]));
  let bag = bagState.bag.filter((id) => byId.has(id));

  const recentIds = recent.slice(-RECENT_LIMIT);
  const recentSet = new Set(recentIds);
  const recentKinds = recentIds.map((id) => byId.get(id)?.kind).filter(Boolean) as TickerKind[];
  const last1 = recentKinds[recentKinds.length - 1];
  const last2 = recentKinds[recentKinds.length - 2];
  const kindCapped = last1 !== undefined && last1 === last2;

  const draw = (): TickerContentItem | undefined => {
    if (bag.length === 0) bag = shuffleIds(Array.from(byId.keys()), rand);
    const id = bag.pop();
    return id ? byId.get(id) : undefined;
  };

  let chosen: TickerContentItem | undefined;
  const maxAttempts = pool.length * 2 + 4;

  // محاولة أولى: كلا القيدين معًا.
  for (let i = 0; i < maxAttempts && !chosen; i++) {
    const item = draw();
    if (!item) break;
    if (recentSet.has(item.id)) continue;
    if (kindCapped && item.kind === last1) continue;
    chosen = item;
  }

  // تخفيف: تجاهل قيد النوع، أبقِ منع التكرار ضمن آخر 15.
  if (!chosen) {
    for (let i = 0; i < maxAttempts && !chosen; i++) {
      const item = draw();
      if (!item) break;
      if (recentSet.has(item.id)) continue;
      chosen = item;
    }
  }

  // ملاذ أخير: مجمّع أصغر من نافذة المنع — اقبل أي شيء غير آخر عنصر عُرض
  // فعليًا، فلا يتكرر العنصر نفسه مرتين متتاليتين على الأقل.
  if (!chosen) {
    const lastId = recentIds[recentIds.length - 1];
    chosen = pool.find((p) => p.id !== lastId) ?? pool[0];
  }

  const nextRecent = [...recent, chosen.id].slice(-RECENT_LIMIT);
  return { item: chosen, recent: nextRecent, bag: { bag } };
}
