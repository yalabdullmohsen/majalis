/**
 * تفضيلات ترتيب/إظهار أقسام الصفحة الرئيسية القابلة للتخصيص. محلي دائمًا
 * (يعمل فورًا بلا اتصال)، ويُزامَن مع Supabase عند تسجيل الدخول (جدول
 * user_homepage_prefs، صف واحد لكل مستخدم، نفس نمط user_learning_plans).
 *
 * القسمان الثابتان (البطل والبحث في الأعلى، "عن المجلس العلمي" في الأسفل)
 * غير قابلين للتخصيص عمدًا — هوية الصفحة الأساسية وخاتمتها.
 */
import { supabase } from "@/lib/supabase";

export type HomeWidgetId =
  | "lessons" | "prayer" | "continue" | "daily-progress" | "week-streak"
  | "asma" | "sunnah-time" | "explore" | "learning-seasons"
  | "occasions" | "latest-updates" | "library" | "quiz"
  | "prayer-ranks" | "interesting-topics" | "mind-map" | "daily-benefits" | "upcoming-events";

/* ترتيب افتراضي — تحديث 2026-07-19 (تكليف ثانٍ، بند 4): "التقدم اليومي" كان
   ثاني ودجت (مباشرة بعد "استمر من حيث توقفت")؛ نُقل إلى آخر القائمة فعليًا
   (نهاية الرئيسية)، وحلّ "الدروس والدورات" مكانه — بطاقات دروس مختصرة مباشرة
   بعد ودجت المتابعة، بدل "تقدم الورد اليومي". بقية الترتيب لم يتغيّر. هذا
   الترتيب للمستخدمين الجدد/بلا تفضيل محفوظ فقط — أي مستخدم خصَّص ترتيبه
   سابقاً (محلياً أو عبر user_homepage_prefs) يبقى ترتيبه كما هو. لا حذف لأي
   ودجت — "التقدم اليومي" ما زال ظاهرًا، فقط آخر القائمة. */
export const HOME_WIDGET_DEFS: { id: HomeWidgetId; label: string }[] = [
  { id: "continue", label: "استمر من حيث توقفت" },
  { id: "lessons", label: "الدروس والدورات" },
  { id: "learning-seasons", label: "مواسم التعلم" },
  { id: "asma", label: "اسم الله اليومي" },
  { id: "daily-benefits", label: "فوائد منتقاة" },
  { id: "upcoming-events", label: "فعاليات وإعلانات علمية" },
  { id: "library", label: "المكتبة العلمية" },
  { id: "quiz", label: "المسابقة" },
  { id: "sunnah-time", label: "سنن الوقت" },
  { id: "week-streak", label: "سجل الأسبوع" },
  { id: "mind-map", label: "الخرائط الذهنية" },
  { id: "prayer-ranks", label: "مراتب الصلاة" },
  { id: "occasions", label: "المناسبات الإسلامية" },
  { id: "latest-updates", label: "آخر التحديثات" },
  { id: "interesting-topics", label: "مواضيع مشوقة" },
  { id: "prayer", label: "مواقيت الصلاة" },
  { id: "explore", label: "استكشف المنصة" },
  { id: "daily-progress", label: "التقدم اليومي" },
];

const DEFAULT_ORDER: HomeWidgetId[] = HOME_WIDGET_DEFS.map((w) => w.id);
const VALID_IDS = new Set<string>(DEFAULT_ORDER);

export type HomepagePrefs = {
  order: HomeWidgetId[];
  hidden: HomeWidgetId[];
};

/* تخفيف الازدحام الافتراضي (تحديث 2026-07-19): ودجتات ذات أولوية
   أدنى أو متداخلة مع محتوى آخر ظاهر أصلاً في الصفحة تُخفى افتراضياً فقط
   للمستخدم الجديد/بلا تفضيل محفوظ. لا حذف لأي وظيفة — كل ودجت يبقى قابلاً
   لإعادة الإظهار فوراً عبر "تخصيص الصفحة الرئيسية":
   - occasions: يتداخل مع تذكير الشهر الهجري الظاهر أعلى الصفحة أصلاً.
   - prayer-ranks: يتداخل موضوعياً مع ودجت الصلاة البارز أصلاً.
   - interesting-topics: محتوى اكتشاف ثانوي (موثّق أنه "قُرب النهاية").
   - latest-updates: تغذية تحديثات عامة، أولوية أقل من التقدم الشخصي.
   - prayer: أصبح مكرَّرًا بعد إعادة الهيكلة — البطاقة اليومية أعلى الصفحة
     تعرض الصلاة القادمة والعد التنازلي فعلاً، وتبويب "الصلاة" الجديد في
     الشريط السفلي يفتح التفاصيل الكاملة مباشرة (2026-07-19).
   تحديث 2026-07-23 (توحيد الأقسام اليومية): ودجتا "حديث اليوم" (hadith)
   و"الركن اليومي" (daily-corner) أُزيلا نهائيًا من HOME_WIDGET_DEFS نفسها
   (لا مجرد إخفاء) — محتواهما الآن جزء من «مجلس اليوم» الموحّد
   (HomeMajlisToday، ثابت أعلى الصفحة، غير قابل للتخصيص أصلاً). أي تفضيل
   محلي محفوظ يحوي هذين المعرّفين يُفلتَر تلقائيًا عبر VALID_IDS أدناه. */
const DEFAULT_HIDDEN: HomeWidgetId[] = [
  "occasions", "prayer-ranks", "interesting-topics", "latest-updates", "prayer",
  "asma", "sunnah-time", "explore", "week-streak", "mind-map",
  "daily-benefits", "upcoming-events", "quiz", "library",
];
const DEFAULT_PREFS: HomepagePrefs = { order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN };
const STORAGE_KEY = "majalis-homepage-prefs-v1";

function sanitizePrefs(raw: unknown): HomepagePrefs {
  const obj = (raw ?? {}) as Partial<HomepagePrefs>;
  const rawOrder = Array.isArray(obj.order) ? obj.order.filter((id): id is HomeWidgetId => VALID_IDS.has(id)) : [];
  const missing = DEFAULT_ORDER.filter((id) => !rawOrder.includes(id));
  const order = [...rawOrder, ...missing];
  const hidden = Array.isArray(obj.hidden) ? obj.hidden.filter((id): id is HomeWidgetId => VALID_IDS.has(id)) : [];
  return { order, hidden };
}

export function getLocalHomepagePrefs(): HomepagePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return sanitizePrefs(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveLocalHomepagePrefs(prefs: HomepagePrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* localStorage غير متاح — تجاهل بصمت، التخصيص ميزة تكميلية */
  }
}

export function resetHomepagePrefs(): HomepagePrefs {
  const prefs = { ...DEFAULT_PREFS };
  saveLocalHomepagePrefs(prefs);
  return prefs;
}

/** الترتيب الظاهر فقط (بعد استبعاد المخفي)، بترتيب المستخدم. */
export function visibleWidgetOrder(prefs: HomepagePrefs): HomeWidgetId[] {
  const hiddenSet = new Set(prefs.hidden);
  return prefs.order.filter((id) => !hiddenSet.has(id));
}

export async function fetchRemoteHomepagePrefs(userId: string): Promise<HomepagePrefs | null> {
  try {
    const { data, error } = await supabase
      .from("user_homepage_prefs")
      .select("widget_order, hidden_widgets")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return sanitizePrefs({ order: data.widget_order, hidden: data.hidden_widgets });
  } catch {
    return null;
  }
}

export async function saveRemoteHomepagePrefs(userId: string, prefs: HomepagePrefs): Promise<void> {
  try {
    await supabase.from("user_homepage_prefs").upsert(
      {
        user_id: userId,
        widget_order: prefs.order,
        hidden_widgets: prefs.hidden,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch {
    /* مزامنة تكميلية — التفضيل المحلي يبقى ساري المفعول دائمًا */
  }
}
