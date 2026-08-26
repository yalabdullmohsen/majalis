import { resolveMergedPath } from "@/lib/nav-visibility";
import { readLocalJson, writeLocalJson } from "@/lib/safe-json";

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
  "/quran-circles":                 "حلقات القرآن",
  "/quran-hub":                     "مركز القرآن",
  "/quran/tajweed":                 "أحكام التجويد",
  "/quran-hub/tajweed":             "التجويد",
  "/quran-hub/qiraat":              "القراءات العشر",
  "/quran-hub/tilawa":              "التلاوة والقرّاء",
  "/quran-hub/terms":               "مصطلحات علوم القرآن",
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

  // ─── الدروس والدورات ──────────────────────────────────────────────
  "/lessons":                       "الدروس",
  "/lesson":                        "درس",
  "/annual-courses":                "الدورات العلمية",
  "/kuwait-lessons":                "دروس الكويت",
  "/start-here":                    "ابدأ من هنا",
  "/adab-talab-ilm":                "آداب طلب العلم",

  // ─── التعلم (تحويلات قديمة تبقى للتسمية إن وُجدت في السجل) ─────────
  "/learning":                      "التعلم",
  "/learning/quiz":                 "اختبار",
  "/learning/calendar":             "تقويم التعلم",
  "/learning/certificates":         "الشهادات",
  "/my-learning":                   "تعلمي",
  "/knowledge-map":                 "الرئيسية",
  "/knowledge-graph":               "الرئيسية",
  "/mind-map":                      "الخرائط الذهنية",
  "/flashcards":                    "بطاقات المراجعة",
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
  "/rulings":                       "الأحكام الشرعية",
  "/amr-bil-maruf":                 "الأمر بالمعروف والنهي عن المنكر",

  // ─── العقيدة ──────────────────────────────────────────────────────
  "/tawhid":                        "التوحيد",
  "/arkan":                         "أركان الإسلام",
  "/arkan-iman":                    "أركان الإيمان",
  "/asma-husna":                    "الأسماء الحسنى",
  "/learn/aqeedat-ahl-sunnah":      "عقيدة أهل السنة والجماعة",
  "/learn/aqsam-tawheed":           "أقسام التوحيد",
  "/learn/nawaqid-islam":           "نواقض الإسلام",
  "/learn/iman-billah":             "الإيمان بالله",
  "/islamic-sects":                 "الفرق والمذاهب",
  "/durus-imaniyya":                "دروس إيمانية",
  "/durus-mutanawwia":              "دروس متنوعة",
  "/iman-topics":                   "موضوعات إيمانية",
  "/quran-studies":                 "دراسات قرآنية",
  "/sunnah-studies":                "دراسات سنية",
  "/tazkiya-topics":                "موضوعات التزكية",
  "/tarikh-islami":                 "التاريخ الإسلامي",
  "/usra-mujtama":                  "الأسرة والمجتمع",
  "/fikr-waqia":                    "الفكر والواقع",
  "/mawsuaat":                      "فهارس الموسوعات",
  "/arabic-language":               "اللغة العربية",
  "/maqasid-sharia":                "مقاصد الشريعة",
  "/dalail-nubuwwah":               "دلائل النبوة",
  "/malaika":                       "الملائكة",
  "/janna-naar":                    "الجنة والنار",
  "/alamat-saah":                   "أشراط الساعة",
  "/tawba":                         "التوبة",

  // ─── السيرة والتاريخ ──────────────────────────────────────────────
  "/seerah":                        "السيرة النبوية",
  "/prophets":                      "الأنبياء",
  "/nations":                       "الأمم السابقة",
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
  "/library":                       "الرئيسية",
  "/fawaid":                        "الفوائد",
  "/research":                      "البحث العلمي",
  "/scholarly-research":            "البحث الأكاديمي",
  "/academic-research":             "الأبحاث الشرعية",
  "/academic-research/submit":      "أضف بحثًا",
  "/academic-research/assistant":   "مساعدة الباحث",
  "/researcher":                    "صفحة الباحث",
  "/researcher-profile":            "صفحة الباحث",
  "/mawarith":                      "المواريث",

  // ─── الأخلاق والرقائق ─────────────────────────────────────────────
  "/akhlaq":                        "الأخلاق",
  "/raqaiq":                        "الرقائق",
  "/fadail-aamal":                  "فضائل الأعمال",

  // ─── القصص ────────────────────────────────────────────────────────
  "/stories":                       "القصص",

  // ─── الأسئلة والمسابقات ───────────────────────────────────────────
  "/quiz":                          "لعبة سين جيم",

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
  "/updates":                       "الرئيسية",

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
  "/quran-memorization":            "اختبارات الحفظ القرآني",
  "/quran/hifz-loop":               "مشغّل التحفيظ",
  "/quran/worship-hub":             "مركز العبادة القرآنية",
  "/quran/offline-player":        "مشغّل التلاوة التفاعلي",
  "/mutashabihat":                  "الآيات المتشابهات",
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
  "/settings", "/account-deletion",
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
  const seen = new Set<string>();
  const out: RecentPage[] = [];
  for (const page of pages) {
    const href = resolveMergedPath(page.href);
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ ...page, href, label: labelFor(href) });
  }
  return out;
}

/**
 * عنوان صفحة تفصيل حقيقي (مثلًا عنوان الدرس نفسه) أدق من التسمية العامة
 * للقسم ("الدروس") — يُقبل فقط لصفحات تفصيل حقيقية (مسار بأكثر من جزء)
 * وعنوان مغاير فعلًا عن التسمية العامة، تفاديًا لقبول عناوين حالة تحميل
 * عابرة أو انتقال غير مكتمل.
 */
function preferSpecificTitle(href: string, specificTitle: string | undefined, generic: string): string {
  if (!specificTitle) return generic;
  const cleaned = specificTitle.trim();
  if (!cleaned || cleaned === generic) return generic;
  const segments = href.split("/").filter(Boolean);
  if (segments.length < 2) return generic; // صفحة قسم جذرية، لا تفصيل
  return cleaned;
}

function isRecentPage(v: unknown): v is RecentPage {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as RecentPage).href === "string" &&
    typeof (v as RecentPage).label === "string" &&
    typeof (v as RecentPage).visitedAt === "number"
  );
}

function isRecentPageList(v: unknown): v is RecentPage[] {
  return Array.isArray(v) && v.every(isRecentPage);
}

export function recordRecentPage(href: string, specificTitle?: string): void {
  const resolved = resolveMergedPath(href);
  if (shouldSkip(resolved)) return;
  try {
    const stored = readLocalJson<RecentPage[]>(KEY, [], isRecentPageList);
    const migrated = migrateStoredPages(stored);
    const filtered = migrated.filter((p) => p.href !== resolved);
    const generic = labelFor(resolved);
    filtered.unshift({
      href: resolved,
      label: preferSpecificTitle(resolved, specificTitle, generic),
      visitedAt: Date.now(),
    });
    writeLocalJson(KEY, filtered.slice(0, MAX));
  } catch {
    // localStorage might be unavailable
  }
}

export function getRecentPages(limit = 6): RecentPage[] {
  try {
    const pages = readLocalJson<RecentPage[]>(KEY, [], isRecentPageList);
    if (pages.length === 0) return [];
    const migrated = migrateStoredPages(pages);
    writeLocalJson(KEY, migrated);
    return migrated.slice(0, limit);
  } catch {
    return [];
  }
}
