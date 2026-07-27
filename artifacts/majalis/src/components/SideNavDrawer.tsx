import { createPortal } from "react-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { seoNavLabel } from "@/lib/seo-nav-labels";
import {
  Activity, BarChart3, BookMarked, BookOpen, BookText, BookUser,
  Bot, Calculator, Calendar, CalendarDays, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Compass, CreditCard, FileText, GitBranch, GraduationCap,
  Heart, HelpCircle, Home, Landmark, Layers, Library,
  LogIn, MapPin, Mic2, Moon, Network, Quote, RefreshCw, Repeat2,
  Rss, Scale, ScrollText, Search, Settings, Shield, Sparkles, Star, Stethoscope,
  Sun, Trophy, Users, UserPlus, Waypoints, X, Zap,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { usePageSwipe } from "@/hooks/usePageSwipe";
import { filterNavItems, isComingSoonPath } from "@/lib/nav-visibility";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  onLogout?: () => void;
};

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  desc?: string;
};

type SubGroup = {
  id: string;
  title: string;
  items: NavItem[];
};

type NavGroup = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items?: NavItem[];
  subGroups?: SubGroup[];
};

/* ── أيقونات SVG للأقسام ── */
const IcoHome = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1.5 8L9 2l7.5 6v8.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V8z"/>
    <path d="M6.5 17V11h5v6"/>
  </svg>
);
const IcoQuran = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 15V4C8 2.5 6 2 3 2.5v12c3-.5 5 0 6 1.5z"/>
    <path d="M9 15V4c1-1.5 3-2 6-1.5v12c-3-.5-5 0-6 1.5z"/>
    <line x1="9" y1="4" x2="9" y2="15"/>
  </svg>
);
const IcoGradCap = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 3 1 7l8 4 8-4-8-4z"/>
    <path d="M5 9.5v3.5a4 4 0 0 0 8 0V9.5"/>
    <line x1="16" y1="7" x2="16" y2="12"/>
  </svg>
);
const IcoUser = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="6" r="4"/>
    <path d="M2 17c0-3.866 3.134-7 7-7s7 3.134 7 7"/>
  </svg>
);
const IcoSearch = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="5.5"/>
    <line x1="11.5" y1="11.5" x2="16" y2="16"/>
  </svg>
);
const IcoLibrary = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 2h2v14H3z"/>
    <path d="M7 2h2v14H7z"/>
    <path d="M11.5 2.5l1.93.52L9.5 15.5l-1.93-.52z"/>
    <path d="M15 2h2v14h-2z"/>
  </svg>
);

/* ── بيانات القائمة الجانبية — 6 أقسام ── */
const DRAWER_GROUPS: NavGroup[] = [
  {
    id: "home",
    title: "الرئيسية",
    icon: <IcoHome />,
    items: [
      { href: "/",        label: seoNavLabel("/", "الصفحة الرئيسية"),    Icon: Home },
      { href: "/updates", label: seoNavLabel("/updates", "آخر المستجدات"),       Icon: Rss },
      { href: "/calendar", label: seoNavLabel("/calendar", "تقويم الدروس"),     Icon: Calendar,  desc: "التقويم والمناسبات الإسلامية" },
      { href: "/occasions", label: seoNavLabel("/occasions", "المناسبات الإسلامية"), Icon: Star,     desc: "أذكار المناسبات والأعياد" },
      { href: "/about",   label: seoNavLabel("/about", "من نحن"),           Icon: HelpCircle, desc: "تعرّف على المجلس العلمي" },
    ],
  },
  {
    id: "learn",
    title: "تعلّم",
    icon: <IcoGradCap />,
    subGroups: [
      {
        id: "learn-lessons",
        title: "تعلّم منظّم",
        items: [
          { href: "/learning/paths",     label: seoNavLabel("/learning/paths", "المسارات العلمية"),    Icon: Layers,        desc: "تعلّم منظم من المبتدئ للمتقدم" },
          { href: "/annual-courses",     label: seoNavLabel("/annual-courses", "الدورات"),             Icon: BookMarked,    desc: "دورات حضورية وموسمية + مقررات المسارات" },
          { href: "/lessons",            label: seoNavLabel("/lessons", "الدروس"),              Icon: GraduationCap, desc: "دروس صوتية ومرئية" },
          { href: "/library",            label: seoNavLabel("/library", "المكتبة العلمية"),      Icon: Library,       desc: "الكتب والمتون المعتمدة في المناهج" },
          { href: "/my-learning",        label: seoNavLabel("/my-learning", "حسابي"),     Icon: BarChart3,     desc: "إحصائياتك وتقدمك في المسارات" },
          { href: "/my-learning#myl2-certs-hd", label: seoNavLabel("/my-learning#myl2-certs-hd", "شهاداتي"),     Icon: Trophy,        desc: "شهاداتك العلمية المكتسبة" },
          { href: "/my-citations",       label: seoNavLabel("/my-citations", "مكتبة الاقتباسات"),       Icon: Quote,         desc: "اقتباساتك وفوائدك المحفوظة" },
          { href: "/reading-plans",      label: seoNavLabel("/reading-plans", "خطط القراءة"),        Icon: CalendarDays,  desc: "خطة قراءة ذكية لأي كتاب مع متابعة التقدّم" },
        ],
      },
      {
        id: "learn-tools",
        title: "أدوات التعلّم",
        items: [
          { href: "/learn",               label: seoNavLabel("/learn", "أبواب العلم"),         Icon: Layers,        desc: "فهرس شامل لكل العلوم الشرعية بتصنيف واضح" },
          { href: "/start-here",         label: seoNavLabel("/start-here", "ابدأ من هنا"),         Icon: Waypoints,     desc: "مسار المبتدئ في طلب العلم" },
          { href: "/adab-talab-ilm",     label: seoNavLabel("/adab-talab-ilm", "آداب طالب العلم"),    Icon: Star,          desc: "شروط وآداب طلب العلم الشرعي" },
          { href: "/quiz",               label: seoNavLabel("/quiz", "لعبة سين جيم"),  Icon: Zap,           desc: "اختبر معلوماتك" },
          { href: "/flashcards",         label: seoNavLabel("/flashcards", "بطاقات المراجعة"),     Icon: CreditCard,    desc: "راجع المعلومات بطاقةً بطاقة" },
          { href: "/assistant",          label: seoNavLabel("/assistant", "المساعد العلمي"),       Icon: Bot,           desc: "استفسر عن أي مسألة" },
        ],
      },
      {
        id: "learn-hadith",
        title: "الحديث والسنة",
        items: [
          { href: "/hadith",             label: seoNavLabel("/hadith", "الأحاديث النبوية"),   Icon: ScrollText,  desc: "موسوعة الأحاديث بالتصنيف" },
          { href: "/hadith/books-and-rulings", label: seoNavLabel("/hadith/books-and-rulings", "المتون الحديثية وأحاديث الأحكام"), Icon: FileText, desc: "الأربعون النووية ومتون الأحكام الموثقة" },
          { href: "/hadith-science",     label: seoNavLabel("/hadith-science", "مصطلح الحديث"),       Icon: BookOpen,    desc: "السند والمتن والدرجات" },
          { href: "/hikam-salaf",        label: seoNavLabel("/hikam-salaf", "حكم السلف الصالح"),   Icon: BookMarked,  desc: "حِكَم وأقوال العلماء المأثورة" },
          { href: "/wasaya-nabawiyya",   label: seoNavLabel("/wasaya-nabawiyya", "الوصايا النبوية"),    Icon: Star,        desc: "خلاصة الوصايا الجامعة" },
          { href: "/shamael",            label: seoNavLabel("/shamael", "صفةُ سيِّد الخلقِ ﷺ"),   Icon: BookUser,    desc: "صفاته ﷺ خَلقاً وخُلقاً" },
          { href: "/prophetic-medicine", label: seoNavLabel("/prophetic-medicine", "الطب النبوي"),        Icon: Stethoscope, desc: "هديه ﷺ في الصحة والعلاج" },
        ],
      },
      {
        id: "learn-aqeeda",
        title: "العقيدة والتوحيد",
        items: [
          { href: "/tawhid",      label: seoNavLabel("/tawhid", "التوحيد والعقيدة"),   Icon: Shield,    desc: "أنواع التوحيد ومسائل العقيدة" },
          { href: "/asma-husna",  label: seoNavLabel("/asma-husna", "الأسماء الحسنى"),     Icon: Sparkles,  desc: "٩٩ اسماً بمعانيها وآياتها" },
          { href: "/arkan",       label: seoNavLabel("/arkan", "أركان الإسلام الخمسة"),      Icon: Landmark,  desc: "الشهادتان والصلاة والزكاة..." },
          { href: "/arkan-iman",  label: seoNavLabel("/arkan-iman", "أركان الإيمان الستة"),      Icon: Star,      desc: "الإيمان بالله والملائكة..." },
          { href: "/akhlaq",      label: seoNavLabel("/akhlaq", "مكارم الأخلاق"),  Icon: Heart,     desc: "فضائل الأخلاق ومحاسنها" },
          { href: "/janna-naar",  label: seoNavLabel("/janna-naar", "صفة الجنة"),       Icon: Sparkles,  desc: "صفة الجنة والنار من النصوص" },
          { href: "/alamat-saah", label: seoNavLabel("/alamat-saah", "علامات الساعة"),      Icon: Clock,     desc: "الصغرى والكبرى بالترتيب" },
          { href: "/malaika",     label: seoNavLabel("/malaika", "الملائكة"),           Icon: Sparkles,  desc: "أسماؤهم ومهامهم وصفاتهم" },
        ],
      },
      {
        id: "learn-fiqh",
        title: "الفقه والأحكام",
        items: [
          { href: "/fiqh",          label: seoNavLabel("/fiqh", "مدخل الفقه"),        Icon: BookText,   desc: "بوابة الفقه والأحكام الشرعية" },
          { href: "/fiqh-qawaid",   label: seoNavLabel("/fiqh-qawaid", "القواعد الفقهية"),   Icon: Scale,      desc: "القواعد الخمس الكبرى وفروعها" },
          { href: "/madhahib",      label: seoNavLabel("/madhahib", "المذاهب الأربعة"),   Icon: BookOpen,   desc: "الحنفي والمالكي والشافعي والحنبلي" },
          { href: "/tahara",        label: seoNavLabel("/tahara", "الطهارة"),            Icon: Repeat2,    desc: "الوضوء والغسل والتيمم" },
          { href: "/salah-guide",   label: seoNavLabel("/salah-guide", "الصلاة"),             Icon: BookMarked, desc: "دليل الصلاة كاملاً" },
          { href: "/zakat",         label: seoNavLabel("/zakat", "الزكاة"),             Icon: Calculator, desc: "أحكام الزكاة وحسابها" },
          { href: "/sawm",          label: seoNavLabel("/sawm", "الصيام"),             Icon: Moon,       desc: "أحكام رمضان والنوافل" },
          { href: "/hajj",          label: seoNavLabel("/hajj", "الحج والعمرة"),       Icon: Landmark,   desc: "مناسك الحج والعمرة" },
          { href: "/janaza",        label: seoNavLabel("/janaza", "الجنائز"),            Icon: ScrollText, desc: "أحكام الجنائز والتعزية" },
          { href: "/mawarith",      label: seoNavLabel("/mawarith", "المواريث"),           Icon: Scale,      desc: "دليل الفرائض وأحكامها" },
          { href: "/mawarith/calculator", label: seoNavLabel("/mawarith/calculator", "حاسبة المواريث"), Icon: Calculator, desc: "احسب أنصبة الورثة تلقائيًا" },
          { href: "/rulings",       label: seoNavLabel("/rulings", "الأحكام الشرعية"),   Icon: Scale,      desc: "موسوعة الأحكام بالمذاهب" },
          { href: "/fiqh-council",  label: seoNavLabel("/fiqh-council", "المجمع الفقهي"), Icon: Users,      desc: "قرارات المجامع وهيئات الإفتاء" },
          { href: "/qa",            label: seoNavLabel("/qa", "الأسئلة والأجوبة"),  Icon: HelpCircle, desc: "أسئلة وأجوبة شرعية موثقة" },
          { href: "/islamic-sects", label: seoNavLabel("/islamic-sects", "الفرق الإسلامية"),   Icon: BookText,   desc: "نشأة الفرق وعقائدها وانتشارها" },
          { href: "/amr-bil-maruf", label: seoNavLabel("/amr-bil-maruf", "الأمر بالمعروف"),    Icon: Shield,     desc: "مراتبه الثلاث وشروطه وأحكامه" },
        ],
      },
      {
        id: "learn-ibadah",
        title: "العبادة والأذكار",
        items: [
          { href: "/adhkar",           label: seoNavLabel("/adhkar", "الأذكار"),              Icon: Repeat2,      desc: "الصباح والمساء والنوم والصلاة" },
          { href: "/duas",             label: seoNavLabel("/duas", "الأدعية الشرعية"),     Icon: BookMarked,   desc: "أدعية مصنفة بالمناسبات" },
          { href: "/tasbih",           label: seoNavLabel("/tasbih", "التسبيح"),             Icon: Repeat2,      desc: "عداد التسبيح الرقمي" },
          { href: "/sunan-yawmiyya",   label: seoNavLabel("/sunan-yawmiyya", "السنن اليومية"),       Icon: CheckCircle2, desc: "السنن اليومية مع تتبع إتمامها" },
          { href: "/prayer-ranks",     label: seoNavLabel("/prayer-ranks", "فضائل الصلاة"),        Icon: Shield,       desc: "أحاديث وآيات فضل الصلاة" },
          { href: "/fadail-aamal",     label: seoNavLabel("/fadail-aamal", "فضائل الأعمال"),       Icon: Star,         desc: "أحاديث صحيحة في الفضائل" },
          { href: "/fawaid",           label: seoNavLabel("/fawaid", "الفوائد العلمية"),     Icon: Heart,        desc: "فوائد وفرائد مختارة" },
          { href: "/tawba",            label: seoNavLabel("/tawba", "التوبة والاستغفار"),   Icon: RefreshCw,    desc: "فضل التوبة وأدعية الاستغفار" },
          { href: "/raqaiq",           label: seoNavLabel("/raqaiq", "الرقائق والزهد"),      Icon: Heart,        desc: "تزكية النفس والمواعظ" },
          { href: "/prayer-times",     label: seoNavLabel("/prayer-times", "مواقيت الصلاة"),       Icon: Clock,        desc: "أوقات الصلاة بموقعك" },
          { href: "/prayer-countdown", label: seoNavLabel("/prayer-countdown", "عداد الصلاة"),         Icon: Activity,     desc: "العد التنازلي للصلاة القادمة" },
          { href: "/qibla",            label: seoNavLabel("/qibla", "اتجاه القبلة"),        Icon: Compass,      desc: "البوصلة نحو مكة المكرمة" },
        ],
      },
      {
        id: "learn-seerah",
        title: "السيرة والتاريخ",
        items: [
          { href: "/seerah",          label: seoNavLabel("/seerah", "السيرة النبوية"),   Icon: BookUser,  desc: "من المولد حتى الوفاة ﷺ" },
          { href: "/sahabah",         label: seoNavLabel("/sahabah", "الصحابة الكرام"),  Icon: Users,     desc: "سِيَر الصحابة وفضائلهم" },
          { href: "/prophets",        label: seoNavLabel("/prophets", "قصص الأنبياء"),    Icon: Star,      desc: "٢٥ نبياً مذكورًا بالاسم في القرآن" },
          { href: "/nations",         label: seoNavLabel("/nations", "الأمم السابقة"),   Icon: Landmark,  desc: "أخبار الأقوام في القرآن والسنة الصحيحة" },
          { href: "/stories",         label: seoNavLabel("/stories", "القصص الإسلامية"), Icon: BookOpen,  desc: "قصص الصحابة والفتوحات والتاريخ الإسلامي" },
        ],
      },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    icon: <IcoQuran />,
    items: [
      { href: "/quran-hub",           label: seoNavLabel("/quran-hub", "مركز القرآن"),        Icon: Layers,        desc: "بوابة كل ما يتعلق بالقرآن" },
      { href: "/mushaf",              label: seoNavLabel("/mushaf", "المصحف الشريف"),      Icon: BookOpen,      desc: "اقرأ القرآن الكريم كاملاً" },
      { href: "/quran/surahs",        label: seoNavLabel("/quran/surahs", "فهرس السور"),         Icon: BookText,      desc: "دليل 114 سورة بالبحث والفلاتر" },
      { href: "/daily-wird",          label: seoNavLabel("/daily-wird", "الورد اليومي"),       Icon: Sun,           desc: "ختمة متجددة يومياً" },
      { href: "/quran/tajweed",       label: seoNavLabel("/quran/tajweed", "علم التجويد"),        Icon: Mic2,          desc: "أحكام التجويد بالأمثلة" },
      { href: "/ulum-quran",          label: seoNavLabel("/ulum-quran", "علوم القرآن الكريم"),        Icon: GraduationCap, desc: "التفسير والناسخ والمنسوخ" },
      { href: "/quran/surah-stories", label: seoNavLabel("/quran/surah-stories", "قصص السور"),          Icon: BookText,      desc: "أسباب النزول ومحاور السور" },
      { href: "/duas-quran",          label: seoNavLabel("/duas-quran", "أدعية القرآن"),       Icon: BookMarked,    desc: "الأدعية القرآنية المختارة" },
      { href: "/quran-memorization",  label: seoNavLabel("/quran-memorization", "اختبارات الحفظ"),     Icon: Zap,           desc: "12 نوعًا من اختبارات الحفظ" },
      { href: "/quran/memorization-plans", label: seoNavLabel("/quran/memorization-plans", "خطط الحفظ"),     Icon: CalendarDays,  desc: "خطط مرنة للحفظ والمراجعة والتثبيت" },
      { href: "/mutashabihat",        label: seoNavLabel("/mutashabihat", "الآيات المتشابهات"),  Icon: GitBranch,     desc: "تمييز الآيات المتشابهة لفظًا" },
    ],
  },
  {
    id: "search",
    title: "ابحث",
    icon: <IcoSearch />,
    items: [
      { href: "/search",              label: seoNavLabel("/search", "البحث الشامل"),        Icon: Search,    desc: "ابحث في كل محتوى التطبيق" },
      { href: "/academic-research",   label: seoNavLabel("/academic-research", "الأبحاث العلمية"),    Icon: FileText,  desc: "أبحاث ودراسات شرعية" },
      { href: "/knowledge-graph",     label: seoNavLabel("/knowledge-graph", "استكشف المعرفة"),      Icon: Network,   desc: "شبكة المعرفة والخريطة المعرفية" },
      { href: "/islamic-glossary",    label: seoNavLabel("/islamic-glossary", "المصطلحات الإسلامية"), Icon: BookOpen,  desc: "معجم المصطلحات الفقهية" },
    ],
  },
  {
    id: "library",
    title: "المكتبة",
    icon: <IcoLibrary />,
    items: [
      { href: "/library",       label: seoNavLabel("/library", "المكتبة العلمية"),     Icon: Library,    desc: "كتب ومخطوطات إسلامية" },
      { href: "/scholars",      label: seoNavLabel("/scholars", "أعلام الإسلام"),       Icon: BookUser,   desc: "تراجم العلماء والمشايخ" },
      { href: "/institutions",       label: seoNavLabel("/institutions", "المؤسسات الإسلامية"),  Icon: Landmark,   desc: "مساجد · مكتبات · مراكز · جامعات" },
      { href: "/islamic-landmarks",  label: seoNavLabel("/islamic-landmarks", "المشاهد والمساجد"),    Icon: MapPin,     desc: "خريطة المشاهد الإسلامية التاريخية" },
    ],
  },
];

const VISIBLE_DRAWER_GROUPS: NavGroup[] = DRAWER_GROUPS.map((g) => ({
  ...g,
  items: g.items ? filterNavItems(g.items) : undefined,
  subGroups: g.subGroups?.map((sg) => ({
    ...sg,
    items: filterNavItems(sg.items),
  })),
}));

/* خريطة: href → id المجموعة */
const HREF_TO_GROUP: Record<string, string> = {};
VISIBLE_DRAWER_GROUPS.forEach(g => {
  if (g.items) {
    g.items.forEach(item => { HREF_TO_GROUP[item.href] = g.id; });
  }
  if (g.subGroups) {
    g.subGroups.forEach(sg => {
      sg.items.forEach(item => { HREF_TO_GROUP[item.href] = g.id; });
    });
  }
});

function getActiveGroup(pathname: string): string {
  if (pathname === "/") return "home";
  for (const [href, gid] of Object.entries(HREF_TO_GROUP)) {
    if (href !== "/" && (pathname === href || pathname.startsWith(href + "/"))) return gid;
  }
  return "home";
}

/* ── مكوّن القسم الفرعي داخل "تعلّم" ── */
function SubGroupSection({
  subGroup,
  isActive,
  onClose,
  defaultOpen,
  onSoonClick,
}: {
  subGroup: SubGroup;
  isActive: (href: string) => boolean;
  onClose: () => void;
  defaultOpen: boolean;
  onSoonClick: (label: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="side-nav-subgroup">
      <button
        type="button"
        className="side-nav-subgroup__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{subGroup.title}</span>
        {open
          ? <ChevronUp size={12} strokeWidth={2.5} aria-hidden="true" />
          : <ChevronDown size={12} strokeWidth={2.5} aria-hidden="true" />}
      </button>
      {open && (
        <nav className="side-nav-subgroup__items" aria-label={subGroup.title}>
          {subGroup.items.map(({ href, label, Icon, desc }) => (
            <Link
              key={href}
              href={href}
              onClick={isComingSoonPath(href) ? (e) => { e.preventDefault(); onSoonClick(label); } : onClose}
              className={`side-nav-link side-nav-link--v2${isActive(href) ? " is-active" : ""}`}
              aria-label={isComingSoonPath(href) ? `${label} — قريبًا` : label}
            >
              <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
              <span className="side-nav-link__content">
                <span className="side-nav-link__label">
                  {label}
                  {isComingSoonPath(href) ? <span className="nav-soon-badge">قريبًا</span> : null}
                </span>
                {desc && <span className="side-nav-link__desc">{desc}</span>}
              </span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

export function SideNavDrawer({ open, onClose, onLogout }: DrawerProps) {
  const [pathname] = useLocation();
  const { isAdmin, isLoggedIn, user } = useAuth();

  const activeGroup = useMemo(() => getActiveGroup(pathname), [pathname]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    return new Set(["home", activeGroup]);
  });

  function toggleGroup(id: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // إغلاق Escape يُعالَج مركزيًا في useMobileNavState (مستمع عام على window)
  // — لا حاجة لمستمع محلي مكرر هنا.

  // إمكانية الوصول: أعِد التركيز إلى العنصر الذي فتح القائمة (زر الهامبرغر
  // عادةً) عند الإغلاق، بدل فقدان التركيز أو بقائه على عنصر أُزيل من DOM.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    } else {
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  // سحب لليمين (فعليًا) يُغلق الدرج — إعادة استخدام أداة السحب الموجودة
  // (usePageSwipe، مُستخدَمة أصلاً لتقليب صفحات المصحف) بلا آلية جديدة.
  const { swipeHandlers } = usePageSwipe({
    onPrev: onClose,
    onNext: () => {},
    threshold: 70,
    disabled: !open,
  });

  if (!open || typeof document === "undefined") return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`);
  };

  const onSoonClick = (label: string) => {
    onClose();
    window.dispatchEvent(new CustomEvent("global-coming-soon-open", { detail: { title: label } }));
  };

  const drawer = (
    <div className="mobile-nav-layer mobile-nav-layer--drawer" role="presentation">
      <button
        type="button"
        className="mobile-nav-backdrop"
        aria-label="إغلاق القائمة الجانبية"
        onClick={onClose}
      />
      {/* onClick هنا لمنع انتشار النقر إلى الخلفية (button حقيقي أعلاه، مغلِق
          فعليًا وقابل للوصول بلوحة المفاتيح أصلًا) — لا إجراء مستقل هنا. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <aside
        id="main-navigation-drawer"
        className="side-nav-drawer--v2"
        role="dialog"
        aria-modal="true"
        aria-label="القائمة الجانبية"
        onClick={(e) => e.stopPropagation()}
        {...swipeHandlers}
      >
        {/* Header */}
        <div className="side-nav-drawer__head side-nav-drawer__head--v2">
          <div className="side-nav-drawer__brand">
            <img
              src="/logo-calligraphy.png"
              alt="المجلس العلمي"
              style={{ height: 36, maxWidth: 150, width: "auto", objectFit: "contain", borderRadius: 5 }}
              loading="lazy"
              decoding="async"
            />
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="side-nav-close">
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="side-nav-drawer__body">
          {VISIBLE_DRAWER_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.id);
            const hasActive = group.items
              ? group.items.some(i => isActive(i.href))
              : (group.subGroups ?? []).some(sg => sg.items.some(i => isActive(i.href)));

            return (
              <div key={group.id} className={`side-nav-group side-nav-group--v2${hasActive ? " side-nav-group--has-active" : ""}`}>
                <button
                  type="button"
                  className="side-nav-group__toggle"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  aria-controls={`nav-group-${group.id}`}
                >
                  <span className="side-nav-group__toggle-label">
                    <span className="side-nav-group__emoji" aria-hidden="true">{group.icon}</span>
                    <span className="side-nav-group__title">{group.title}</span>
                  </span>
                  {isOpen
                    ? <ChevronUp size={15} strokeWidth={2} aria-hidden="true" />
                    : <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />}
                </button>

                {isOpen && (
                  <div id={`nav-group-${group.id}`}>
                    {/* مجموعة بعناصر مسطحة */}
                    {group.items && (
                      <nav aria-label={group.title} className="side-nav-group__items">
                        {group.items.map(({ href, label, Icon, desc }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={isComingSoonPath(href) ? (e) => { e.preventDefault(); onSoonClick(label); } : onClose}
                            className={`side-nav-link side-nav-link--v2${isActive(href) ? " is-active" : ""}`}
                            aria-label={isComingSoonPath(href) ? `${label} — قريبًا` : label}
                          >
                            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                            <span className="side-nav-link__content">
                              <span className="side-nav-link__label">
                                {label}
                                {isComingSoonPath(href) ? <span className="nav-soon-badge">قريبًا</span> : null}
                              </span>
                              {desc && <span className="side-nav-link__desc">{desc}</span>}
                            </span>
                          </Link>
                        ))}
                      </nav>
                    )}
                    {/* مجموعة بأقسام فرعية (تعلّم) */}
                    {group.subGroups && (
                      <div className="side-nav-subgroups-wrap">
                        {group.subGroups.map(sg => (
                          <SubGroupSection
                            key={sg.id}
                            subGroup={sg}
                            isActive={isActive}
                            onClose={onClose}
                            defaultOpen={sg.items.some(i => isActive(i.href))}
                            onSoonClick={onSoonClick}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* حسابي */}
          <div className="side-nav-group side-nav-group--v2">
            <button
              type="button"
              className="side-nav-group__toggle"
              onClick={() => toggleGroup("account")}
              aria-expanded={openGroups.has("account")}
            >
              <span className="side-nav-group__toggle-label">
                <span className="side-nav-group__emoji" aria-hidden="true"><IcoUser /></span>
                <span className="side-nav-group__title">حسابي</span>
              </span>
              {openGroups.has("account")
                ? <ChevronUp size={15} strokeWidth={2} aria-hidden="true" />
                : <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />}
            </button>
            {openGroups.has("account") && (
              <nav aria-label="حسابي" className="side-nav-group__items">
                {isLoggedIn ? (
                  <>
                    {user?.profile?.full_name || user?.email ? (
                      <div className="side-nav-user-info">
                        <span className="side-nav-user-name">{user.profile?.full_name || user.email}</span>
                      </div>
                    ) : null}
                    <Link href="/my-learning" onClick={onClose} className={`side-nav-link side-nav-link--v2${isActive("/my-learning") ? " is-active" : ""}`}>
                      <BarChart3 size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">لوحتي التعليمية</span></span>
                    </Link>
                    <Link href="/stats" onClick={onClose} className={`side-nav-link side-nav-link--v2${isActive("/stats") ? " is-active" : ""}`}>
                      <Star size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">إنجازاتي</span></span>
                    </Link>
                    <Link href="/settings" onClick={onClose} className={`side-nav-link side-nav-link--v2${isActive("/settings") ? " is-active" : ""}`}>
                      <Settings size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">الإعدادات</span></span>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={onClose} className={`side-nav-link side-nav-link--v2${isActive("/admin") ? " is-active" : ""}`}>
                        <Settings size={16} strokeWidth={1.8} aria-hidden="true" />
                        <span className="side-nav-link__content"><span className="side-nav-link__label">لوحة التحكم</span></span>
                      </Link>
                    )}
                    <button type="button" className="side-nav-link side-nav-link--v2 side-nav-link--danger" onClick={() => { onClose(); onLogout?.(); }}>
                      <LogIn size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">تسجيل الخروج</span></span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={onClose} className="side-nav-link side-nav-link--v2">
                      <LogIn size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">تسجيل الدخول</span></span>
                    </Link>
                    <Link href="/register" onClick={onClose} className="side-nav-link side-nav-link--v2">
                      <UserPlus size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">إنشاء حساب</span></span>
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

export default SideNavDrawer;
