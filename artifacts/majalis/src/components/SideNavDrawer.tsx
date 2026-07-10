import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
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
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  FileText,
  Gavel,
  GitBranch,
  GraduationCap,
  Globe,
  Heart,
  HelpCircle,
  Home,
  Info,
  Landmark,
  Layers,
  Library,
  Lightbulb,
  LogIn,
  Map,
  Mic,
  Mic2,
  Microscope,
  Moon,
  Network,
  Radio,
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
  Tv,
  Users,
  UserPlus,
  Waypoints,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "./AuthProvider";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  lang?: string;
  onLangToggle?: () => void;
  onLogout?: () => void;
};

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

type NavGroup = {
  id: string;
  title: string;
  items: NavItem[];
};

const DRAWER_GROUPS: NavGroup[] = [
  /* ── الرئيسية ── */
  {
    id: "home",
    title: "الرئيسية",
    items: [
      { href: "/",        label: "الصفحة الرئيسية", Icon: Home },
      { href: "/search",  label: "البحث الشامل",     Icon: Search },
      { href: "/updates", label: "آخر المستجدات",    Icon: Rss },
    ],
  },

  /* ── القرآن الكريم ── */
  {
    id: "quran",
    title: "القرآن الكريم",
    items: [
      { href: "/quran-hub",           label: "مركز القرآن",       Icon: Layers },
      { href: "/quran",               label: "المصحف الشريف",     Icon: BookOpen },
      { href: "/daily-wird",          label: "الورد اليومي",      Icon: Sun },
      { href: "/quran/tajweed",       label: "علم التجويد",       Icon: Mic2 },
      { href: "/ulum-quran",          label: "علوم القرآن",       Icon: GraduationCap },
      { href: "/quran/surah-stories", label: "قصص السور",         Icon: BookText },
      { href: "/duas-quran",          label: "أدعية القرآن",      Icon: BookMarked },
      { href: "/quran-radio",         label: "إذاعة القرآن",      Icon: Radio },
      { href: "/quran-live",          label: "البث المباشر",      Icon: Tv },
      { href: "/quran-circles",       label: "حلقات التحفيظ",     Icon: Users },
      { href: "/muezzins",            label: "مكتبة المؤذنين",    Icon: Mic },
    ],
  },

  /* ── الحديث والسنة ── */
  {
    id: "hadith",
    title: "الحديث والسنة",
    items: [
      { href: "/hadith",             label: "الأحاديث النبوية",   Icon: ScrollText },
      { href: "/arbaeen-nawawi",     label: "الأربعون النووية",   Icon: FileText },
      { href: "/hadith-science",     label: "مصطلح الحديث",       Icon: BookOpen },
      { href: "/wasaya-nabawiyya",   label: "الوصايا النبوية",    Icon: Star },
      { href: "/prophetic-medicine", label: "الطب النبوي",        Icon: Stethoscope },
      { href: "/shamael",            label: "الشمائل المحمدية",   Icon: BookUser },
    ],
  },

  /* ── العقيدة والتوحيد ── */
  {
    id: "aqeeda",
    title: "العقيدة والتوحيد",
    items: [
      { href: "/tawhid",      label: "التوحيد والعقيدة",    Icon: Shield },
      { href: "/arkan",       label: "أركان الإسلام",       Icon: Landmark },
      { href: "/arkan-iman",  label: "أركان الإيمان",       Icon: Star },
      { href: "/asma-husna",  label: "الأسماء الحسنى",      Icon: Sparkles },
      { href: "/janna-naar",  label: "الجنة والنار",        Icon: Sparkles },
      { href: "/alamat-saah", label: "علامات الساعة",       Icon: Clock },
      { href: "/malaika",     label: "الملائكة في الإسلام", Icon: Sparkles },
      { href: "/miracles",    label: "الإعجاز العلمي",      Icon: Lightbulb },
    ],
  },

  /* ── الفقه والأحكام ── */
  {
    id: "fiqh",
    title: "الفقه والأحكام",
    items: [
      { href: "/fiqh",               label: "الفقه الإسلامي",     Icon: BookText },
      { href: "/qa",                 label: "الأسئلة والأجوبة",   Icon: HelpCircle },
      { href: "/fatwa",              label: "الفتاوى",             Icon: Scale },
      { href: "/rulings",            label: "الأحكام الشرعية",    Icon: Gavel },
      { href: "/fiqh-council",       label: "المجمع الفقهي",      Icon: Users },
      { href: "/madhahib",           label: "المذاهب الأربعة",    Icon: Scale },
      { href: "/fiqh-qawaid",        label: "القواعد الفقهية",    Icon: Scale },
      { href: "/tahara",             label: "الطهارة وأحكامها",   Icon: Repeat2 },
      { href: "/salah-guide",        label: "دليل الصلاة الكامل", Icon: BookOpen },
      { href: "/zakat",              label: "الزكاة وأحكامها",    Icon: Calculator },
      { href: "/sawm",               label: "الصيام وأحكامه",     Icon: Moon },
      { href: "/hajj",               label: "الحج والعمرة",       Icon: Landmark },
      { href: "/janaza",             label: "أحكام الجنائز",      Icon: ScrollText },
      { href: "/mawarith",           label: "المواريث والفرائض",  Icon: Scale },
      { href: "/scholarly-research", label: "الباحث الشرعي",     Icon: Microscope },
      { href: "/academic-research",  label: "الأبحاث العلمية",   Icon: FileText },
    ],
  },

  /* ── العبادة والأذكار ── */
  {
    id: "ibadah",
    title: "العبادة والأذكار",
    items: [
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
    ],
  },

  /* ── السيرة والتاريخ ── */
  {
    id: "seerah",
    title: "السيرة والتاريخ",
    items: [
      { href: "/seerah",           label: "السيرة النبوية",        Icon: BookUser },
      { href: "/sahabah",          label: "الصحابة الكرام",        Icon: Users },
      { href: "/prophets",         label: "الأنبياء والرسل",        Icon: Star },
      { href: "/stories",          label: "القصص الإسلامية",       Icon: BookOpen },
      { href: "/islamic-stories",  label: "صحابة وفتوحات",         Icon: Waypoints },
    ],
  },

  /* ── الدروس والمكتبة ── */
  {
    id: "content",
    title: "الدروس والمكتبة",
    items: [
      { href: "/lessons",          label: "الدروس والمحاضرات",   Icon: GraduationCap },
      { href: "/annual-courses",   label: "الدورات العلمية",     Icon: BookMarked },
      { href: "/library",          label: "المكتبة الشرعية",     Icon: Library },
      { href: "/scholars",         label: "أعلام الإسلام",       Icon: BookUser },
      { href: "/fawaid",           label: "الفوائد العلمية",     Icon: Heart },
      { href: "/hikam-salaf",      label: "حكم السلف الصالح",    Icon: Star },
      { href: "/fadail-aamal",     label: "فضائل الأعمال",       Icon: Star },
      { href: "/akhlaq",           label: "الأخلاق الإسلامية",   Icon: Heart },
      { href: "/adab-talab-ilm",   label: "آداب طالب العلم",     Icon: GraduationCap },
      { href: "/islamic-glossary", label: "المصطلحات الإسلامية", Icon: BookOpen },
      { href: "/islam-stats",      label: "الإسلام في أرقام",    Icon: BarChart3 },
    ],
  },

  /* ── التعلّم والأدوات ── */
  {
    id: "tools",
    title: "التعلّم والأدوات",
    items: [
      { href: "/quiz",                 label: "المسابقة التعليمية",  Icon: Zap },
      { href: "/flashcards",           label: "بطاقات المراجعة",     Icon: CreditCard },
      { href: "/assistant",            label: "المساعد الذكي",       Icon: Bot },
      { href: "/mind-map",             label: "الخرائط الذهنية",    Icon: Map },
      { href: "/learning-plan",        label: "خطة التعلّم",         Icon: BarChart2 },
      { href: "/learning-path",        label: "خارطة طالب العلم",   Icon: Network },
      { href: "/my-learning",          label: "لوحتي التعليمية",    Icon: BarChart3 },
      { href: "/knowledge-map",        label: "الخريطة المعرفية",   Icon: Network },
      { href: "/knowledge-graph",      label: "شبكة المعرفة",       Icon: GitBranch },
      { href: "/calendar",             label: "التقويم الهجري",     Icon: Calendar },
      { href: "/universities",         label: "دليل الجامعات",      Icon: Building2 },
      { href: "/features-in-progress", label: "مميزات قيد التطوير", Icon: Layers },
      { href: "/about",                label: "عن التطبيق",         Icon: Info },
    ],
  },
];

export function SideNavDrawer({ open, onClose, lang = "ar", onLangToggle, onLogout }: DrawerProps) {
  const [pathname] = useLocation();
  const { isAdmin, isLoggedIn, user } = useAuth();

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
            <img src="/logo.png" alt="" width={36} height={36} />
            <strong>المجلس العلمي</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="side-nav-close">
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="side-nav-drawer__body">
          {/* Content groups */}
          {DRAWER_GROUPS.map((group) => (
            <div key={group.id} className="side-nav-group side-nav-group--v2">
              <p className="side-nav-group__title">{group.title}</p>
              <nav aria-label={group.title}>
                {group.items.map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`side-nav-link side-nav-link--v2${isActive(href) ? " is-active" : ""}`}
                  >
                    <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          {/* Account group */}
          <div className="side-nav-group side-nav-group--v2">
            <p className="side-nav-group__title">الحساب</p>
            <nav aria-label="الحساب">
              {isLoggedIn ? (
                <>
                  {user?.profile?.full_name || user?.email ? (
                    <div className="side-nav-user-info">
                      <span className="side-nav-user-name">{user.profile?.full_name || user.email}</span>
                    </div>
                  ) : null}
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className={`side-nav-link side-nav-link--v2${isActive("/settings") ? " is-active" : ""}`}
                  >
                    <Settings size={17} strokeWidth={1.8} aria-hidden="true" />
                    <span>الإعدادات</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={onClose}
                      className={`side-nav-link side-nav-link--v2${isActive("/admin") ? " is-active" : ""}`}
                    >
                      <Settings size={17} strokeWidth={1.8} aria-hidden="true" />
                      <span>لوحة التحكم</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    className="side-nav-link side-nav-link--v2 side-nav-link--danger"
                    onClick={() => { onClose(); onLogout?.(); }}
                  >
                    <LogIn size={17} strokeWidth={1.8} aria-hidden="true" />
                    <span>تسجيل الخروج</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={onClose} className="side-nav-link side-nav-link--v2">
                    <LogIn size={17} strokeWidth={1.8} aria-hidden="true" />
                    <span>تسجيل الدخول</span>
                  </Link>
                  <Link href="/register" onClick={onClose} className="side-nav-link side-nav-link--v2">
                    <UserPlus size={17} strokeWidth={1.8} aria-hidden="true" />
                    <span>إنشاء حساب</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Language toggle */}
          {onLangToggle && (
            <div className="side-nav-group side-nav-group--v2">
              <p className="side-nav-group__title">اللغة</p>
              <button
                type="button"
                className="side-nav-link side-nav-link--v2"
                onClick={() => { onLangToggle(); onClose(); }}
              >
                <Globe size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>{lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

export default SideNavDrawer;
