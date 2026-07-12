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
    id: "start",
    title: "البداية",
    items: [
      { href: "/",        label: "الرئيسية",       Icon: Home },
      { href: "/masarat", label: "مسارات التعلم",  Icon: Compass },
      { href: "/search",  label: "البحث",          Icon: Search },
    ],
  },
  {
    id: "iman",
    title: "الإيمان والعقيدة",
    items: [
      { href: "/iman-topics",  label: "الإيمان والغيب",   Icon: Sparkles },
      { href: "/miracles",     label: "الإعجاز العلمي",   Icon: Globe },
    ],
  },
  {
    id: "quran-section",
    title: "القرآن الكريم",
    items: [
      { href: "/quran",         label: "المصحف الشريف",    Icon: BookOpen },
      { href: "/quran-studies", label: "الدراسات القرآنية", Icon: Sparkles },
      { href: "/quran-radio",   label: "إذاعة القرآن",     Icon: Radio },
      { href: "/quran-live",    label: "البث المباشر",      Icon: Tv },
      { href: "/quran/tajweed", label: "علم التجويد",      Icon: Mic2 },
      { href: "/adhkar",        label: "الأذكار",          Icon: Sparkles },
      { href: "/tasbih",        label: "التسبيح",          Icon: Compass },
      { href: "/daily-wird",    label: "الورد اليومي",     Icon: Sun },
    ],
  },
  {
    id: "sunnah-section",
    title: "السنة النبوية",
    items: [
      { href: "/sunnah-studies",  label: "دراسات السنة",       Icon: ScrollText },
      { href: "/hadith",          label: "الأحاديث الصحيحة",   Icon: ScrollText },
      { href: "/arbaeen-nawawi",  label: "الأربعون النووية",   Icon: BookMarked },
      { href: "/sujood-sahw",     label: "سجود السهو",         Icon: BookOpen },
    ],
  },
  {
    id: "fiqh-section",
    title: "الفقه والأحكام",
    items: [
      { href: "/fatwa",              label: "الفتاوى",         Icon: Scale },
      { href: "/rulings",            label: "الأحكام الشرعية", Icon: Scale },
      { href: "/fiqh-council",       label: "المجمع الفقهي",   Icon: BookMarked },
      { href: "/scholarly-research", label: "الباحث الشرعي",  Icon: Search },
    ],
  },
  {
    id: "tazkiya-section",
    title: "تزكية النفس",
    items: [
      { href: "/tazkiya-topics",   label: "الأخلاق والأمراض",          Icon: Heart },
      { href: "/amrad-qalbiyya",   label: "أمراض القلوب",              Icon: Heart },
      { href: "/durus-imaniyya",   label: "الدروس الإيمانية",          Icon: BookOpen },
      { href: "/durus-mutanawwia", label: "دروس متنوعة",               Icon: Sparkles },
      { href: "/mawsuaat",         label: "الموسوعة العملية",          Icon: BookMarked },
    ],
  },
  {
    id: "tarikh-section",
    title: "السيرة والتاريخ",
    items: [
      { href: "/tarikh-islami", label: "التاريخ الإسلامي", Icon: Globe },
      { href: "/seerah",        label: "السيرة النبوية",   Icon: Star },
      { href: "/prophets",      label: "قصص الأنبياء",    Icon: Sparkles },
      { href: "/stories",       label: "القصص الإسلامية", Icon: Library },
    ],
  },
  {
    id: "usra-section",
    title: "الأسرة والمجتمع",
    items: [
      { href: "/usra-mujtama", label: "الأسرة والمجتمع", Icon: Heart },
    ],
  },
  {
    id: "fikr-section",
    title: "الفكر والواقع",
    items: [
      { href: "/fikr-waqia", label: "الفكر والواقع",   Icon: Globe },
      { href: "/assistant",  label: "المساعد الذكي",  Icon: Sparkles },
      { href: "/updates",    label: "آخر المستجدات",  Icon: Sparkles },
    ],
  },
  {
    id: "education-section",
    title: "التعليم والمكتبة",
    items: [
      { href: "/lessons",        label: "الدروس",            Icon: GraduationCap },
      { href: "/annual-courses", label: "الدورات العلمية",   Icon: BookMarked },
      { href: "/library",        label: "المكتبة",           Icon: Library },
      { href: "/fawaid",         label: "الفوائد",           Icon: Heart },
      { href: "/qa",             label: "الأسئلة التعليمية", Icon: MessageCircleQuestion },
      { href: "/flashcards",     label: "بطاقات المراجعة",   Icon: BookOpen },
      { href: "/learning-plan",  label: "خطة التعلّم",       Icon: GraduationCap },
      { href: "/learning-path",  label: "خارطة طالب العلم",  Icon: Globe },
      { href: "/my-learning",    label: "لوحتي التعليمية",   Icon: Heart },
      { href: "/knowledge-graph",label: "خارطة المعرفة",     Icon: Globe },
      { href: "/universities",   label: "دليل الجامعات",     Icon: GraduationCap },
      { href: "/institutions",   label: "دليل المؤسسات",     Icon: BookMarked },
    ],
  },
  {
    id: "tools-section",
    title: "الأدوات",
    items: [
      { href: "/prayer-times", label: "مواقيت الصلاة",   Icon: Clock },
      { href: "/qibla",        label: "القبلة",           Icon: Compass },
      { href: "/calendar",     label: "التقويم",          Icon: Moon },
      { href: "/occasions",    label: "المناسبات",        Icon: Star },
      { href: "/quiz",         label: "لعبة سؤال وجواب", Icon: Zap },
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
