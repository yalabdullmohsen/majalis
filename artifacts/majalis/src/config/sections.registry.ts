/**
 * SSOT — سجل أقسام المجلس العلمي.
 * كل سطح تنقّل (شريط سفلي · المزيد · الدرج · الرئيسية · البحث) يُولَّد من هنا.
 * ممنوع إضافة عنصر تنقّل يدوي خارج هذا الملف.
 */
import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  Award,
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
  Church,
  Compass,
  Contact,
  FileStack,
  FileText,
  Flame,
  FlaskConical,
  FolderOpen,
  Gavel,
  GitBranch,
  GraduationCap,
  HandHeart,
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
  ListTree,
  Lock,
  Map,
  MessageCircleQuestion,
  Mic,
  MoonStar,
  Mountain,
  Network,
  NotebookPen,
  Scale,
  School,
  ScrollText,
  Search,
  Settings,
  Shield,
  Shapes,
  Sun,
  Tags,
  Trash2,
  User,
  Users,
  Volume2,
  Wand2,
  Waypoints,
} from "lucide-react";

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
  { from: "/more", to: "/sections", note: "المزيد → الأقسام" },
];

const NAV: Surface[] = ["moreHub", "drawer", "home", "search"];
const ACCOUNT: Surface[] = ["moreHub", "drawer", "search"];
const SEARCH_ONLY: Surface[] = ["search"];

/** أقسام مركز القرآن — تُعرض هناك فقط كبطاقات */
const QURAN_HUB_IDS = new Set([
  "open-mushaf",
  "quran-surahs",
  "tafsir",
  "quran-tilawa",
  "quran-recitation",
  "quran-tajweed",
  "quran-qiraat",
  "quran-figures",
  "quran-asbab",
  "ulum-quran",
  "quran-numbers",
  "flashcards",
  "quran-ulum-terms",
]);

const LESSONS_HUB_IDS = new Set(["quran-circles"]);

type SectionSeed = Omit<SectionDef, "hub"> & { hub?: SectionHub };

const SECTION_SEEDS: SectionSeed[] = [
  // —— شريط سفلي ——
  {
    id: "home",
    label: "الرئيسية",
    subtitle: "بوابة المجلس العلمي",
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
    label: "مركز القرآن",
    subtitle: "المصحف والتلاوة والتفسير",
    route: "/quran-hub",
    icon: BookOpen,
    group: "sciences",
    order: -9,
    surfaces: ["bottomNav", "search"],
    status: "live",
    keywords: ["مصحف", "قرآن", "quran", "مركز القرآن"],
    aliases: ["القرآن", "قرآن", "المصحف"],
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
    subtitle: "كل أقسام المجلس العلمي",
    route: "/sections",
    icon: Layers,
    group: "account",
    order: -5,
    surfaces: ["bottomNav"],
    status: "live",
    keywords: ["أقسام", "sections"],
    aliases: ["المزيد"],
  },

  // —— مركز القرآن (hub: quran) ——
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
    label: "التسميع والقراءة",
    subtitle: "اختبار التلاوة والتسميع",
    route: "/quran/recitation-test-ai",
    icon: Mic,
    group: "sciences",
    order: 5,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["تسميع", "تلاوة", "اختبار"],
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
    id: "quran-figures",
    label: "الذين ذُكروا في القرآن",
    subtitle: "أعلام ورد ذكرهم في المصحف",
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
    label: "أسباب النزول",
    subtitle: "أسباب النزول ومحاور السور",
    route: "/quran/surah-stories",
    icon: Waypoints,
    group: "sciences",
    order: 9,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["أسباب نزول", "نزول"],
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
    subtitle: "حفظ ومراجعة وفوائد",
    route: "/flashcards",
    icon: Bookmark,
    group: "learning",
    order: 12,
    surfaces: SEARCH_ONLY,
    status: "live",
    keywords: ["بطاقات", "حفظ", "مراجعة", "فوائد", "محفوظات", "حفظ قرآن"],
    aliases: ["الفوائد والبطاقات", "بطاقات المراجعة", "المحفوظات", "بطاقات حفظ القرآن", "بطاقات الحفظ والمراجعة"],
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
    id: "fiqh",
    label: "الفقه والأحكام",
    navLabel: "فقه",
    subtitle: "أبواب الفقه والفتاوى",
    route: "/fiqh",
    icon: Scale,
    group: "sciences",
    order: 50,
    featured: true,
    surfaces: ["bottomNav", "moreHub", "drawer", "home", "search"],
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
    label: "القاموس الإسلامي",
    subtitle: "معجم المصطلحات الشرعية",
    route: "/islamic-glossary",
    icon: BookText,
    group: "library",
    order: 30,
    surfaces: NAV,
    status: "live",
    keywords: ["مصطلح", "معجم", "قاموس", "مصطلحات إسلامية"],
    aliases: ["المصطلحات", "المصطلحات الإسلامية"],
    hub: "sections",
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
}));

function visible(s: SectionDef): boolean {
  return s.status !== "hidden";
}

export function sectionsForSurface(surface: Surface): SectionDef[] {
  return SECTIONS.filter((s) => {
    if (!visible(s) || !s.surfaces.includes(surface)) return false;
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
    if (!visible(s) || s.group !== group || !s.surfaces.includes(surface) || s.order < 0) {
      return false;
    }
    if (surface === "moreHub" || surface === "drawer" || surface === "home") {
      return s.hub === "sections";
    }
    return true;
  }).sort((a, b) => a.order - b.order);
}

export function featuredSections(): SectionDef[] {
  return SECTIONS.filter((s) => visible(s) && s.featured && s.hub === "sections").sort(
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
