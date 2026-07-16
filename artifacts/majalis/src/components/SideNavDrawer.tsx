import { createPortal } from "react-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, BarChart2, BarChart3, BookMarked, BookOpen, BookText, BookUser,
  Bot, Building2, Calculator, Calendar, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Compass, CreditCard, FileText, Gavel, GitBranch, GraduationCap,
  Heart, HelpCircle, Home, Landmark, Layers, Library, Lightbulb,
  LogIn, Map, MapPin, Mic, Mic2, Moon, Network, Radio, RefreshCw, Repeat2,
  Rss, Scale, ScrollText, Search, Settings, Shield, Sparkles, Star, Stethoscope,
  Sun, Tv, Users, UserPlus, Waypoints, X, Zap,
} from "lucide-react";
import { useAuth } from "./AuthProvider";

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
      { href: "/",        label: "الصفحة الرئيسية",    Icon: Home },
      { href: "/updates", label: "آخر المستجدات",       Icon: Rss },
      { href: "/calendar", label: "التقويم الهجري",     Icon: Calendar,  desc: "التقويم والمناسبات الإسلامية" },
      { href: "/occasions", label: "المناسبات الإسلامية", Icon: Star,     desc: "أذكار المناسبات والأعياد" },
      { href: "/islam-stats", label: "الإسلام في أرقام",  Icon: BarChart3, desc: "إحصائيات ومعطيات إسلامية" },
      { href: "/about",   label: "عن التطبيق",           Icon: HelpCircle, desc: "تعرّف على المجلس العلمي" },
      { href: "/features-in-progress", label: "مميزات قيد التطوير", Icon: Layers, desc: "ما الذي نعمل عليه حاليًا" },
    ],
  },
  {
    id: "learn",
    title: "تعلّم",
    icon: <IcoGradCap />,
    subGroups: [
      {
        id: "learn-lessons",
        title: "الدروس والمسارات",
        items: [
          { href: "/learn",               label: "أبواب العلم",         Icon: Layers,        desc: "فهرس شامل لكل العلوم الشرعية بتصنيف واضح" },
          { href: "/lessons",            label: "الدروس والمحاضرات",   Icon: GraduationCap, desc: "دروس صوتية ومرئية" },
          { href: "/start-here",         label: "ابدأ من هنا",         Icon: Waypoints,     desc: "مسار المبتدئ في طلب العلم" },
          { href: "/adab-talab-ilm",     label: "آداب طالب العلم",    Icon: Star,          desc: "شروط وآداب طلب العلم الشرعي" },
          { href: "/learning/paths",     label: "المسارات العلمية",    Icon: Layers,        desc: "تعلّم منظم من المبتدئ للمتقدم" },
          { href: "/my-learning",        label: "لوحتي التعليمية",    Icon: BarChart3,     desc: "إحصائياتك وتقدمك" },
          { href: "/learning-plan",      label: "خطة التعلّم",        Icon: BarChart2,     desc: "خطتك الأسبوعية للدراسة" },
          { href: "/quiz",               label: "المسابقة التعليمية",  Icon: Zap,           desc: "اختبر معلوماتك" },
          { href: "/flashcards",         label: "بطاقات المراجعة",     Icon: CreditCard,    desc: "راجع المعلومات بطاقةً بطاقة" },
          { href: "/assistant",          label: "المساعد الذكي",       Icon: Bot,           desc: "استفسر عن أي مسألة" },
        ],
      },
      {
        id: "learn-hadith",
        title: "الحديث والسنة",
        items: [
          { href: "/hadith",             label: "الأحاديث النبوية",   Icon: ScrollText,  desc: "موسوعة الأحاديث بالتصنيف" },
          { href: "/arbaeen-nawawi",     label: "الأربعون النووية",   Icon: FileText,    desc: "٤٠ حديثاً مع شرح وتتبع" },
          { href: "/hadith-science",     label: "مصطلح الحديث",       Icon: BookOpen,    desc: "السند والمتن والدرجات" },
          { href: "/hikam-salaf",        label: "حكم السلف الصالح",   Icon: BookMarked,  desc: "حِكَم وأقوال العلماء المأثورة" },
          { href: "/wasaya-nabawiyya",   label: "الوصايا النبوية",    Icon: Star,        desc: "خلاصة الوصايا الجامعة" },
          { href: "/shamael",            label: "الشمائل المحمدية",   Icon: BookUser,    desc: "صفاته ﷺ خَلقاً وخُلقاً" },
          { href: "/prophetic-medicine", label: "الطب النبوي",        Icon: Stethoscope, desc: "هديه ﷺ في الصحة والعلاج" },
        ],
      },
      {
        id: "learn-aqeeda",
        title: "العقيدة والتوحيد",
        items: [
          { href: "/tawhid",      label: "التوحيد والعقيدة",   Icon: Shield,    desc: "أنواع التوحيد ومسائل العقيدة" },
          { href: "/asma-husna",  label: "الأسماء الحسنى",     Icon: Sparkles,  desc: "٩٩ اسماً بمعانيها وآياتها" },
          { href: "/arkan",       label: "أركان الإسلام",      Icon: Landmark,  desc: "الشهادتان والصلاة والزكاة..." },
          { href: "/arkan-iman",  label: "أركان الإيمان",      Icon: Star,      desc: "الإيمان بالله والملائكة..." },
          { href: "/akhlaq",      label: "الأخلاق الإسلامية",  Icon: Heart,     desc: "فضائل الأخلاق ومحاسنها" },
          { href: "/janna-naar",  label: "الجنة والنار",       Icon: Sparkles,  desc: "صفة الجنة والنار من النصوص" },
          { href: "/alamat-saah", label: "علامات الساعة",      Icon: Clock,     desc: "الصغرى والكبرى بالترتيب" },
          { href: "/malaika",     label: "الملائكة",           Icon: Sparkles,  desc: "أسماؤهم ومهامهم وصفاتهم" },
          { href: "/miracles",    label: "الإعجاز العلمي",     Icon: Lightbulb, desc: "إعجاز القرآن والكون" },
        ],
      },
      {
        id: "learn-fiqh",
        title: "الفقه والأحكام",
        items: [
          { href: "/fiqh",          label: "مدخل الفقه",        Icon: BookText,   desc: "بوابة الفقه والفتاوى والأحكام" },
          { href: "/fiqh-qawaid",   label: "القواعد الفقهية",   Icon: Scale,      desc: "القواعد الخمس الكبرى وفروعها" },
          { href: "/madhahib",      label: "المذاهب الأربعة",   Icon: BookOpen,   desc: "الحنفي والمالكي والشافعي والحنبلي" },
          { href: "/tahara",        label: "الطهارة",            Icon: Repeat2,    desc: "الوضوء والغسل والتيمم" },
          { href: "/salah-guide",   label: "الصلاة",             Icon: BookMarked, desc: "دليل الصلاة كاملاً" },
          { href: "/zakat",         label: "الزكاة",             Icon: Calculator, desc: "أحكام الزكاة وحسابها" },
          { href: "/sawm",          label: "الصيام",             Icon: Moon,       desc: "أحكام رمضان والنوافل" },
          { href: "/hajj",          label: "الحج والعمرة",       Icon: Landmark,   desc: "مناسك الحج والعمرة" },
          { href: "/janaza",        label: "الجنائز",            Icon: ScrollText, desc: "أحكام الجنائز والتعزية" },
          { href: "/mawarith",      label: "المواريث",           Icon: Scale,      desc: "دليل الفرائض وأحكامها" },
          { href: "/mawarith/calculator", label: "حاسبة المواريث", Icon: Calculator, desc: "احسب أنصبة الورثة تلقائيًا" },
          { href: "/fatwa",         label: "الفتاوى",            Icon: Gavel,      desc: "فتاوى مُحقَّقة ومُصنَّفة" },
          { href: "/rulings",       label: "الأحكام الشرعية",   Icon: Scale,      desc: "موسوعة الأحكام بالمذاهب" },
          { href: "/fiqh-council",  label: "الهيئات الإسلامية", Icon: Users,      desc: "قرارات المجامع وهيئات الإفتاء" },
          { href: "/qa",            label: "الأسئلة والأجوبة",  Icon: HelpCircle, desc: "أسئلة وأجوبة شرعية موثقة" },
          { href: "/islamic-sects", label: "الفرق الإسلامية",   Icon: BookText,   desc: "نشأة الفرق وعقائدها وانتشارها" },
          { href: "/amr-bil-maruf", label: "الأمر بالمعروف",    Icon: Shield,     desc: "مراتبه الثلاث وشروطه وأحكامه" },
        ],
      },
      {
        id: "learn-ibadah",
        title: "العبادة والأذكار",
        items: [
          { href: "/adhkar",           label: "الأذكار",              Icon: Repeat2,      desc: "الصباح والمساء والنوم والصلاة" },
          { href: "/duas",             label: "الأدعية الشرعية",     Icon: BookMarked,   desc: "أدعية مصنفة بالمناسبات" },
          { href: "/tasbih",           label: "التسبيح",             Icon: Repeat2,      desc: "عداد التسبيح الرقمي" },
          { href: "/sunan-yawmiyya",   label: "السنن اليومية",       Icon: CheckCircle2, desc: "السنن اليومية مع تتبع إتمامها" },
          { href: "/prayer-ranks",     label: "فضائل الصلاة",        Icon: Shield,       desc: "أحاديث وآيات فضل الصلاة" },
          { href: "/fadail-aamal",     label: "فضائل الأعمال",       Icon: Star,         desc: "أحاديث صحيحة في الفضائل" },
          { href: "/fawaid",           label: "الفوائد العلمية",     Icon: Heart,        desc: "فوائد وفرائد مختارة" },
          { href: "/tawba",            label: "التوبة والاستغفار",   Icon: RefreshCw,    desc: "فضل التوبة وأدعية الاستغفار" },
          { href: "/raqaiq",           label: "الرقائق والزهد",      Icon: Heart,        desc: "تزكية النفس والمواعظ" },
          { href: "/prayer-times",     label: "مواقيت الصلاة",       Icon: Clock,        desc: "أوقات الصلاة بموقعك" },
          { href: "/prayer-countdown", label: "عداد الصلاة",         Icon: Activity,     desc: "العد التنازلي للصلاة القادمة" },
          { href: "/qibla",            label: "اتجاه القبلة",        Icon: Compass,      desc: "البوصلة نحو مكة المكرمة" },
        ],
      },
      {
        id: "learn-seerah",
        title: "السيرة والتاريخ",
        items: [
          { href: "/seerah",          label: "السيرة النبوية",   Icon: BookUser,  desc: "من المولد حتى الوفاة ﷺ" },
          { href: "/sahabah",         label: "الصحابة الكرام",  Icon: Users,     desc: "سِيَر الصحابة وفضائلهم" },
          { href: "/prophets",        label: "قصص الأنبياء",    Icon: Star,      desc: "٢٥ نبياً بقصصهم ومعجزاتهم" },
          { href: "/islamic-stories", label: "صحابة وفتوحات",   Icon: Waypoints, desc: "قصص الصحابة والفتوحات" },
          { href: "/stories",         label: "القصص الإسلامية", Icon: BookOpen,  desc: "قصص إسلامية مؤثرة ومعبِّرة" },
        ],
      },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    icon: <IcoQuran />,
    items: [
      { href: "/quran-hub",           label: "مركز القرآن",        Icon: Layers,        desc: "بوابة كل ما يتعلق بالقرآن" },
      { href: "/daily-wird",          label: "الورد اليومي",       Icon: Sun,           desc: "ختمة متجددة يومياً" },
      { href: "/quran/tajweed",       label: "علم التجويد",        Icon: Mic2,          desc: "أحكام التجويد بالأمثلة" },
      { href: "/ulum-quran",          label: "علوم القرآن",        Icon: GraduationCap, desc: "التفسير والناسخ والمنسوخ" },
      { href: "/quran/surah-stories", label: "قصص السور",          Icon: BookText,      desc: "أسباب النزول ومحاور السور" },
      { href: "/duas-quran",          label: "أدعية القرآن",       Icon: BookMarked,    desc: "الأدعية القرآنية المختارة" },
      { href: "/quran-radio",         label: "إذاعة القرآن",       Icon: Radio,         desc: "استماع مباشر" },
      { href: "/quran-live",          label: "البث المباشر",       Icon: Tv,            desc: "من مكة والمدينة" },
      { href: "/quran-circles",       label: "حلقات التحفيظ",      Icon: Users,         desc: "دليل حلقات القرآن" },
      { href: "/quran-memorization",  label: "اختبارات الحفظ",     Icon: Zap,           desc: "12 نوعًا من اختبارات الحفظ" },
      { href: "/mutashabihat",        label: "الآيات المتشابهات",  Icon: GitBranch,     desc: "تمييز الآيات المتشابهة لفظًا" },
      { href: "/muezzins",            label: "مكتبة القراء",       Icon: Mic,           desc: "مقاطع صوتية للقراء" },
    ],
  },
  {
    id: "search",
    title: "ابحث",
    icon: <IcoSearch />,
    items: [
      { href: "/search",              label: "البحث الشامل",        Icon: Search,    desc: "ابحث في كل محتوى التطبيق" },
      { href: "/scholarly-research",  label: "الباحث الشرعي",      Icon: BookOpen,  desc: "بحث بالذكاء الاصطناعي في المصادر" },
      { href: "/academic-research",   label: "الأبحاث العلمية",    Icon: FileText,  desc: "أبحاث ودراسات شرعية" },
      { href: "/knowledge-graph",     label: "شبكة المعرفة",        Icon: GitBranch, desc: "العلاقات بين المفاهيم والمصطلحات" },
      { href: "/knowledge-map",       label: "الخريطة المعرفية",   Icon: Network,   desc: "خريطة العلوم الشرعية مرئية" },
      { href: "/mind-map",            label: "الخرائط الذهنية",     Icon: Map,       desc: "تنظيم المعلومات مرئياً" },
      { href: "/islamic-glossary",    label: "المصطلحات الإسلامية", Icon: BookOpen,  desc: "معجم المصطلحات الفقهية" },
    ],
  },
  {
    id: "library",
    title: "المكتبة",
    icon: <IcoLibrary />,
    items: [
      { href: "/library",       label: "المكتبة الشرعية",     Icon: Library,    desc: "كتب ومخطوطات إسلامية" },
      { href: "/annual-courses", label: "الدورات العلمية",    Icon: BookMarked, desc: "برامج وكورسات منظمة" },
      { href: "/scholars",      label: "أعلام الإسلام",       Icon: BookUser,   desc: "تراجم العلماء والمشايخ" },
      { href: "/universities",  label: "دليل الجامعات",       Icon: Building2,  desc: "الجامعات الإسلامية حول العالم" },
      { href: "/institutions",       label: "المؤسسات الإسلامية",  Icon: Landmark,   desc: "مساجد · مكتبات · مراكز · جامعات" },
      { href: "/islamic-landmarks",  label: "المشاهد والمساجد",    Icon: MapPin,     desc: "خريطة المشاهد الإسلامية التاريخية" },
    ],
  },
];

/* خريطة: href → id المجموعة */
const HREF_TO_GROUP: Record<string, string> = {};
DRAWER_GROUPS.forEach(g => {
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
}: {
  subGroup: SubGroup;
  isActive: (href: string) => boolean;
  onClose: () => void;
  defaultOpen: boolean;
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
              onClick={onClose}
              className={`side-nav-link side-nav-link--v2${isActive(href) ? " is-active" : ""}`}
            >
              <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
              <span className="side-nav-link__content">
                <span className="side-nav-link__label">{label}</span>
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

  if (!open || typeof document === "undefined") return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`);
  };

  const drawer = (
    <div className="mobile-nav-layer mobile-nav-layer--drawer" role="presentation">
      <button
        type="button"
        className="mobile-nav-backdrop"
        aria-label="إغلاق القائمة الجانبية"
        onClick={onClose}
      />
      <aside
        id="main-navigation-drawer"
        className="side-nav-drawer--v2"
        role="dialog"
        aria-modal="true"
        aria-label="القائمة الجانبية"
        onClick={(e) => e.stopPropagation()}
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
          {DRAWER_GROUPS.map((group) => {
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
                            onClick={onClose}
                            className={`side-nav-link side-nav-link--v2${isActive(href) ? " is-active" : ""}`}
                          >
                            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                            <span className="side-nav-link__content">
                              <span className="side-nav-link__label">{label}</span>
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
