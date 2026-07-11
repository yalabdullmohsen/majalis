import { createPortal } from "react-dom";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, BarChart3, BookMarked, BookOpen, BookText, BookUser,
  Bot, Building2, Calculator, Calendar, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Compass, CreditCard, FileText, Gavel, GitBranch, GraduationCap,
  Heart, HelpCircle, Home, Landmark, Layers, Library, Lightbulb,
  LogIn, Map, Mic, Mic2, Moon, Network, Radio, RefreshCw, Repeat2,
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

type NavGroup = {
  id: string;
  title: string;
  emoji: string;
  items: NavItem[];
};

const DRAWER_GROUPS: NavGroup[] = [
  {
    id: "home", title: "الرئيسية", emoji: "🏠",
    items: [
      { href: "/",        label: "الصفحة الرئيسية", Icon: Home },
      { href: "/search",  label: "البحث الشامل",     Icon: Search },
      { href: "/updates", label: "آخر المستجدات",    Icon: Rss },
    ],
  },
  {
    id: "quran", title: "القرآن الكريم", emoji: "📖",
    items: [
      { href: "/quran-hub",           label: "مركز القرآن",        Icon: Layers,      desc: "بوابة كل ما يتعلق بالقرآن" },
      { href: "/quran",               label: "المصحف الشريف",      Icon: BookOpen,    desc: "تصفّح القرآن سورةً سورة" },
      { href: "/daily-wird",          label: "الورد اليومي",       Icon: Sun,         desc: "ختمة متجددة يومياً" },
      { href: "/quran/tajweed",       label: "علم التجويد",        Icon: Mic2,        desc: "أحكام التجويد بالأمثلة" },
      { href: "/ulum-quran",          label: "علوم القرآن",        Icon: GraduationCap, desc: "التفسير والناسخ والمنسوخ" },
      { href: "/quran/surah-stories", label: "قصص السور",          Icon: BookText,    desc: "أسباب النزول ومحاور السور" },
      { href: "/duas-quran",          label: "أدعية القرآن",       Icon: BookMarked,  desc: "الأدعية القرآنية المختارة" },
      { href: "/quran-radio",         label: "إذاعة القرآن",       Icon: Radio,       desc: "استماع مباشر" },
      { href: "/quran-live",          label: "البث المباشر",       Icon: Tv,          desc: "من مكة والمدينة" },
      { href: "/quran-circles",       label: "حلقات التحفيظ",      Icon: Users,       desc: "دليل حلقات القرآن" },
      { href: "/muezzins",            label: "مكتبة القراء",       Icon: Mic,         desc: "مقاطع صوتية للقراء" },
    ],
  },
  {
    id: "hadith", title: "الحديث والسنة", emoji: "📜",
    items: [
      { href: "/hadith",             label: "الأحاديث النبوية",    Icon: ScrollText,  desc: "موسوعة الأحاديث بالتصنيف" },
      { href: "/arbaeen-nawawi",     label: "الأربعون النووية",    Icon: FileText,    desc: "٤٠ حديثاً مع شرح وتتبع" },
      { href: "/hadith-science",     label: "مصطلح الحديث",        Icon: BookOpen,    desc: "السند والمتن والدرجات" },
      { href: "/wasaya-nabawiyya",   label: "الوصايا النبوية",     Icon: Star,        desc: "خلاصة الوصايا الجامعة" },
      { href: "/prophetic-medicine", label: "الطب النبوي",         Icon: Stethoscope, desc: "هديه ﷺ في الصحة والعلاج" },
      { href: "/shamael",            label: "الشمائل المحمدية",    Icon: BookUser,    desc: "صفاته ﷺ خَلقاً وخُلقاً" },
    ],
  },
  {
    id: "aqeeda", title: "العقيدة والتوحيد", emoji: "🕌",
    items: [
      { href: "/tawhid",      label: "التوحيد والعقيدة",      Icon: Shield,    desc: "أنواع التوحيد ومسائل العقيدة" },
      { href: "/arkan",       label: "أركان الإسلام",         Icon: Landmark,  desc: "الشهادتان والصلاة والزكاة..." },
      { href: "/arkan-iman",  label: "أركان الإيمان",         Icon: Star,      desc: "الإيمان بالله والملائكة..." },
      { href: "/asma-husna",  label: "الأسماء الحسنى",        Icon: Sparkles,  desc: "٩٩ اسماً بمعانيها وآياتها" },
      { href: "/janna-naar",  label: "الجنة والنار",          Icon: Sparkles,  desc: "صفة الجنة والنار من النصوص" },
      { href: "/alamat-saah", label: "علامات الساعة",         Icon: Clock,     desc: "الصغرى والكبرى بالترتيب" },
      { href: "/malaika",     label: "الملائكة",              Icon: Sparkles,  desc: "أسماؤهم ومهامهم وصفاتهم" },
      { href: "/miracles",    label: "الإعجاز العلمي",        Icon: Lightbulb, desc: "إعجاز القرآن والكون" },
    ],
  },
  {
    id: "fiqh", title: "الفقه والأحكام", emoji: "⚖️",
    items: [
      { href: "/fiqh",               label: "مدخل الفقه",          Icon: BookText,   desc: "بوابة الفقه والفتاوى والأحكام" },
      { href: "/tahara",             label: "الطهارة",              Icon: Repeat2,    desc: "الوضوء والغسل والتيمم" },
      { href: "/salah-guide",        label: "الصلاة",               Icon: BookOpen,   desc: "دليل الصلاة كاملاً" },
      { href: "/zakat",              label: "الزكاة",               Icon: Calculator, desc: "أحكام الزكاة وحسابها" },
      { href: "/sawm",               label: "الصيام",               Icon: Moon,       desc: "أحكام رمضان والنوافل" },
      { href: "/hajj",               label: "الحج والعمرة",         Icon: Landmark,   desc: "مناسك الحج والعمرة" },
      { href: "/janaza",             label: "الجنائز",              Icon: ScrollText, desc: "أحكام الجنائز والتعزية" },
      { href: "/mawarith",           label: "المواريث",             Icon: Scale,      desc: "حاسبة الفرائض والمواريث" },
      { href: "/fiqh-qawaid",        label: "القواعد الفقهية",      Icon: Scale,      desc: "القواعد الخمس الكبرى وفروعها" },
      { href: "/madhahib",           label: "المذاهب الأربعة",      Icon: Scale,      desc: "الحنفي والمالكي والشافعي والحنبلي" },
      { href: "/islamic-sects",      label: "الفرق الإسلامية",      Icon: Scale,      desc: "نشأة الفرق وعقائدها وانتشارها" },
      { href: "/qa",                 label: "الأسئلة والأجوبة",     Icon: HelpCircle, desc: "أسئلة وأجوبة شرعية موثقة" },
      { href: "/fatwa",              label: "الفتاوى",              Icon: Scale,      desc: "فتاوى مُحقَّقة ومُصنَّفة" },
      { href: "/rulings",            label: "الأحكام الشرعية",      Icon: Gavel,      desc: "موسوعة الأحكام بالمذاهب" },
      { href: "/fiqh-council",       label: "الهيئات الإسلامية",    Icon: Users,      desc: "قرارات المجامع وهيئات الإفتاء" },
      { href: "/amr-bil-maruf",      label: "الأمر بالمعروف",       Icon: Scale,      desc: "مراتبه الثلاث وشروطه وأحكامه" },
    ],
  },
  {
    id: "ibadah", title: "العبادة والأذكار", emoji: "🤲",
    items: [
      { href: "/adhkar",            label: "الأذكار",              Icon: Repeat2,     desc: "الصباح والمساء والنوم والصلاة" },
      { href: "/duas",              label: "الأدعية الشرعية",      Icon: BookMarked,  desc: "أدعية مصنفة بالمناسبات" },
      { href: "/tasbih",            label: "التسبيح",              Icon: Repeat2,     desc: "عداد التسبيح الرقمي" },
      { href: "/sunan-yawmiyya",    label: "السنن اليومية",        Icon: CheckCircle2, desc: "السنن اليومية مع تتبع إتمامها" },
      { href: "/prayer-ranks",      label: "فضائل الصلاة",        Icon: Shield,      desc: "أحاديث وآيات فضل الصلاة" },
      { href: "/fadail-aamal",      label: "فضائل الأعمال",       Icon: Star,        desc: "أحاديث صحيحة في الفضائل" },
      { href: "/prayer-times",      label: "مواقيت الصلاة",       Icon: Clock,       desc: "أوقات الصلاة بموقعك" },
      { href: "/prayer-countdown",  label: "عداد الصلاة",         Icon: Activity,    desc: "العد التنازلي للصلاة القادمة" },
      { href: "/qibla",             label: "اتجاه القبلة",        Icon: Compass,     desc: "البوصلة نحو مكة المكرمة" },
      { href: "/tawba",             label: "التوبة والاستغفار",   Icon: RefreshCw,   desc: "فضل التوبة وأدعية الاستغفار" },
      { href: "/raqaiq",            label: "الرقائق والزهد",      Icon: Heart,       desc: "تزكية النفس والمواعظ" },
      { href: "/occasions",         label: "المناسبات الإسلامية",  Icon: Calendar,    desc: "أذكار المناسبات والأعياد" },
    ],
  },
  {
    id: "seerah", title: "السيرة والتاريخ", emoji: "🌙",
    items: [
      { href: "/seerah",           label: "السيرة النبوية",        Icon: BookUser,  desc: "من المولد حتى الوفاة ﷺ" },
      { href: "/sahabah",          label: "الصحابة الكرام",        Icon: Users,     desc: "سِيَر الصحابة وفضائلهم" },
      { href: "/prophets",         label: "الأنبياء والرسل",       Icon: Star,      desc: "٢٥ نبياً بقصصهم ومعجزاتهم" },
      { href: "/stories",          label: "القصص الإسلامية",       Icon: BookOpen,  desc: "قصص إسلامية مؤثرة ومعبِّرة" },
      { href: "/islamic-stories",  label: "صحابة وفتوحات",         Icon: Waypoints, desc: "قصص الصحابة والفتوحات" },
    ],
  },
  {
    id: "learn", title: "التعلّم والمكتبة", emoji: "🎓",
    items: [
      { href: "/lessons",          label: "الدروس والمحاضرات",    Icon: GraduationCap, desc: "دروس صوتية ومرئية" },
      { href: "/annual-courses",   label: "الدورات العلمية",      Icon: BookMarked,    desc: "برامج وكورسات منظمة" },
      { href: "/library",          label: "المكتبة الشرعية",      Icon: Library,       desc: "كتب ومخطوطات إسلامية" },
      { href: "/scholars",         label: "أعلام الإسلام",        Icon: BookUser,      desc: "تراجم العلماء والمشايخ" },
      { href: "/quiz",             label: "المسابقة التعليمية",   Icon: Zap,           desc: "اختبر معلوماتك" },
      { href: "/flashcards",       label: "بطاقات المراجعة",      Icon: CreditCard,    desc: "راجع المعلومات بطاقةً بطاقة" },
      { href: "/assistant",        label: "المساعد الذكي",        Icon: Bot,           desc: "استفسر عن أي مسألة" },
      { href: "/learning-path",    label: "خارطة طالب العلم",    Icon: Network,       desc: "منهج التعلم التراكمي" },
      { href: "/my-learning",      label: "لوحتي التعليمية",     Icon: BarChart3,     desc: "إحصائياتك وتقدمك" },
      { href: "/knowledge-graph",  label: "شبكة المعرفة",        Icon: GitBranch,     desc: "العلاقات بين المفاهيم" },
      { href: "/calendar",         label: "التقويم الهجري",      Icon: Calendar,      desc: "التقويم والمناسبات الإسلامية" },
      { href: "/mind-map",         label: "الخرائط الذهنية",      Icon: Map,          desc: "تنظيم المعلومات مرئياً" },
      { href: "/hikam-salaf",      label: "حكم السلف الصالح",     Icon: Star,         desc: "حكم وأقوال مأثورة" },
      { href: "/akhlaq",           label: "الأخلاق الإسلامية",    Icon: Heart,        desc: "فضائل الأخلاق ومحاسنها" },
      { href: "/islamic-glossary", label: "المصطلحات الإسلامية",  Icon: BookOpen,     desc: "معجم المصطلحات الفقهية" },
      { href: "/universities",     label: "دليل الجامعات",        Icon: Building2,    desc: "الجامعات الإسلامية حول العالم" },
    ],
  },
];

/* خريطة: href → id المجموعة */
const HREF_TO_GROUP: Record<string, string> = {};
DRAWER_GROUPS.forEach(g => {
  g.items.forEach(item => { HREF_TO_GROUP[item.href] = g.id; });
});

function getActiveGroup(pathname: string): string {
  if (pathname === "/") return "home";
  for (const [href, gid] of Object.entries(HREF_TO_GROUP)) {
    if (href !== "/" && (pathname === href || pathname.startsWith(href + "/"))) return gid;
  }
  return "home";
}

export function SideNavDrawer({ open, onClose, onLogout }: DrawerProps) {
  const [pathname] = useLocation();
  const { isAdmin, isLoggedIn, user } = useAuth();

  const activeGroup = useMemo(() => getActiveGroup(pathname), [pathname]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set(["home", activeGroup]);
    return initial;
  });

  function toggleGroup(id: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

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
            <img src="/logo.png" alt="" width={36} height={36} loading="lazy" decoding="async" />
            <strong>المجالس العلمية</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="side-nav-close">
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="side-nav-drawer__body">
          {DRAWER_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.id);
            const hasActive = group.items.some(i => isActive(i.href));
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
                    <span className="side-nav-group__emoji" aria-hidden="true">{group.emoji}</span>
                    <span className="side-nav-group__title">{group.title}</span>
                  </span>
                  {isOpen
                    ? <ChevronUp size={15} strokeWidth={2} aria-hidden="true" />
                    : <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />}
                </button>

                {isOpen && (
                  <nav id={`nav-group-${group.id}`} aria-label={group.title} className="side-nav-group__items">
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
              </div>
            );
          })}

          {/* Account group */}
          <div className="side-nav-group side-nav-group--v2">
            <button
              type="button"
              className="side-nav-group__toggle"
              onClick={() => toggleGroup("account")}
              aria-expanded={openGroups.has("account")}
            >
              <span className="side-nav-group__toggle-label">
                <span className="side-nav-group__emoji" aria-hidden="true">👤</span>
                <span className="side-nav-group__title">الحساب</span>
              </span>
              {openGroups.has("account")
                ? <ChevronUp size={15} strokeWidth={2} aria-hidden="true" />
                : <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />}
            </button>
            {openGroups.has("account") && (
              <nav aria-label="الحساب" className="side-nav-group__items">
                {isLoggedIn ? (
                  <>
                    {user?.profile?.full_name || user?.email ? (
                      <div className="side-nav-user-info">
                        <span className="side-nav-user-name">{user.profile?.full_name || user.email}</span>
                      </div>
                    ) : null}
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
