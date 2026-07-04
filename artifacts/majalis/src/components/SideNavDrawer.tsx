"use client";

import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  BookMarked,
  Clock,
  Compass,
  GraduationCap,
  Globe,
  Heart,
  Home,
  Library,
  LogIn,
  MessageCircleQuestion,
  Mic2,
  Moon,
  Radio,
  Scale,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Tv,
  UserPlus,
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
      { href: "/hadith",         label: "الأحاديث الصحيحة", Icon: ScrollText },
      { href: "/stories",         label: "القصص الإسلامية",  Icon: Library },
      { href: "/islamic-stories", label: "🕌 صحابة وفتوحات",  Icon: Sparkles },
      { href: "/prophets",        label: "قصص الأنبياء",     Icon: Sparkles },
      { href: "/qa",             label: "الأسئلة التعليمية", Icon: MessageCircleQuestion },
      { href: "/updates",        label: "آخر المستجدات",    Icon: Sparkles },
    ],
  },
  {
    id: "quran-adhkar",
    title: "القرآن والأذكار",
    items: [
      { href: "/quran",            label: "القرآن الكريم",     Icon: BookOpen },
      { href: "/quran-circles",    label: "حلقات التحفيظ",     Icon: BookMarked },
      { href: "/quran-radio",      label: "إذاعة القرآن",      Icon: Radio },
      { href: "/quran-live",       label: "البث المباشر",       Icon: Tv },
      { href: "/quran/tajweed",    label: "علم التجويد",       Icon: Mic2 },
      { href: "/adhkar",           label: "الأذكار",           Icon: Sparkles },
      { href: "/tasbih",           label: "التسبيح",           Icon: Compass },
      { href: "/arbaeen-nawawi",   label: "الأربعون النووية",  Icon: ScrollText },
      { href: "/daily-wird",       label: "الورد اليومي",      Icon: Sun },
    ],
  },
  {
    id: "tools",
    title: "الأدوات والتفاعل",
    items: [
      { href: "/prayer-times", label: "مواقيت الصلاة",   Icon: Clock },
      { href: "/qibla",        label: "القبلة",          Icon: Compass },
      { href: "/calendar",     label: "التقويم",         Icon: Moon },
      { href: "/occasions",    label: "المناسبات",       Icon: Star },
      { href: "/quiz",          label: "لعبة سؤال وجواب", Icon: Zap },
      { href: "/search",        label: "البحث",           Icon: Search },
      { href: "/assistant",     label: "المساعد الذكي",   Icon: Sparkles },
      { href: "/flashcards",    label: "بطاقات المراجعة", Icon: BookOpen },
      { href: "/learning-plan", label: "خطة التعلّم",    Icon: GraduationCap },
      { href: "/learning-path", label: "خارطة طالب العلم", Icon: Globe },
      { href: "/my-learning",   label: "لوحتي التعليمية", Icon: Heart },
    ],
  },
  {
    id: "fiqh",
    title: "الأحكام والفقه",
    items: [
      { href: "/fatwa",            label: "الفتاوى",          Icon: Scale },
      { href: "/rulings",          label: "الأحكام الشرعية",  Icon: Scale },
      { href: "/fiqh-council",     label: "المجمع الفقهي",    Icon: BookMarked },
      { href: "/miracles",         label: "الإعجاز العلمي",   Icon: Globe },
      { href: "/scholarly-research", label: "الباحث الشرعي", Icon: Search },
      { href: "/seerah",             label: "السيرة النبوية",  Icon: Star },
      { href: "/knowledge-graph",    label: "خارطة المعرفة",  Icon: Globe },
      { href: "/universities",       label: "دليل الجامعات",  Icon: GraduationCap },
      { href: "/institutions",       label: "دليل المؤسسات",  Icon: BookMarked },
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
