const KEY = "msk_recent_pages";
const MAX = 8;

export interface RecentPage {
  href: string;
  label: string;
  visitedAt: number;
}

/**
 * LABEL_MAP — مصدر الحقيقة الوحيد لأسماء الأقسام بالعربية.
 * يغطي كل المسارات الموجودة في App.tsx — لا يحتاج أي قسم إلى منطق
 * بديل إذا كانت مسارته مدرجة هنا.
 */
const LABEL_MAP: Record<string, string> = {
  // ─── الصفحة الرئيسية ─────────────────────────────────────────────
  "/":                              "الرئيسية",

  // ─── القرآن الكريم ────────────────────────────────────────────────
  "/quran":                         "القرآن الكريم",
  "/quran-radio":                   "إذاعة القرآن",
  "/quran-live":                    "القرآن المباشر",
  "/quran-circles":                 "حلقات القرآن",
  "/quran-hub":                     "مركز القرآن",
  "/quran/tajweed":                 "أحكام التجويد",
  "/quran/surah-stories":           "قصص السور",
  "/surah-stories":                 "قصص السور",
  "/ulum-quran":                    "علوم القرآن",

  // ─── الأذكار والعبادة ─────────────────────────────────────────────
  "/adhkar":                        "الأذكار",
  "/prayer-times":                  "مواقيت الصلاة",
  "/prayer-countdown":              "العد التنازلي للصلاة",
  "/prayer-ranks":                  "درجات الصلاة",
  "/qibla":                         "القبلة",
  "/tasbih":                        "التسبيح",
  "/daily-wird":                    "الورد اليومي",
  "/duas":                          "الأدعية",
  "/duas-quran":                    "أدعية القرآن",
  "/salah-guide":                   "دليل الصلاة",
  "/hajj":                          "الحج",
  "/sawm":                          "الصيام",
  "/zakat":                         "الزكاة",
  "/janaza":                        "أحكام الجنازة",
  "/tahara":                        "أحكام الطهارة",
  "/adhan-settings":                "إعدادات الأذان",
  "/muezzins":                      "المؤذنون",

  // ─── الدروس والدورات ──────────────────────────────────────────────
  "/lessons":                       "الدروس",
  "/lesson":                        "درس",
  "/annual-courses":                "الدورات العلمية",
  "/kuwait-lessons":                "دروس الكويت",
  "/start-here":                    "ابدأ من هنا",
  "/adab-talab-ilm":                "آداب طلب العلم",

  // ─── التعلم والمسارات ─────────────────────────────────────────────
  "/learning":                      "التعلم",
  "/learning/paths":                "مسارات التعلم",
  "/learning/quiz":                 "اختبار المسار",
  "/learning/calendar":             "تقويم التعلم",
  "/learning/certificates":         "الشهادات",
  "/my-learning":                   "تعلمي",
  "/learning-path":                 "خارطة طالب العلم",
  "/learning-plan":                 "خطة التعلم",
  "/knowledge-map":                 "خارطة المعرفة",
  "/knowledge-graph":               "مخطط المعرفة",
  "/mind-map":                      "خرائط المفاهيم",
  "/flashcards":                    "البطاقات الدعوية",
  "/cards":                         "البطاقات",
  "/study-room":                    "غرفة الدراسة",

  // ─── الحديث النبوي ────────────────────────────────────────────────
  "/hadith":                        "الأحاديث",
  "/hadith/books":                  "كتب الحديث",
  "/hadith/sahih":                  "الأحاديث الصحيحة",
  "/hadith/daif":                   "الأحاديث الضعيفة",
  "/hadith/mawdu":                  "الأحاديث الموضوعة",
  "/hadith-science":                "علوم الحديث",
  "/arbaeen-nawawi":                "الأربعون النووية",

  // ─── الفقه والمجمع ────────────────────────────────────────────────
  "/fiqh":                          "الفقه",
  "/fiqh-council":                  "المجمع الفقهي",
  "/fiqh-council/resolutions":      "قرارات المجمع الفقهي",
  "/fiqh-council/fatwas":           "فتاوى المجمع الفقهي",
  "/fiqh-council/recommendations":  "توصيات المجمع",
  "/fiqh-council/nawazil":          "النوازل الفقهية",
  "/fiqh-council/research":         "البحوث الفقهية",
  "/fiqh-council/categories":       "تصنيفات المجمع",
  "/fiqh-council/search":           "البحث المتقدم",
  "/fiqh-council/research-assistant": "مساعد البحث الفقهي",
  "/fiqh-council/compare":          "مقارنة المسائل",
  "/fiqh-council/archive":          "أرشيف المجمع",
  "/fiqh-council/live":             "الجلسات المباشرة",
  "/fiqh-council/issues":           "المسائل الفقهية",
  "/fiqh-council/index":            "فهرس المواضيع",
  "/fiqh-council/stats":            "إحصائيات المجمع",
  "/fiqh-qawaid":                   "القواعد الفقهية",
  "/madhahib":                      "المذاهب الفقهية",
  "/fatwa":                         "الفتاوى",
  "/rulings":                       "الأحكام الشرعية",
  "/amr-bil-maruf":                 "الأمر بالمعروف والنهي عن المنكر",

  // ─── العقيدة ──────────────────────────────────────────────────────
  "/tawhid":                        "التوحيد",
  "/arkan":                         "أركان الإسلام",
  "/arkan-iman":                    "أركان الإيمان",
  "/asma-husna":                    "الأسماء الحسنى",
  "/malaika":                       "الملائكة",
  "/janna-naar":                    "الجنة والنار",
  "/alamat-saah":                   "أشراط الساعة",
  "/tawba":                         "التوبة",
  "/islamic-sects":                 "الفرق والمذاهب",

  // ─── السيرة والتاريخ ──────────────────────────────────────────────
  "/seerah":                        "السيرة النبوية",
  "/prophets":                      "الأنبياء",
  "/anbiya":                        "الأنبياء",
  "/prophet-stories":               "قصص الأنبياء",
  "/prophetic-medicine":            "الطب النبوي",
  "/sahabah":                       "الصحابة",
  "/hikam-salaf":                   "حكم السلف",
  "/shamael":                       "الشمائل النبوية",
  "/wasaya-nabawiyya":              "الوصايا النبوية",
  "/sunan-yawmiyya":                "السنن اليومية",

  // ─── الإعجاز والعلوم ──────────────────────────────────────────────
  "/miracles":                      "الإعجاز العلمي",
  "/islam-stats":                   "إحصائيات الإسلام",

  // ─── المكتبة والبحث ───────────────────────────────────────────────
  "/library":                       "المكتبة",
  "/fawaid":                        "الفوائد",
  "/qa":                            "الأسئلة والأجوبة",
  "/topics":                        "المواضيع",
  "/research":                      "البحث العلمي",
  "/scholarly-research":            "البحث الأكاديمي",
  "/academic-research":             "البحث الأكاديمي",
  "/researcher":                    "صفحة الباحث",
  "/mawarith":                      "المواريث",

  // ─── الأخلاق والرقائق ─────────────────────────────────────────────
  "/akhlaq":                        "الأخلاق",
  "/raqaiq":                        "الرقائق",
  "/fadail-aamal":                  "فضائل الأعمال",

  // ─── القصص ────────────────────────────────────────────────────────
  "/stories":                       "القصص",
  "/islamic-stories":               "القصص الإسلامية",

  // ─── المسابقات والاختبارات ────────────────────────────────────────
  "/quiz":                          "المسابقات",

  // ─── الأدوات والخدمات ─────────────────────────────────────────────
  "/assistant":                     "المساعد العلمي",
  "/calendar":                      "التقويم الهجري",
  "/occasions":                     "المناسبات الإسلامية",
  "/transcribe":                    "تفريغ الصوت",
  "/search":                        "البحث",
  "/islamic-glossary":              "المصطلحات الإسلامية",

  // ─── العلماء والمؤسسات ────────────────────────────────────────────
  "/scholars":                      "العلماء",
  "/universities":                  "الجامعات",
  "/universities/compare":          "مقارنة الجامعات",
  "/institutions":                  "المؤسسات العلمية",

  // ─── أوضاع خاصة ──────────────────────────────────────────────────
  "/car-mode":                      "وضع السيارة",
  "/family-mode":                   "وضع الأسرة",
  "/family":                        "وضع الأسرة",
  "/mosque-mode":                   "وضع المسجد",

  // ─── الأرشيف والمستجدات ───────────────────────────────────────────
  "/vault":                         "الأرشيف",
  "/updates":                       "المستجدات",

  // ─── المستخدم والإعدادات ──────────────────────────────────────────
  "/stats":                         "إحصائياتي",
  "/profile":                       "الملف الشخصي",
  "/my-citations":                  "اقتباساتي",
  "/my-submissions":                "مشاركاتي",
  "/notification-settings":         "إعدادات الإشعارات",
  "/submit":                        "إرسال محتوى",
  "/upload":                        "رفع المحتوى",

  // ─── معلومات ──────────────────────────────────────────────────────
  "/about":                         "عن المنصة",
  "/methodology":                   "منهجيتنا",
  "/sitemap":                       "خريطة الموقع",
  "/features-in-progress":          "الميزات قيد التطوير",
  "/c":                             "محتوى",
  "/islamic-landmarks":             "المشاهد الإسلامية والمساجد التاريخية",
};

/**
 * يحدد تسمية عربية للمسار بأفضل تطابق ممكن.
 * الأولوية: مطابقة تامة ← مطابقة المسار الفرعي ← مطابقة القسم الجذر.
 * لا يُرجع مطلقًا نصًا إنجليزيًا خامًا.
 */
function labelFor(href: string): string {
  // 1) مطابقة تامة
  if (LABEL_MAP[href]) return LABEL_MAP[href];

  // 2) مطابقة تصاعدية: جرّب أطول بادئة أولًا
  const parts = href.split("/").filter(Boolean);
  for (let len = parts.length - 1; len >= 1; len--) {
    const candidate = "/" + parts.slice(0, len).join("/");
    if (LABEL_MAP[candidate]) return LABEL_MAP[candidate];
  }

  // 3) المسار الجذر فقط
  if (parts.length > 0) {
    const root = "/" + parts[0];
    if (LABEL_MAP[root]) return LABEL_MAP[root];
  }

  // 4) آخر ملجأ — أعِد المسار كاملًا بدلًا من جزء إنجليزي غير مفهوم
  return href;
}

const SKIP_PATHS = new Set([
  "/login", "/register", "/admin", "/auth",
  "/privacy", "/terms", "/about", "/contact", "/404",
  "/settings", "/developer", "/developers", "/account-deletion",
]);

function shouldSkip(href: string): boolean {
  if (href === "/") return true;
  for (const skip of SKIP_PATHS) {
    if (href === skip || href.startsWith(skip + "/")) return true;
  }
  return false;
}

/**
 * يُرقِّل البيانات القديمة المخزنة التي قد تحمل أسماءً إنجليزية.
 * يُعيد توليد label من LABEL_MAP لكل إدخال محفوظ.
 */
function migrateStoredPages(pages: RecentPage[]): RecentPage[] {
  return pages.map((page) => ({
    ...page,
    label: labelFor(page.href),
  }));
}

export function recordRecentPage(href: string): void {
  if (shouldSkip(href)) return;
  try {
    const raw = localStorage.getItem(KEY);
    const stored: RecentPage[] = raw ? JSON.parse(raw) : [];
    const migrated = migrateStoredPages(stored);
    const filtered = migrated.filter((p) => p.href !== href);
    filtered.unshift({ href, label: labelFor(href), visitedAt: Date.now() });
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
    const migrated = migrateStoredPages(pages);
    // persist migration silently
    try { localStorage.setItem(KEY, JSON.stringify(migrated)); } catch { /* ok */ }
    return migrated.slice(0, limit);
  } catch {
    return [];
  }
}
