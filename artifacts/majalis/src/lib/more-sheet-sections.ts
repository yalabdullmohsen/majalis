import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart2,
  BarChart3,
  BookMarked,
  BookOpen,
  BookText,
  BookUser,
  Bot,
  Building2,
  Calculator,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  FileText,
  Gavel,
  GitBranch,
  GraduationCap,
  Heart,
  HelpCircle,
  Info,
  Landmark,
  Layers,
  Library,
  Lightbulb,
  Map as MapIcon,
  Mic2,
  Moon,
  Network,
  Quote,
  RefreshCw,
  Repeat2,
  Rss,
  Scale,
  ScrollText,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Stethoscope,
  Sun,
  Users,
  Waypoints,
  Zap,
} from "lucide-react";

export type MoreSheetItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

export type MoreSheetSection = {
  group: string;
  items: MoreSheetItem[];
};

/** مصدر واحد لأقسام صفحة «المزيد» — يُستهلك أيضًا في شريط التصنيفات العلوي. */
export const MORE_SHEET_SECTIONS: MoreSheetSection[] = [
  /* ── القرآن الكريم ── */
  { group: "القرآن الكريم", items: [
    { href: "/mushaf",              label: "المصحف الشريف",      Icon: BookOpen },
    { href: "/quran/surahs",        label: "فهرس السور",         Icon: BookText },
    { href: "/quran/makki-madani",  label: "المكي والمدني",      Icon: MapIcon },
    { href: "/quran-hub",           label: "مركز القرآن",        Icon: Layers },
    { href: "/daily-wird",          label: "الورد اليومي",       Icon: Sun },
    { href: "/quran/tajweed",       label: "علم التجويد",        Icon: Mic2 },
    { href: "/ulum-quran",          label: "علوم القرآن",        Icon: GraduationCap },
    { href: "/quran/surah-stories", label: "قصص السور",          Icon: BookText },
    { href: "/duas-quran",          label: "أدعية القرآن",       Icon: BookMarked },
    { href: "/quran-circles",       label: "حلقات التحفيظ",      Icon: Users },
    { href: "/quran-memorization",  label: "اختبارات الحفظ",     Icon: Zap },
    { href: "/quran/memorization-plans", label: "خطط الحفظ",     Icon: CalendarDays },
    { href: "/mutashabihat",        label: "الآيات المتشابهات",  Icon: GitBranch },
  ]},

  /* ── الحديث والسنة ── */
  { group: "الحديث والسنة", items: [
    { href: "/hadith",             label: "الأحاديث النبوية",    Icon: ScrollText },
    { href: "/hadith/books-and-rulings", label: "المتون الحديثية وأحاديث الأحكام", Icon: FileText },
    { href: "/hadith-science",     label: "مصطلح الحديث",        Icon: BookOpen },
    { href: "/wasaya-nabawiyya",   label: "الوصايا النبوية",     Icon: Star },
    { href: "/prophetic-medicine", label: "الطب النبوي",         Icon: Stethoscope },
    { href: "/shamael",            label: "الشمائل المحمدية",    Icon: BookUser },
  ]},

  /* ── العقيدة والتوحيد ── */
  { group: "العقيدة والتوحيد", items: [
    { href: "/tawhid",      label: "التوحيد والعقيدة",     Icon: Shield },
    { href: "/arkan",       label: "أركان الإسلام",        Icon: Landmark },
    { href: "/arkan-iman",  label: "أركان الإيمان",        Icon: Star },
    { href: "/asma-husna",  label: "الأسماء الحسنى",       Icon: Sparkles },
    { href: "/janna-naar",  label: "الجنة والنار",         Icon: Sparkles },
    { href: "/alamat-saah", label: "علامات الساعة",        Icon: Clock },
    { href: "/malaika",     label: "الملائكة في الإسلام",  Icon: Sparkles },
    { href: "/miracles",    label: "الإعجاز العلمي",       Icon: Lightbulb },
  ]},

  /* ── التعريف بالإسلام ── */
  { group: "التعريف بالإسلام", items: [
    { href: "/discover-islam",             label: "تعرّف إلى الإسلام",   Icon: Compass },
    { href: "/discover-islam/questions",   label: "أسئلة وأجوبة",       Icon: HelpCircle },
    { href: "/discover-islam/doubts",      label: "الشبهات والتفنيدات", Icon: Shield },
    { href: "/discover-islam/how-to-convert", label: "كيف أصبح مسلمًا؟", Icon: Star },
    { href: "/discover-islam/new-muslim",  label: "مسار المسلم الجديد", Icon: Sparkles },
  ]},

  /* ── الفقه والأحكام ── */
  { group: "الفقه والأحكام", items: [
    { href: "/fiqh",               label: "الفقه الإسلامي",     Icon: BookText },
    { href: "/qa",                 label: "الأسئلة والأجوبة",   Icon: HelpCircle },
    { href: "/rulings",            label: "الأحكام الشرعية",    Icon: Gavel },
    { href: "/fiqh-council",       label: "المجمع الفقهي",      Icon: Users },
    { href: "/madhahib",           label: "المذاهب الأربعة",    Icon: Scale },
    { href: "/islamic-sects",      label: "الفرق الإسلامية",    Icon: Scale },
    { href: "/fiqh-qawaid",        label: "القواعد الفقهية",    Icon: Scale },
    { href: "/tahara",             label: "الطهارة وأحكامها",   Icon: Repeat2 },
    { href: "/salah-guide",        label: "دليل الصلاة الكامل", Icon: BookOpen },
    { href: "/zakat",              label: "الزكاة وأحكامها",    Icon: Calculator },
    { href: "/sawm",               label: "الصيام وأحكامه",     Icon: Moon },
    { href: "/hajj",               label: "الحج والعمرة",       Icon: Landmark },
    { href: "/janaza",             label: "أحكام الجنائز",      Icon: ScrollText },
    { href: "/mawarith",           label: "المواريث والفرائض",  Icon: Scale },
    { href: "/mawarith/calculator", label: "حاسبة المواريث",    Icon: Calculator },
    { href: "/academic-research",  label: "الأبحاث العلمية",   Icon: FileText },
    { href: "/amr-bil-maruf",      label: "الأمر بالمعروف",     Icon: Shield },
  ]},

  /* ── العبادة والأذكار ── */
  { group: "العبادة والأذكار", items: [
    { href: "/adhkar",            label: "الأذكار",              Icon: Repeat2 },
    { href: "/duas",              label: "الأدعية الشرعية",     Icon: BookMarked },
    { href: "/tasbih",            label: "التسبيح",              Icon: Repeat2 },
    { href: "/sunan-yawmiyya",    label: "السنن اليومية",        Icon: CheckCircle2 },
    { href: "/prayer-ranks",      label: "فضائل الصلاة",        Icon: Shield },
    { href: "/prayer-times",      label: "مواقيت الصلاة",       Icon: Clock },
    { href: "/prayer-countdown",  label: "عداد الصلاة",         Icon: Activity },
    { href: "/qibla",             label: "القبلة",               Icon: Compass },
    { href: "/occasions",         label: "المناسبات الإسلامية",  Icon: Calendar },
    { href: "/tawba",             label: "التوبة والاستغفار",   Icon: RefreshCw },
    { href: "/raqaiq",            label: "الرقائق والزهد",      Icon: Heart },
  ]},

  /* ── السيرة والتاريخ ── */
  { group: "السيرة والتاريخ", items: [
    { href: "/seerah",          label: "السيرة النبوية",         Icon: BookUser },
    { href: "/sahabah",         label: "الصحابة الكرام",         Icon: Users },
    { href: "/prophets",        label: "الأنبياء والرسل",         Icon: Star },
    { href: "/stories",            label: "القصص الإسلامية",     Icon: BookOpen },
    { href: "/islamic-landmarks",  label: "المشاهد والمساجد",    Icon: Landmark },
  ]},

  /* ── الدروس والمكتبة ── */
  { group: "الدروس والمكتبة", items: [
    { href: "/lessons",          label: "الدروس والمحاضرات",    Icon: GraduationCap },
    { href: "/annual-courses",   label: "الدورات العلمية",      Icon: BookMarked },
    { href: "/library",          label: "المكتبة الشرعية",      Icon: Library },
    { href: "/scholars",         label: "أعلام الإسلام",        Icon: BookUser },
    { href: "/fawaid",           label: "الفوائد العلمية",      Icon: Heart },
    { href: "/hikam-salaf",      label: "حكم السلف الصالح",     Icon: Star },
    { href: "/fadail-aamal",     label: "فضائل الأعمال",        Icon: Star },
    { href: "/akhlaq",           label: "الأخلاق الإسلامية",    Icon: Heart },
    { href: "/adab-talab-ilm",   label: "آداب طالب العلم",      Icon: GraduationCap },
    { href: "/islamic-glossary", label: "المصطلحات الإسلامية",  Icon: BookOpen },
    { href: "/islam-stats",      label: "الإسلام في أرقام",     Icon: BarChart3 },
    { href: "/updates",          label: "آخر المستجدات",        Icon: Rss },
    { href: "/institutions",     label: "المؤسسات الإسلامية",   Icon: Landmark },
  ]},

  /* ── التعلّم والأدوات ── */
  { group: "التعلّم والأدوات", items: [
    { href: "/learn",                label: "أبواب العلم",         Icon: Layers },
    { href: "/start-here",           label: "ابدأ من هنا",         Icon: Waypoints },
    { href: "/quiz",                 label: "المسابقة التعليمية",  Icon: Zap },
    { href: "/flashcards",           label: "بطاقات المراجعة",     Icon: CreditCard },
    { href: "/assistant",            label: "المساعد الذكي",       Icon: Bot },
    { href: "/mind-map",             label: "الخرائط الذهنية",    Icon: MapIcon },
    { href: "/learning-plan",        label: "خطة التعلّم",         Icon: BarChart2 },
    { href: "/learning/paths",       label: "المسارات العلمية",    Icon: GraduationCap },
    { href: "/my-learning",          label: "لوحتي التعليمية",    Icon: BarChart3 },
    { href: "/my-citations",         label: "دفتر الفوائد",       Icon: Quote },
    { href: "/reading-plans",        label: "خطط القراءة",        Icon: CalendarDays },
    { href: "/knowledge-map",        label: "الخريطة المعرفية",   Icon: Network },
    { href: "/knowledge-graph",      label: "شبكة المعرفة",       Icon: GitBranch },
    { href: "/calendar",             label: "التقويم الهجري",     Icon: Calendar },
    { href: "/universities",         label: "دليل الجامعات",      Icon: Building2 },
    { href: "/search",               label: "البحث الشامل",       Icon: Search },
    { href: "/settings",             label: "الإعدادات",          Icon: Settings },
    { href: "/features-in-progress", label: "مميزات قيد التطوير", Icon: Layers },
    { href: "/about",                label: "عن التطبيق",         Icon: Info },
  ]},
];

/** ترتيب أولوية مجموعات الشريط العلوي: عقيدة → قرآن → حديث → سيرة → فقه ثم الباقي. */
export const MORE_GROUP_PRIORITY = [
  "العقيدة والتوحيد",
  "القرآن الكريم",
  "الحديث والسنة",
  "السيرة والتاريخ",
  "الفقه والأحكام",
] as const;

/** يسطّح أقسام المزيد بترتيب الأولوية مع حذف تكرار المسارات. */
export function flattenMoreSectionsForTopBar(
  sections: readonly MoreSheetSection[] = MORE_SHEET_SECTIONS,
  priority: readonly string[] = MORE_GROUP_PRIORITY,
): MoreSheetItem[] {
  const byGroup = new Map(sections.map((s) => [s.group, s.items]));
  const prioritySet = new Set<string>(priority);
  const orderedGroups = [
    ...priority.filter((g) => byGroup.has(g)),
    ...sections.map((s) => s.group).filter((g) => !prioritySet.has(g)),
  ];
  const seen = new Set<string>();
  const out: MoreSheetItem[] = [];
  for (const group of orderedGroups) {
    for (const item of byGroup.get(group) ?? []) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      out.push(item);
    }
  }
  return out;
}
