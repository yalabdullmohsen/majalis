"use client";

import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import {
  BarChart2,
  Bell,
  BookMarked,
  BookOpen,
  BookText,
  BookUser,
  Bot,
  Building2,
  CalendarDays,
  Clock,
  Compass,
  CreditCard,
  Gavel,
  GitBranch,
  GraduationCap,
  Globe,
  Heart,
  Home,
  Info,
  Landmark,
  Layers,
  Library,
  Lightbulb,
  ListChecks,
  LogIn,
  Map,
  MessageCircleQuestion,
  Mic2,
  Microscope,
  Moon,
  Network,
  Radio,
  Rss,
  Scale,
  ScrollText,
  Search,
  Settings,
  Shield,
  Star,
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
  {
    id: "education",
    title: "المحتوى التعليمي",
    items: [
      { href: "/",               label: "الرئيسية",          Icon: Home },
      { href: "/lessons",        label: "الدروس",            Icon: GraduationCap },
      { href: "/annual-courses", label: "الدورات العلمية",   Icon: BookMarked },
      { href: "/library",        label: "المكتبة",           Icon: Library },
      { href: "/fawaid",         label: "الفوائد",           Icon: Heart },
      { href: "/hadith",         label: "الأحاديث النبوية",  Icon: ScrollText },
      { href: "/tawhid",         label: "التوحيد",           Icon: Shield },
      { href: "/stories",        label: "القصص الإسلامية",   Icon: BookText },
      { href: "/islamic-stories",label: "صحابة وفتوحات",     Icon: Waypoints },
      { href: "/prophets",       label: "قصص الأنبياء",      Icon: Star },
      { href: "/qa",             label: "الأسئلة التعليمية", Icon: MessageCircleQuestion },
      { href: "/updates",        label: "آخر المستجدات",     Icon: Rss },
    ],
  },
  {
    id: "quran-adhkar",
    title: "القرآن والأذكار",
    items: [
      { href: "/quran",            label: "المصحف الشريف",    Icon: BookOpen },
      { href: "/quran-circles",    label: "حلقات التحفيظ",    Icon: CreditCard },
      { href: "/quran-radio",      label: "إذاعة القرآن",     Icon: Radio },
      { href: "/quran-live",       label: "البث المباشر",     Icon: Tv },
      { href: "/quran/tajweed",    label: "علم التجويد",      Icon: Mic2 },
      { href: "/muezzins",         label: "مكتبة المؤذنين",   Icon: Mic2 },
      { href: "/adhkar",           label: "الأذكار",          Icon: Moon },
      { href: "/tasbih",           label: "التسبيح",          Icon: Compass },
      { href: "/arbaeen-nawawi",   label: "الأربعون النووية", Icon: Layers },
      { href: "/daily-wird",       label: "الورد اليومي",     Icon: Sun },
    ],
  },
  {
    id: "tools",
    title: "الأدوات والتفاعل",
    items: [
      { href: "/prayer-times",         label: "مواقيت الصلاة",      Icon: Clock },
      { href: "/qibla",                label: "القبلة",             Icon: Globe },
      { href: "/calendar",             label: "التقويم",            Icon: Bell },
      { href: "/occasions",            label: "المناسبات",          Icon: CalendarDays },
      { href: "/quiz",                 label: "لعبة سؤال وجواب",   Icon: Zap },
      { href: "/search",               label: "البحث",              Icon: Search },
      { href: "/assistant",            label: "المساعد الذكي",      Icon: Bot },
      { href: "/flashcards",           label: "بطاقات المراجعة",    Icon: ListChecks },
      { href: "/learning-plan",        label: "خطة التعلّم",       Icon: Map },
      { href: "/learning-path",        label: "خارطة طالب العلم",  Icon: Network },
      { href: "/my-learning",          label: "لوحتي التعليمية",   Icon: BarChart2 },
      { href: "/features-in-progress", label: "مميزات قيد التطوير", Icon: Layers },
      { href: "/about",                label: "عن التطبيق",        Icon: Info },
    ],
  },
  {
    id: "fiqh",
    title: "الأحكام والفقه",
    items: [
      { href: "/fiqh",               label: "الفقه الإسلامي",   Icon: BookText },
      { href: "/fatwa",              label: "الفتاوى",          Icon: Scale },
      { href: "/rulings",            label: "الأحكام الشرعية",  Icon: Gavel },
      { href: "/fiqh-council",       label: "المجمع الفقهي",    Icon: Users },
      { href: "/miracles",             label: "الإعجاز العلمي",   Icon: Lightbulb },
      { href: "/prophetic-medicine",  label: "الطب النبوي",      Icon: Heart },
      { href: "/scholarly-research",  label: "الباحث الشرعي",    Icon: Microscope },
      { href: "/academic-research",   label: "الأبحاث العلمية",  Icon: Layers },
      { href: "/seerah",             label: "السيرة النبوية",   Icon: BookUser },
      { href: "/knowledge-graph",    label: "خارطة المعرفة",    Icon: GitBranch },
      { href: "/universities",       label: "دليل الجامعات",    Icon: Building2 },
      { href: "/institutions",       label: "دليل المؤسسات",    Icon: Landmark },
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
              <nav>
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
            <nav>
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
