const KEY = "msk_recent_pages";
const MAX = 8;

export interface RecentPage {
  href: string;
  label: string;
  visitedAt: number;
}

const LABEL_MAP: Record<string, string> = {
  "/":                    "الرئيسية",
  "/quran":               "القرآن الكريم",
  "/quran-radio":         "إذاعة القرآن",
  "/adhkar":              "الأذكار",
  "/prayer-times":        "مواقيت الصلاة",
  "/lessons":             "الدروس",
  "/lesson":              "درس",
  "/hadith":              "الأحاديث",
  "/fawaid":              "الفوائد",
  "/qa":                  "الأسئلة",
  "/fatwa":               "الفتاوى",
  "/rulings":             "الأحكام الشرعية",
  "/fiqh":                "الفقه",
  "/fiqh-council":        "المجمع الفقهي",
  "/library":             "المكتبة",
  "/seerah":              "السيرة النبوية",
  "/tasbih":              "التسبيح",
  "/tawhid":              "التوحيد",
  "/miracles":            "الإعجاز العلمي",
  "/quiz":                "المسابقات",
  "/assistant":           "المساعد العلمي",
  "/calendar":            "التقويم الهجري",
  "/qibla":               "القبلة",
  "/daily-wird":          "الورد اليومي",
  "/flashcards":          "البطاقات الدعوية",
  "/learning-path":       "خارطة طالب العلم",
  "/occasions":           "المناسبات",
  "/updates":             "المستجدات",
  "/muezzins":            "المؤذنون",
  "/arbaeen-nawawi":      "الأربعون النووية",
  "/annual-courses":      "الدورات العلمية",
  "/search":              "البحث",
  "/prophets":            "قصص الأنبياء",
  "/islamic-stories":     "القصص الإسلامية",
  "/stories":             "القصص",
  "/universities":        "الجامعات",
  "/car-mode":            "وضع السيارة",
  "/family-mode":         "وضع الأسرة",
  "/vault":               "الأرشيف",
  "/study-room":          "غرفة الدراسة",
};

function labelFor(href: string): string {
  if (LABEL_MAP[href]) return LABEL_MAP[href];
  const segments = href.split("/");
  const base = "/" + segments[1];
  return LABEL_MAP[base] ?? segments[segments.length - 1] ?? href;
}

const SKIP_PATHS = new Set([
  "/login", "/register", "/admin", "/auth-callback",
  "/privacy", "/terms", "/about", "/contact", "/404",
  "/settings", "/developer",
]);

function shouldSkip(href: string): boolean {
  if (href === "/") return true;
  for (const skip of SKIP_PATHS) {
    if (href === skip || href.startsWith(skip + "/")) return true;
  }
  return false;
}

export function recordRecentPage(href: string): void {
  if (shouldSkip(href)) return;
  try {
    const raw = localStorage.getItem(KEY);
    const pages: RecentPage[] = raw ? JSON.parse(raw) : [];
    const filtered = pages.filter((p) => p.href !== href);
    const label = labelFor(href);
    filtered.unshift({ href, label, visitedAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
  } catch {
    // localStorage might be unavailable
  }
}

export function getRecentPages(limit = 6): RecentPage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const pages: RecentPage[] = JSON.parse(raw);
    return pages.slice(0, limit);
  } catch {
    return [];
  }
}
