import { BRAND } from "@/shared/config/brand";
/**
 * SSOT — سجل أقسام سُنّة.
 * كل سطح تنقّل (شريط سفلي · المزيد · الدرج · الرئيسية · البحث) يُولَّد من هنا.
 * ممنوع إضافة عنصر تنقّل يدوي خارج هذا الملف.
 */
import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  Award,
  BadgeCheck,
  Bell,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  BookText,
  BookHeart,
  BarChart3,
  Book,
  Bookmark,
  BookCopy,
  Building2,
  Calendar,
  Clock,
  Church,
  Compass,
  FileStack,
  FileText,
  Flame,
  FlaskConical,
  Gem,
  FolderOpen,
  Gavel,
  GitBranch,
  GraduationCap,
  HandHeart,
  HandHelping,
  Hash,
  Headphones,
  Heart,
  HelpCircle,
  History,
  Home,
  Info,
  Landmark,
  Languages,
  Layers,
  Library,
  Lightbulb,
  ListTree,
  Lock,
  Map,
  MapPin,
  Microscope,
  MessageCircleQuestion,
  Mic,
  MoonStar,
  Mountain,
  Network,
  NotebookPen,
  Radio,
  Scale,
  School,
  ScrollText,
  Search,
  Settings,
  Shield,
  Shapes,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  User,
  Users,
  Volume2,
  Wand2,
  Waypoints,
} from "lucide-react";
import { isHiddenFromNav } from "@/lib/nav-visibility";

export type SectionGroup =
  | "sciences"
  | "stories"
  | "dawah"
  | "library"
  | "worship"
  | "learning"
  | "account";

export type Surface = "bottomNav" | "home" | "moreHub" | "drawer" | "search" | "quranHub" | "lessonsHub";

/** أين يُعرض القسم أساساً — مكان واحد فقط كبطاقة هب */
export type SectionHub = "quran" | "lessons" | "sections";

export type SectionStatus = "live" | "beta" | "hidden";

export interface SectionDef {
  id: string;
  label: string;
  /** تسمية مختصرة للشريط السفلي إن وُجدت */
  navLabel?: string;
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
  /** مكان العرض الأساسي — لا تكرار بطاقات بين الهبات */
  hub: SectionHub;
  /** لون العلامة — يُحقَن على الحاوية كـ --section-accent */
  accent?: string;
}

/** لون العلامة الافتراضي لكل مجموعة أقسام */
export const SECTION_GROUP_ACCENT: Record<SectionGroup, string> = {
  sciences: BRAND.colorDay,
  stories: "#8B6914",
  dawah: "#4A5590",
  library: "#8B6914",
  worship: "#2A7A6E",
  learning: "#3D5A80",
  account: BRAND.colorDay,
};

/** تجاوزات لونية تطابق سمات TopicPage */
const SECTION_ACCENT_BY_ID: Record<string, string> = {
  hadith: "#0E7A5F",
  seerah: "#A67C3A",
  "islamic-history": "#7A6B3A",
  tafsir: "#2A7A6E",
  "quran-tajweed": "#2A7A6E",
  "quran-qiraat": "#2A7A6E",
  "ulum-quran": "#2A7A6E",
  "quran-asbab": "#2A7A6E",
  "quran-figures": "#2A7A6E",
  prophets: "#1A8A7A",
  nations: "#7A6B3A",
  library: "#8B6914",
  research: "#8B6914",
  glossary: "#8B6914",
  universities: "#8B6914",
  "discover-islam": "#4A5590",
  fiqh: "#1F6B4A",
  "usul-fiqh": "#8B7A3A",
  adhkar: "#3A9A7A",
  duas: "#3A9A7A",
  fawaid: "#B45309",
  miracles: "#0E7490",
  lessons: "#1F6B56",
  qa: "#1F6B56",
  "islam-guide": "#7A6B3A",
};

export function resolveSectionAccent(s: {
  id: string;
  group: SectionGroup;
  accent?: string;
}): string {
  return s.accent ?? SECTION_ACCENT_BY_ID[s.id] ?? SECTION_GROUP_ACCENT[s.group];
}

export const SECTION_GROUP_META: Record<
  SectionGroup,
  { label: string; order: number; rowStyle: boolean }
> = {
  sciences: { label: "العلوم الشرعية", order: 1, rowStyle: false },
  stories: { label: "القصص والأعلام", order: 2, rowStyle: false },
  dawah: { label: "الدعوة والتعريف", order: 3, rowStyle: false },
  library: { label: "الفهارس والمراجع", order: 4, rowStyle: false },
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
  { from: "/memorize", to: "/flashcards", note: "بطاقات المراجعة → بطاقات الحفظ والمراجعة" },
  { from: "/my-citations", to: "/flashcards", note: "المحفوظات → بطاقات الحفظ والمراجعة" },
  { from: "/citations", to: "/flashcards", note: "citations → بطاقات الحفظ والمراجعة" },
  { from: "/support", to: "/contact", note: "الدعم → تواصل معنا (canonical)" },
  { from: "/privacy-center", to: "/privacy", note: "مركز الخصوصية → الخصوصية" },
  { from: "/about-us", to: "/about", note: "من نحن → عن سُنّة" },
  { from: "/aqidah", to: "/tawhid", note: "عقيدة قديم → التوحيد/العقيدة" },
  { from: "/prayer", to: "/prayer-times", note: "صلاة مختصر → مواقيت الصلاة" },
  { from: "/more", to: "/#explore", note: "المزيد (ملغاة) → الرئيسية /#explore" },
];

const NAV: Surface[] = ["moreHub", "home", "search"];
const ACCOUNT: Surface[] = ["moreHub", "search"];
/** الحساب/الإعدادات في الدرج — بلا تكرار أقسام المحتوى */
const ACCOUNT_DRAWER: Surface[] = ["moreHub", "drawer", "search"];
const SEARCH_ONLY: Surface[] = ["search"];

/** أقسام مركز القرآن الكريم — تُعرض هناك فقط كبطاقات */
const QURAN_HUB_IDS = new Set([
  "open-mushaf",
  "quran-surahs",
  "tafsir",
  "quran-tilawa",
  "quran-recitation",
  "quran-tajweed",
  "quran-qiraat",
  "quran-seven-ahruf",
  "quran-figures",
  "quran-asbab",
  "ulum-quran",
  "quran-numbers",
  "flashcards",
  "quran-ulum-terms",
]);

const LESSONS_HUB_IDS = new Set(["quran-circles", "competitions", "lessons-archive"]);

type SectionSeed = Omit<SectionDef, "hub" | "accent"> & {
  hub?: SectionHub;
  accent?: string;
};

const SECTION_SEEDS: SectionSeed[] = [
  // —— شريط سفلي ——
  {
    id: "home",
    label: "الرئيسية",
    subtitle: "بوابة سُنّة",
    route: "/",
    icon: Home,
    group: "sciences",
    order: -10,
    surfaces: ["search", "home"],
    status: "live",
    keywords: ["رئيسية", "home"],
  },
  {
    id: "quran",
    label: "مركز القرآن الكريم",
    navLabel: "القرآن",
    subtitle: "المصحف والتلاوة والتفسير",
    route: "/quran-hub",
    icon: BookOpen,
    group: "sciences",
    order: -9,
    surfaces: ["bottomNav", "search"],
    status: "live",
    keywords: ["مصحف", "قرآن", "quran", "مركز القرآن الكريم"],
    aliases: ["القرآن", "القرآن الكريم", "قرآن", "المصحف", "مركز القرآن الكريم", "مركز القرآن"],
  },
  {
    id: "lessons",
    label: "الدروس",
    subtitle: "دروس وشروح مسجّلة",
    route: "/lessons",
    icon: GraduationCap,
    group: "learning",
    order: -8,
    surfaces: ["bottomNav", "home", "search"],
    status: "live",
    keywords: ["دروس", "شروح"],
  },
  {
    id: "prayer",
    label: "الصلاة",
    subtitle: "مواقيت وأذان",
    route: "/prayer-times",
    icon: MoonStar,
    group: "worship",
    order: -7,
    surfaces: ["bottomNav", "search"],
    status: "live",
    keywords: ["صلاة", "أذان", "مواقيت"],
  },
  {
    id: "sections",
    label: "الأقسام",
    subtitle: "كل أقسام سُنّة",
    route: "/sections",
    icon: Layers,
    group: "account",
    order: -5,
    surfaces: ["bottomNav", "drawer"],
    status: "live",
    keywords: ["أقسام", "sections"],
    aliases: ["المزيد"],
  },

  // —— مركز القرآن الكريم (hub: quran) ——
  {
    id: "open-mushaf",
    label: "فتح المصحف",
    subtitle: "متابعة القراءة من آخر موضع محفوظ",
    route: "/mushaf",
    icon: Book,
    group: "sciences",
    order: 1,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["مصحف", "فتح المصحف", "قراءة"],
    aliases: ["المصحف"],
    hub: "quran",
  },
  {
    id: "quran-surahs",
    label: "فهرس السور",
    subtitle: "تصفّح سور القرآن الكريم",
    route: "/quran/surahs",
    icon: FileStack,
    group: "sciences",
    order: 2,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["سور", "فهرس"],
    hub: "quran",
  },
  {
    id: "tafsir",
    label: "التفسير",
    subtitle: "تفاسير وآيات مختارة",
    route: "/tafsir",
    icon: BookOpenCheck,
    group: "sciences",
    order: 3,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["تفسير", "آيات"],
    hub: "quran",
  },
  {
    id: "quran-tilawa",
    label: "التلاوة والقرّاء",
    subtitle: "استماع القرّاء عبر المصحف",
    route: "/quran-hub/tilawa",
    icon: Headphones,
    group: "sciences",
    order: 4,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["تلاوة", "قرّاء", "استماع", "قارئ"],
    hub: "quran",
  },
  {
    id: "quran-recitation",
    label: "تسميع بالذكاء الاصطناعي",
    subtitle: "سجّل تلاوتك وقيّمها فورًا بالذكاء الاصطناعي",
    route: "/quran/recitation-test-ai",
    icon: Mic,
    group: "sciences",
    order: 5,
    surfaces: ["search", "drawer", "quranHub"],
    status: "live",
    keywords: ["تلاوة", "تسميع", "ترتيل", "حفظ", "ميكروفون", "ذكاء اصطناعي"],
    hub: "quran",
  },
  {
    id: "quran-tajweed",
    label: "التجويد",
    subtitle: "مخارج وصفات وأحكام التلاوة",
    route: "/quran-hub/tajweed",
    icon: AudioLines,
    group: "sciences",
    order: 6,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: [
      "تجويد",
      "أحكام النون",
      "المدود",
      "مخارج",
      "قلقلة",
      "وقف",
      "حفص",
      "الشاطبية",
    ],
    hub: "quran",
  },
  {
    id: "quran-qiraat",
    label: "القراءات العشر",
    subtitle: "القرّاء والروايات وأصولها",
    route: "/quran-hub/qiraat",
    icon: GitBranch,
    group: "sciences",
    order: 7,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: [
      "قراءات",
      "رواية",
      "حفص",
      "ورش",
      "قالون",
      "شاطبية",
      "الدرة",
      "طيبة النشر",
      "نافع",
      "عاصم",
    ],
    hub: "quran",
  },
  {
    id: "quran-seven-ahruf",
    label: "الأحرف السبعة",
    subtitle: "نزول القرآن على سبعة أحرف والفرق عن القراءات",
    route: "/quran-hub/seven-ahruf",
    icon: Sparkles,
    group: "sciences",
    order: 8,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: [
      "أحرف سبعة",
      "سبعة أحرف",
      "الأحرف السبعه",
      "سبعه احرف",
      "عمر وهشام",
      "أبي بن كعب",
      "عرضة أخيرة",
    ],
    hub: "quran",
  },
  {
    id: "quran-figures",
    label: "الذين ذُكروا في القرآن",
    subtitle: "أعلام ومواضع ذكر — بلا أنبياء (قسمهم مستقل)",
    route: "/quran/people",
    icon: Users,
    group: "stories",
    order: 8,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["أعلام قرآن", "شخصيات"],
    aliases: ["الذين ذكروا في القرآن"],
    hub: "quran",
  },
  {
    id: "quran-asbab",
    label: "قصص السور",
    subtitle: "سبب التسمية ومحاور السور وقصصها الموثّقة",
    route: "/quran/surah-stories",
    icon: Waypoints,
    group: "sciences",
    order: 9,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["قصص سور", "قصص القرآن", "سبب تسمية", "أسباب نزول", "محاور السور"],
    aliases: ["أسباب النزول", "قصص القرآن", "قصص سور القرآن"],
    hub: "quran",
  },
  {
    id: "ulum-quran",
    label: "علوم القرآن",
    subtitle: "المكي والمدني والرسم وعدّ الآي",
    route: "/ulum-quran",
    icon: BookCopy,
    group: "sciences",
    order: 10,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["علوم قرآن", "ناسخ", "منسوخ", "رسم", "عد الآي"],
    aliases: ["علوم القرآن"],
    hub: "quran",
  },
  {
    id: "quran-numbers",
    label: "القرآن في أرقام",
    subtitle: "إحصاءات موثّقة من مصادر معتمدة",
    route: "/quran-hub/numbers",
    icon: BarChart3,
    group: "sciences",
    order: 11,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["إحصاءات", "عدد الآيات", "عدد السور", "كم آية", "كم كلمة"],
    aliases: ["إحصائيات القرآن", "أرقام القرآن"],
    hub: "quran",
  },
  {
    id: "flashcards",
    label: "بطاقات حفظ القرآن",
    subtitle: "حفظ ومراجعة آيات القرآن",
    route: "/flashcards",
    icon: Bookmark,
    group: "learning",
    order: 12,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["بطاقات", "حفظ", "مراجعة", "محفوظات", "حفظ قرآن"],
    aliases: ["بطاقات المراجعة", "المحفوظات", "بطاقات حفظ القرآن", "بطاقات الحفظ والمراجعة"],
    hub: "quran",
  },
  {
    id: "quran-ulum-terms",
    label: "مصطلحات علوم القرآن",
    subtitle: "٢٧ مصطلحًا في علوم القرآن",
    route: "/quran-hub/terms",
    icon: Languages,
    group: "sciences",
    order: 13,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["مصطلحات قرآن", "معجم قرآني", "علوم القرآن"],
    hub: "quran",
  },
  {
    id: "quran-circles",
    label: "حلقات القرآن",
    subtitle: "حلقات تحفيظ ودورات",
    route: "/quran-circles",
    icon: School,
    group: "learning",
    order: 5,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["حلقات", "تحفيظ", "دورات قرآن"],
    aliases: ["حلقات التحفيظ", "دور التحفيظ"],
    hub: "lessons",
  },
  {
    id: "competitions",
    label: "المسابقات",
    subtitle: "إعلانات مسابقات شرعية وقرآنية خارجية",
    route: "/competitions",
    icon: Trophy,
    group: "learning",
    order: 4,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["مسابقات", "إعلان مسابقة", "حفظ", "تسميع", "جوائز", "الماهر"],
    aliases: ["مسابقة", "إعلانات المسابقات"],
    hub: "lessons",
  },
  {
    id: "lessons-archive",
    label: "الأرشيف",
    subtitle: "الدروس السابقة المسجّلة",
    route: "/lessons/archive",
    icon: Clock,
    group: "learning",
    order: 6,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["أرشيف دروس", "دروس سابقة"],
    hub: "lessons",
  },
  {
    id: "quran-search",
    label: "البحث في القرآن",
    subtitle: "ابحث في آيات المصحف",
    route: "/quran/search",
    icon: Search,
    group: "sciences",
    order: 90,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["بحث", "آيات"],
    hub: "sections",
  },
  {
    id: "quran-topics",
    label: "موضوعات القرآن",
    subtitle: "مداخل موضوعية لعلوم القرآن",
    route: "/quran-knowledge",
    icon: Shapes,
    group: "sciences",
    order: 91,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["موضوعات قرآن", "محاور"],
    hub: "sections",
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
    route: "/quran-sciences-legacy",
    icon: BookMarked,
    group: "sciences",
    order: 20,
    surfaces: SEARCH_ONLY,
    status: "hidden",
    keywords: ["علوم قرآن", "تجويد"],
    aliases: ["بوابة علوم القرآن"],
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
    id: "fawaid",
    label: "الفوائد الشرعية",
    navLabel: "الفوائد",
    subtitle: "فوائد قرآنية وحديثية منتقاة وموثّقة",
    route: "/fawaid",
    icon: Lightbulb,
    group: "sciences",
    order: 45,
    surfaces: NAV,
    status: "live",
    keywords: ["فوائد", "فائدة", "مختصرات", "رقائق"],
    aliases: ["الفوائد", "الفوائد العلمية", "الفوائد الدينية", "فوائد شرعية"],
    accent: "#B45309",
  },
  {
    id: "miracles",
    label: "الإعجاز العلمي في القرآن والسنة",
    navLabel: "الإعجاز",
    subtitle: "تأملات علمية منضبطة في القرآن والسنة",
    route: "/miracles",
    icon: Microscope,
    group: "sciences",
    order: 48,
    surfaces: NAV,
    status: "live",
    keywords: ["إعجاز", "معجزات", "إشارات كونية", "علوم", "إعجاز القرآن", "إعجاز السنة"],
    aliases: ["المعجزات", "إشارات كونية", "إعجاز علمي", "الإعجاز العلمي"],
    accent: "#0E7490",
  },
  {
    id: "fiqh",
    label: "الفقه والأحكام",
    navLabel: "الفقه",
    subtitle: "أبواب الفقه والفتاوى",
    route: "/fiqh",
    icon: Scale,
    group: "sciences",
    order: 50,
    featured: true,
    surfaces: ["bottomNav", "moreHub", "home", "search"],
    status: "live",
    keywords: ["فقه", "أحكام", "فتاوى"],
    aliases: ["الفقه"],
  },
  {
    id: "usul-fiqh",
    label: "أصول الفقه",
    subtitle: "قواعد الاستنباط والأدلة",
    route: "/fiqh/usul",
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
    icon: Mountain,
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
    subtitle: "خط زمني بالأحداث من قبل البعثة إلى يومنا",
    route: "/tarikh-islami",
    icon: History,
    group: "sciences",
    order: 80,
    surfaces: NAV,
    status: "live",
    featured: true,
    keywords: ["تاريخ", "حضارة", "سيرة", "فتوحات"],
  },
  {
    id: "arabic-language",
    label: "النحو والصرف والبلاغة لطالب العلم",
    subtitle: "مسار ميسر لفهم العربية المعينة على فهم الوحي",
    route: "/arabic-language",
    icon: Gem,
    group: "sciences",
    order: 85,
    surfaces: NAV,
    status: "live",
    keywords: ["نحو", "صرف", "بلاغة", "لغة عربية"],
    aliases: ["النحو والصرف", "البلاغة", "اللغة العربية"],
    accent: "#3F6F5A",
  },
  {
    id: "maqasid-sharia",
    label: "مقاصد الشريعة",
    subtitle: "مداخل في كليات الشريعة وغايات الأحكام",
    route: "/maqasid-sharia",
    icon: Compass,
    group: "sciences",
    order: 86,
    surfaces: NAV,
    status: "live",
    keywords: ["مقاصد", "كليات", "شريعة"],
  },
  {
    id: "dalail-nubuwwah",
    label: "دلائل النبوة",
    subtitle: "براهين صدق الرسالة المحمدية",
    route: "/dalail-nubuwwah",
    icon: BadgeCheck,
    group: "sciences",
    order: 87,
    surfaces: NAV,
    status: "live",
    keywords: ["دلائل", "نبوة", "معجزات"],
  },

  // —— ٢. القصص والأعلام ——
  {
    id: "prophets",
    label: "قصص الأنبياء",
    subtitle: "سير الأنبياء والرسل",
    route: "/prophets",
    icon: BookHeart,
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
    featured: true,
    surfaces: NAV,
    status: "live",
    keywords: ["أمم", "أقوام"],
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
    keywords: ["اكتشف", "تعريف", "غير المسلمين"],
  },
  {
    id: "new-muslim",
    label: "دليل المسلم الجديد",
    subtitle: "خطوات أولى للمسلم حديث العهد بالإسلام",
    route: "/discover-islam/new-muslim",
    icon: Heart,
    group: "dawah",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["مسلم جديد", "هداية", "تعريف بالإسلام"],
    aliases: ["التعريف بالإسلام", "المسلم الجديد"],
  },
  {
    id: "islam-guide",
    label: "دليل المؤسسات والمساجد",
    subtitle: "مؤسسات ومساجد ومعالم إسلامية",
    route: "/islamic-directory",
    icon: Map,
    group: "dawah",
    order: 30,
    surfaces: NAV,
    status: "live",
    keywords: ["دليل", "مساجد", "مؤسسات", "معالم"],
    aliases: ["الدليل الإسلامي", "الدليل الجغرافي"],
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
    surfaces: [],
    status: "hidden",
    keywords: ["كتب", "مراجع"],
  },
  {
    id: "research",
    label: "الأبحاث الشرعية",
    subtitle: "رسائل جامعية وأبحاث وصفية",
    route: "/academic-research",
    icon: FlaskConical,
    group: "library",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["رسائل", "أبحاث"],
    aliases: ["الرسائل والأبحاث", "الأبحاث"],
  },
  {
    id: "glossary",
    label: "مفاهيم شرعية",
    subtitle: "معجم موجز للمفاهيم الشرعية",
    route: "/islamic-glossary",
    icon: BookText,
    group: "library",
    order: 30,
    surfaces: NAV,
    status: "live",
    keywords: ["مصطلح", "معجم", "قاموس", "مصطلحات إسلامية"],
    aliases: ["القاموس الإسلامي", "مفاهيم شرعية", "مصطلحات", "المصطلحات", "المصطلحات الإسلامية"],
    hub: "sections",
  },
  {
    id: "knowledge-doors",
    label: "دروس التعلّم",
    subtitle: "دروس شرعية مفصّلة في العقيدة وغيرها",
    route: "/learn",
    icon: ListTree,
    group: "library",
    order: 50,
    surfaces: NAV,
    status: "live",
    keywords: ["تعلّم", "دروس", "عقيدة"],
    aliases: ["فهرس الدروس", "دروس شرعية", "أبواب العلم"],
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
    label: "الأذكار والأدعية",
    navLabel: "الأذكار",
    subtitle: "أذكار الصباح والمساء وما بينهما",
    route: "/adhkar",
    icon: Flame,
    group: "worship",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["أذكار", "ذكر"],
    aliases: ["الأذكار"],
  },
  {
    id: "duas",
    label: "الأدعية الشرعية",
    navLabel: "الأدعية",
    subtitle: "أدعية مأثورة من القرآن والسنة",
    route: "/duas",
    icon: HandHelping,
    group: "worship",
    order: 22,
    surfaces: NAV,
    status: "live",
    keywords: ["دعاء", "أدعية"],
    aliases: ["الأدعية"],
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
    icon: MapPin,
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
    id: "qa",
    label: "سين جيم",
    navLabel: "سين جيم",
    subtitle: "اختبار معلومات شرعية بأسئلة متعددة",
    route: "/quiz",
    icon: MessageCircleQuestion,
    group: "learning",
    order: 20,
    surfaces: NAV,
    status: "live",
    keywords: ["أسئلة", "أجوبة", "س ج", "مسابقة", "اختبار", "سين جيم"],
    aliases: ["لعبة سين جيم", "الأسئلة والأجوبة"],
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
    label: "آخر المستجدات العلمية",
    navLabel: "المستجدات",
    subtitle: "قرارات وفتاوى ودروس وإعلانات مرتّبة زمنياً",
    route: "/updates",
    icon: NotebookPen,
    group: "learning",
    order: 50,
    surfaces: NAV,
    status: "live",
    keywords: ["مستجدات", "أخبار", "تحديثات", "فتاوى"],
    aliases: ["المستجدات"],
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
    surfaces: ACCOUNT_DRAWER,
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
    surfaces: ACCOUNT_DRAWER,
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
    surfaces: ACCOUNT_DRAWER,
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
    surfaces: ACCOUNT_DRAWER,
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
    surfaces: ACCOUNT_DRAWER,
    status: "live",
    keywords: ["دعم", "تواصل"],
    aliases: ["تواصل معنا"],
  },
  {
    id: "about",
    label: "عن سُنّة",
    subtitle: "رؤية المنصة ورسالتها",
    route: "/about",
    icon: Info,
    group: "account",
    order: 60,
    surfaces: ACCOUNT_DRAWER,
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
    route: "/data-licenses",
    icon: FolderOpen,
    group: "account",
    order: 80,
    surfaces: ACCOUNT,
    status: "live",
    keywords: ["مصادر", "تراخيص"],
  },
  {
    id: "lesson-sources",
    label: "دليل الجهات",
    subtitle: "حسابات الدروس والحلقات",
    route: "/sources",
    icon: Radio,
    group: "learning",
    order: 7,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["جهات", "دروس", "حلقات", "مصادر"],
    hub: "lessons",
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
    surfaces: ACCOUNT_DRAWER,
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
    surfaces: ACCOUNT_DRAWER,
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
];

function resolveHub(s: SectionSeed): SectionHub {
  if (s.hub) return s.hub;
  if (QURAN_HUB_IDS.has(s.id)) return "quran";
  if (LESSONS_HUB_IDS.has(s.id)) return "lessons";
  return "sections";
}

export const SECTIONS: readonly SectionDef[] = SECTION_SEEDS.map((s) => ({
  ...s,
  hub: resolveHub(s),
  accent: resolveSectionAccent(s),
}));

function visible(s: SectionDef): boolean {
  return s.status !== "hidden";
}

/** لا يظهر في الاكتشاف العام إن كان مخفياً من التنقل أو غير معتمد. */
function discoverable(s: SectionDef): boolean {
  return visible(s) && !isHiddenFromNav(s.route);
}

export function sectionsForSurface(surface: Surface): SectionDef[] {
  return SECTIONS.filter((s) => {
    if (!discoverable(s) || !s.surfaces.includes(surface)) return false;
    if (surface === "moreHub" || surface === "drawer" || surface === "home") {
      return s.hub === "sections";
    }
    return true;
  }).sort(
    (a, b) =>
      SECTION_GROUP_META[a.group].order - SECTION_GROUP_META[b.group].order ||
      a.order - b.order,
  );
}

export function sectionsByGroup(
  group: SectionGroup,
  surface: Surface = "moreHub",
): SectionDef[] {
  return SECTIONS.filter((s) => {
    if (!discoverable(s) || s.group !== group || !s.surfaces.includes(surface) || s.order < 0) {
      return false;
    }
    if (surface === "moreHub" || surface === "drawer" || surface === "home") {
      return s.hub === "sections";
    }
    return true;
  }).sort((a, b) => a.order - b.order);
}

export function featuredSections(): SectionDef[] {
  return SECTIONS.filter((s) => discoverable(s) && s.featured && s.hub === "sections").sort(
    (a, b) =>
      SECTION_GROUP_META[a.group].order - SECTION_GROUP_META[b.group].order ||
      a.order - b.order,
  );
}

export function bottomNavSections(): SectionDef[] {
  const order = ["quran", "lessons", "prayer", "fiqh", "sections"];
  return order
    .map((id) => SECTIONS.find((s) => s.id === id && s.surfaces.includes("bottomNav")))
    .filter((s): s is SectionDef => Boolean(s));
}

export function quranHubSections(): SectionDef[] {
  return SECTIONS.filter((s) => visible(s) && s.hub === "quran").sort(
    (a, b) => a.order - b.order,
  );
}

export function lessonsHubSections(): SectionDef[] {
  return SECTIONS.filter((s) => visible(s) && s.hub === "lessons").sort(
    (a, b) => a.order - b.order,
  );
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

/** --section-accent لمسار قسم؛ يرجع لون المجموعة إن لم يُسجَّل المسار */
export function getSectionAccent(route: string): string {
  const sec = getSectionByRoute(route);
  if (sec) return resolveSectionAccent(sec);
  return SECTION_GROUP_ACCENT.sciences;
}

export function searchSectionsIndex(): Array<{
  id: string;
  label: string;
  subtitle: string;
  route: string;
  keywords: string[];
  aliases: string[];
}> {
  return SECTIONS.filter((s) => discoverable(s) && s.surfaces.includes("search")).map((s) => ({
    id: s.id,
    label: s.label,
    subtitle: s.subtitle,
    route: s.route,
    keywords: s.keywords,
    aliases: s.aliases ?? [],
  }));
}
