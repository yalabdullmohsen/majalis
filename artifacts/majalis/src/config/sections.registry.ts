/**
 * SSOT — سجل أقسام المجلس العلمي.
 * كل سطح تنقّل (شريط سفلي · المزيد · الدرج · الرئيسية · البحث) يُولَّد من هنا.
 * ممنوع إضافة عنصر تنقّل يدوي خارج هذا الملف.
 */
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bell,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  BookText,
  Bookmark,
  Building2,
  Calendar,
  Church,
  Compass,
  Contact,
  FileText,
  Flame,
  FlaskConical,
  FolderOpen,
  Gavel,
  GraduationCap,
  HandHeart,
  Hash,
  Heart,
  HelpCircle,
  History,
  Home,
  Info,
  Landmark,
  Layers,
  Library,
  ListTree,
  Lock,
  Map,
  MessageCircleQuestion,
  MoonStar,
  Network,
  NotebookPen,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Star,
  Sun,
  Tags,
  Trash2,
  User,
  Users,
  Volume2,
  Wand2,
} from "lucide-react";

export type SectionGroup =
  | "sciences"
  | "stories"
  | "dawah"
  | "library"
  | "worship"
  | "learning"
  | "account";

export type Surface = "bottomNav" | "home" | "moreHub" | "drawer" | "search";

export type SectionStatus = "live" | "beta" | "hidden";

export interface SectionDef {
  id: string;
  label: string;
  subtitle: string;
  route: string;
  icon: LucideIcon;
  group: SectionGroup;
  order: number;
  featured?: boolean;
  surfaces: Surface[];
  status: SectionStatus;
  keywords: string[];
  aliases?: string[];
}

export const SECTION_GROUP_META: Record<
  SectionGroup,
  { label: string; order: number; rowStyle: boolean }
> = {
  sciences: { label: "العلوم الشرعية", order: 1, rowStyle: false },
  stories: { label: "القصص والأعلام", order: 2, rowStyle: false },
  dawah: { label: "الدعوة والتعريف", order: 3, rowStyle: false },
  library: { label: "المكتبة والفهارس", order: 4, rowStyle: false },
  worship: { label: "أدوات العبادة", order: 5, rowStyle: false },
  learning: { label: "التعلّم الشخصي", order: 6, rowStyle: false },
  account: { label: "الحساب والإعدادات", order: 7, rowStyle: true },
};

export const SECTION_GROUP_ORDER: SectionGroup[] = [
  "sciences",
  "stories",
  "dawah",
  "library",
  "worship",
  "learning",
  "account",
];

/** مسارات قديمة → مسار معتمد (دمج إلزامي) */
export const SECTION_MERGE_REDIRECTS: ReadonlyArray<{ from: string; to: string; note: string }> = [
  { from: "/fawaid", to: "/flashcards", note: "الفوائد والبطاقات → بطاقات الحفظ والمراجعة" },
  { from: "/memorize", to: "/flashcards", note: "بطاقات المراجعة → بطاقات الحفظ والمراجعة" },
  { from: "/my-citations", to: "/flashcards", note: "المحفوظات → بطاقات الحفظ والمراجعة" },
  { from: "/citations", to: "/flashcards", note: "citations → بطاقات الحفظ والمراجعة" },
  { from: "/contact", to: "/support", note: "تواصل معنا → الدعم والتواصل" },
  { from: "/privacy-center", to: "/privacy", note: "مركز الخصوصية → الخصوصية" },
  { from: "/about-us", to: "/about", note: "من نحن → عن المجلس العلمي" },
  { from: "/aqidah", to: "/tawhid", note: "عقيدة قديم → التوحيد/العقيدة" },
  { from: "/prayer", to: "/prayer-times", note: "صلاة مختصر → مواقيت الصلاة" },
  { from: "/adhkar", to: "/duas", note: "أذكار → الأدعية (مسار موحّد)" },
];

const NAV: Surface[] = ["moreHub", "drawer", "home", "search"];
const ACCOUNT: Surface[] = ["moreHub", "drawer", "search"];

export const SECTIONS: readonly SectionDef[] = [
  // —— شريط سفلي ——
  {
    id: "home",
    label: "الرئيسية",
    subtitle: "بوابة المجلس العلمي",
    route: "/",
    icon: Home,
    group: "sciences",
    order: -10,
    surfaces: ["bottomNav", "search"],
    status: "live",
    keywords: ["رئيسية", "home"],
  },
  {
    id: "quran",
    label: "القرآن",
    subtitle: "المصحف والتلاوة",
    route: "/mushaf",
    icon: BookOpen,
    group: "sciences",
    order: -9,
    surfaces: ["bottomNav", "search"],
    status: "live",
    keywords: ["مصحف", "قرآن", "quran"],
    aliases: ["المصحف"],
  },
  {
    id: "prayer",
    label: "الصلاة",
    subtitle: "مواقيت وأذان",
    route: "/prayer-times",
    icon: MoonStar,
    group: "worship",
    order: -8,
    surfaces: ["bottomNav", "search"],
    status: "live",
    keywords: ["صلاة", "أذان", "مواقيت"],
  },
  {
    id: "lessons",
    label: "الدروس",
    subtitle: "دروس وشروح مسجّلة",
    route: "/lessons",
    icon: GraduationCap,
    group: "learning",
    order: -7,
    surfaces: ["bottomNav", "home", "search"],
    status: "live",
    keywords: ["دروس", "شروح"],
  },
  {
    id: "more",
    label: "المزيد",
    subtitle: "كل الأقسام والأدوات",
    route: "/more",
    icon: Layers,
    group: "account",
    order: -6,
    surfaces: ["bottomNav"],
    status: "live",
    keywords: ["المزيد", "أقسام"],
  },

  // —— ١. العلوم الشرعية ——
  {
    id: "aqidah",
    label: "العقيدة",
    subtitle: "أصول الإيمان والتوحيد",
    route: "/tawhid",
    icon: Shield,
    group: "sciences",
    order: 10,
    featured: true,
    surfaces: NAV,
    status: "live",
    keywords: ["عقيدة", "توحيد", "إيمان"],
  },
  {
    id: "quran-sciences",
    label: "القرآن وعلومه",
    subtitle: "علوم القرآن والتجويد",
    route: "/quran",
    icon: BookMarked,
    group: "sciences",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["علوم قرآن", "تجويد"],
    aliases: ["علوم القرآن"],
  },
  {
    id: "tafsir",
    label: "التفسير",
    subtitle: "تفاسير وآيات مختارة",
    route: "/tafsir",
    icon: BookOpenCheck,
    group: "sciences",
    order: 30,
    featured: true,
    surfaces: NAV,
    status: "live",
    keywords: ["تفسير", "آيات"],
  },
  {
    id: "hadith",
    label: "الحديث وعلومه",
    subtitle: "أحاديث وشروح ومصطلح",
    route: "/hadith",
    icon: ScrollText,
    group: "sciences",
    order: 40,
    featured: true,
    surfaces: NAV,
    status: "live",
    keywords: ["حديث", "سنّة"],
    aliases: ["الحديث"],
  },
  {
    id: "fiqh",
    label: "الفقه والأحكام",
    subtitle: "أبواب الفقه والفتاوى",
    route: "/fiqh",
    icon: Scale,
    group: "sciences",
    order: 50,
    featured: true,
    surfaces: NAV,
    status: "live",
    keywords: ["فقه", "أحكام", "فتاوى"],
    aliases: ["الفقه"],
  },
  {
    id: "usul-fiqh",
    label: "أصول الفقه",
    subtitle: "قواعد الاستنباط والأدلة",
    route: "/fiqh-qawaid",
    icon: Network,
    group: "sciences",
    order: 60,
    surfaces: NAV,
    status: "live",
    keywords: ["أصول", "استنباط"],
  },
  {
    id: "seerah",
    label: "السيرة النبوية",
    subtitle: "سيرة النبي ﷺ ومغازيه",
    route: "/seerah",
    icon: Star,
    group: "sciences",
    order: 70,
    featured: true,
    surfaces: NAV,
    status: "live",
    keywords: ["سيرة", "مغازي"],
  },
  {
    id: "islamic-history",
    label: "التاريخ الإسلامي",
    subtitle: "دول وأحداث وحضارة",
    route: "/tarikh-islami",
    icon: History,
    group: "sciences",
    order: 80,
    surfaces: NAV,
    status: "live",
    keywords: ["تاريخ", "حضارة"],
  },

  // —— ٢. القصص والأعلام ——
  {
    id: "prophets",
    label: "قصص الأنبياء",
    subtitle: "سير الأنبياء والرسل",
    route: "/prophets",
    icon: Sparkles,
    group: "stories",
    order: 10,
    featured: true,
    surfaces: NAV,
    status: "live",
    keywords: ["أنبياء", "رسل"],
  },
  {
    id: "nations",
    label: "الأمم السابقة",
    subtitle: "قصص الأمم في القرآن",
    route: "/nations",
    icon: Church,
    group: "stories",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["أمم", "أقوام"],
  },
  {
    id: "quran-figures",
    label: "الذين ذُكروا في القرآن",
    subtitle: "أعلام ورد ذكرهم في الوحي",
    route: "/quran/people",
    icon: Users,
    group: "stories",
    order: 30,
    surfaces: NAV,
    status: "live",
    keywords: ["أعلام قرآن", "شخصيات"],
    aliases: ["الذين ذكروا في القرآن"],
  },
  {
    id: "biographies",
    label: "أعلام وتراجم",
    subtitle: "تراجم العلماء والأعلام",
    route: "/scholars",
    icon: Contact,
    group: "stories",
    order: 40,
    surfaces: NAV,
    status: "live",
    keywords: ["تراجم", "علماء"],
  },

  // —— ٣. الدعوة والتعريف ——
  {
    id: "discover-islam",
    label: "اكتشف الإسلام",
    subtitle: "مدخل تعريفي لغير المسلمين",
    route: "/discover-islam",
    icon: HandHeart,
    group: "dawah",
    order: 10,
    surfaces: NAV,
    status: "live",
    keywords: ["اكتشف", "تعريف"],
  },
  {
    id: "new-muslim",
    label: "التعريف بالإسلام",
    subtitle: "دليل المسلم الجديد",
    route: "/discover-islam/new-muslim",
    icon: Heart,
    group: "dawah",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["مسلم جديد", "هداية"],
  },
  {
    id: "islam-guide",
    label: "الدليل الإسلامي",
    subtitle: "مرجع موجّه للتعريف",
    route: "/islamic-directory",
    icon: Map,
    group: "dawah",
    order: 30,
    surfaces: NAV,
    status: "live",
    keywords: ["دليل", "مرجع"],
  },

  // —— ٤. المكتبة والفهارس ——
  {
    id: "library",
    label: "المكتبة",
    subtitle: "كتب ومراجع علمية",
    route: "/library",
    icon: Library,
    group: "library",
    order: 10,
    surfaces: NAV,
    status: "live",
    keywords: ["كتب", "مراجع"],
  },
  {
    id: "research",
    label: "الرسائل والأبحاث",
    subtitle: "رسائل جامعية وأبحاث",
    route: "/academic-research",
    icon: FlaskConical,
    group: "library",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["رسائل", "أبحاث"],
  },
  {
    id: "glossary",
    label: "المصطلحات",
    subtitle: "معجم المصطلحات الشرعية",
    route: "/islamic-glossary",
    icon: BookText,
    group: "library",
    order: 30,
    surfaces: NAV,
    status: "live",
    keywords: ["مصطلح", "معجم"],
  },
  {
    id: "subjects",
    label: "الموضوعات",
    subtitle: "فهرس موضوعي للمحتوى",
    route: "/topics",
    icon: Tags,
    group: "library",
    order: 40,
    surfaces: NAV,
    status: "live",
    keywords: ["موضوعات", "فهرس"],
  },
  {
    id: "knowledge-doors",
    label: "أبواب العلم",
    subtitle: "خريطة أبواب العلوم",
    route: "/learn",
    icon: ListTree,
    group: "library",
    order: 50,
    surfaces: NAV,
    status: "live",
    keywords: ["أبواب", "خريطة"],
  },
  {
    id: "universities",
    label: "دليل الجامعات الشرعية",
    subtitle: "جامعات وكليات شرعية",
    route: "/universities",
    icon: Building2,
    group: "library",
    order: 60,
    surfaces: NAV,
    status: "live",
    keywords: ["جامعات", "كليات"],
  },

  // —— ٥. أدوات العبادة ——
  {
    id: "tasbih",
    label: "التسبيح",
    subtitle: "عداد تسبيح رقمي",
    route: "/tasbih",
    icon: Hash,
    group: "worship",
    order: 10,
    surfaces: NAV,
    status: "live",
    keywords: ["تسبيح", "ذكر"],
  },
  {
    id: "adhkar",
    label: "الأدعية",
    subtitle: "أذكار وأدعية مأثورة",
    route: "/duas",
    icon: Flame,
    group: "worship",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["أذكار", "دعاء"],
    aliases: ["الأذكار"],
  },
  {
    id: "wird",
    label: "الورد اليومي",
    subtitle: "ورد قرآن وذكر يومي",
    route: "/daily-wird",
    icon: Sun,
    group: "worship",
    order: 30,
    surfaces: NAV,
    status: "live",
    keywords: ["ورد", "أوراد"],
  },
  {
    id: "qibla",
    label: "القبلة",
    subtitle: "اتجاه القبلة والموقع",
    route: "/qibla",
    icon: Compass,
    group: "worship",
    order: 40,
    surfaces: NAV,
    status: "live",
    keywords: ["قبلة", "اتجاه"],
  },
  {
    id: "hijri-calendar",
    label: "التقويم الهجري",
    subtitle: "تواريخ هجرية ومناسبات",
    route: "/calendar",
    icon: Calendar,
    group: "worship",
    order: 50,
    surfaces: NAV,
    status: "live",
    keywords: ["هجري", "تقويم"],
  },

  // —— ٦. التعلّم الشخصي ——
  {
    id: "flashcards",
    label: "بطاقات الحفظ والمراجعة",
    subtitle: "حفظ ومراجعة وفوائد",
    route: "/flashcards",
    icon: Bookmark,
    group: "learning",
    order: 10,
    surfaces: NAV,
    status: "live",
    keywords: ["بطاقات", "حفظ", "مراجعة", "فوائد", "محفوظات"],
    aliases: ["الفوائد والبطاقات", "بطاقات المراجعة", "المحفوظات"],
  },
  {
    id: "qa",
    label: "سين جيم",
    subtitle: "أسئلة وأجوبة علمية",
    route: "/quiz",
    icon: MessageCircleQuestion,
    group: "learning",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["أسئلة", "أجوبة", "س ج"],
  },
  {
    id: "progress",
    label: "متابعة التقدّم",
    subtitle: "تتبع إنجازك العلمي",
    route: "/stats",
    icon: Award,
    group: "learning",
    order: 30,
    surfaces: NAV,
    status: "live",
    keywords: ["تقدم", "إنجاز"],
  },
  {
    id: "assistant",
    label: "المساعد العلمي",
    subtitle: "مساعدة تفاعلية في العلم",
    route: "/assistant",
    icon: Wand2,
    group: "learning",
    order: 40,
    surfaces: NAV,
    status: "live",
    keywords: ["مساعد", "ذكاء"],
  },
  {
    id: "updates",
    label: "المستجدات",
    subtitle: "آخر الإضافات والتحديثات",
    route: "/updates",
    icon: NotebookPen,
    group: "learning",
    order: 50,
    surfaces: NAV,
    status: "live",
    keywords: ["تحديثات", "جديد"],
  },

  // —— ٧. الحساب والإعدادات ——
  {
    id: "account",
    label: "حسابي",
    subtitle: "الملف الشخصي والجلسة",
    route: "/my-learning",
    icon: User,
    group: "account",
    order: 10,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["حساب", "ملف"],
  },
  {
    id: "settings",
    label: "الإعدادات",
    subtitle: "تفضيلات التطبيق العامة",
    route: "/settings",
    icon: Settings,
    group: "account",
    order: 20,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["إعدادات", "مظهر", "ثيم"],
    aliases: ["المظهر"],
  },
  {
    id: "athan-settings",
    label: "إعدادات الأذان",
    subtitle: "تنبيهات الصلاة والأذان",
    route: "/adhan-settings",
    icon: Volume2,
    group: "account",
    order: 30,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["أذان", "تنبيه صلاة"],
  },
  {
    id: "notifications",
    label: "التنبيهات",
    subtitle: "إشعارات المحتوى والورد",
    route: "/notification-settings",
    icon: Bell,
    group: "account",
    order: 40,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["إشعارات", "تنبيهات"],
  },
  {
    id: "support",
    label: "الدعم والتواصل",
    subtitle: "تواصل ومساعدة المستخدم",
    route: "/support",
    icon: HelpCircle,
    group: "account",
    order: 50,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["دعم", "تواصل"],
    aliases: ["تواصل معنا"],
  },
  {
    id: "about",
    label: "عن المجلس العلمي",
    subtitle: "رؤية المنصة ورسالتها",
    route: "/about",
    icon: Info,
    group: "account",
    order: 60,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["حول", "من نحن"],
    aliases: ["حول التطبيق", "من نحن"],
  },
  {
    id: "methodology",
    label: "منهجية التوثيق",
    subtitle: "منهج العرض والتوثيق",
    route: "/methodology",
    icon: FileText,
    group: "account",
    order: 70,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["منهجية", "توثيق"],
  },
  {
    id: "sources",
    label: "المصادر والتراخيص",
    subtitle: "مراجع ومصادر المحتوى",
    route: "/sources",
    icon: FolderOpen,
    group: "account",
    order: 80,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["مصادر", "تراخيص"],
  },
  {
    id: "fatwa-policy",
    label: "سياسة الفتوى",
    subtitle: "ضوابط عرض الأحكام",
    route: "/fatwa-policy",
    icon: Gavel,
    group: "account",
    order: 90,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["فتوى", "سياسة"],
  },
  {
    id: "privacy",
    label: "الخصوصية",
    subtitle: "سياسة ومركز الخصوصية",
    route: "/privacy",
    icon: Lock,
    group: "account",
    order: 100,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["خصوصية", "بيانات"],
    aliases: ["سياسة الخصوصية", "مركز الخصوصية"],
  },
  {
    id: "terms",
    label: "شروط الاستخدام",
    subtitle: "شروط وأحكام الاستخدام",
    route: "/terms",
    icon: Landmark,
    group: "account",
    order: 110,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["شروط", "أحكام"],
  },
  {
    id: "delete-account",
    label: "حذف الحساب",
    subtitle: "طلب حذف الحساب نهائياً",
    route: "/delete-account",
    icon: Trash2,
    group: "account",
    order: 120,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["حذف", "إلغاء حساب"],
  },
] as const;

function visible(s: SectionDef): boolean {
  return s.status !== "hidden";
}

export function sectionsForSurface(surface: Surface): SectionDef[] {
  return SECTIONS.filter((s) => visible(s) && s.surfaces.includes(surface)).sort(
    (a, b) =>
      SECTION_GROUP_META[a.group].order - SECTION_GROUP_META[b.group].order ||
      a.order - b.order,
  );
}

export function sectionsByGroup(
  group: SectionGroup,
  surface: Surface = "moreHub",
): SectionDef[] {
  return SECTIONS.filter(
    (s) => visible(s) && s.group === group && s.surfaces.includes(surface) && s.order >= 0,
  ).sort((a, b) => a.order - b.order);
}

export function featuredSections(): SectionDef[] {
  return SECTIONS.filter((s) => visible(s) && s.featured).sort(
    (a, b) =>
      SECTION_GROUP_META[a.group].order - SECTION_GROUP_META[b.group].order ||
      a.order - b.order,
  );
}

export function bottomNavSections(): SectionDef[] {
  const order = ["home", "quran", "prayer", "lessons", "more"];
  return order
    .map((id) => SECTIONS.find((s) => s.id === id))
    .filter((s): s is SectionDef => Boolean(s));
}

export function getSectionById(id: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.id === id);
}

export function getSectionByRoute(route: string): SectionDef | undefined {
  const clean = route.split("?")[0].replace(/\/$/, "") || "/";
  return SECTIONS.find((s) => {
    const r = s.route.replace(/\/$/, "") || "/";
    return r === clean;
  });
}

export function searchSectionsIndex(): Array<{
  id: string;
  label: string;
  subtitle: string;
  route: string;
  keywords: string[];
  aliases: string[];
}> {
  return SECTIONS.filter((s) => visible(s) && s.surfaces.includes("search")).map((s) => ({
    id: s.id,
    label: s.label,
    subtitle: s.subtitle,
    route: s.route,
    keywords: s.keywords,
    aliases: s.aliases ?? [],
  }));
}
