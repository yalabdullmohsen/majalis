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
  | "asma" | "hadith" | "sunnah-time" | "explore" | "learning-seasons"
  | "occasions" | "latest-updates" | "library" | "quiz" | "daily-corner"
  | "prayer-ranks" | "interesting-topics" | "mind-map";

export const HOME_WIDGET_DEFS: { id: HomeWidgetId; label: string }[] = [
  { id: "lessons", label: "الدروس والدورات" },
  { id: "prayer", label: "مواقيت الصلاة" },
  { id: "continue", label: "استمر من حيث توقفت" },
  { id: "daily-progress", label: "التقدم اليومي" },
  { id: "week-streak", label: "سجل الأسبوع" },
  { id: "asma", label: "اسم الله اليومي" },
  { id: "hadith", label: "حديث اليوم" },
  { id: "sunnah-time", label: "سنن الوقت" },
  { id: "explore", label: "استكشف المنصة" },
  { id: "learning-seasons", label: "مواسم التعلم" },
  { id: "occasions", label: "المناسبات الإسلامية" },
  { id: "latest-updates", label: "آخر التحديثات" },
  { id: "library", label: "المكتبة العلمية" },
  { id: "quiz", label: "المسابقة" },
  { id: "daily-corner", label: "الركن اليومي" },
  { id: "prayer-ranks", label: "مراتب الصلاة" },
  { id: "interesting-topics", label: "مواضيع مشوقة" },
  { id: "mind-map", label: "الخرائط الذهنية" },
];

const DEFAULT_ORDER: HomeWidgetId[] = HOME_WIDGET_DEFS.map((w) => w.id);
const VALID_IDS = new Set<string>(DEFAULT_ORDER);

export type HomepagePrefs = {
  order: HomeWidgetId[];
  hidden: HomeWidgetId[];
};

const DEFAULT_PREFS: HomepagePrefs = { order: DEFAULT_ORDER, hidden: [] };
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
