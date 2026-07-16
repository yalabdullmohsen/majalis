import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import {
  BookOpen, Bot, Brain, Building2, CalendarClock, CheckCircle2, Dna, FolderTree,
  FlaskConical, Flag, GraduationCap, Globe, HelpCircle, Image, Landmark,
  LayoutDashboard, Library, Lightbulb, MessageCircle, MessageSquare,
  Network, PlayCircle, Radio, RefreshCw, Route, Scale, School, Search,
  Send, Settings, Settings2, ShieldCheck, Sparkles,
  Target, Unlock, User, Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminSection =
  | "dashboard"
  | "aggregator"
  | "lessons"
  | "sheikhs"
  | "library"
  | "miracles"
  | "adhkar"
  | "fawaid"
  | "qa"
  | "users"
  | "settings"
  | "reports"
  | "fiqh-council"
  | "rulings"
  | "annual-courses"
  | "updates"
  | "knowledge-engine"
  | "scholarly-verification"
  | "verified-knowledge"
  | "knowledge-reasoning"
  | "search-analytics"
  | "autonomous-ai"
  | "global-reference"
  | "islamic-intelligence"
  | "open-platform"
  | "governance"
  | "smart-cms"
  | "submissions"
  | "quiz"
  | "knowledge-graph"
  | "universities"
  | "telegram"
  | "prophet-stories"
  | "islamic-stories"
  | "image-import"
  | "learning-paths"
  | "categories"
  | "week-day-facts"
;

type NavItem = { key: AdminSection; label: string; Icon: LucideIcon };

const NAV_GROUPS: Array<{ title?: string; items: NavItem[] }> = [
  {
    items: [
      { key: "dashboard", label: "لوحة التحكم", Icon: LayoutDashboard },
    ],
  },
  {
    title: "المحتوى",
    items: [
      { key: "categories", label: "أبواب العلم (تصنيفات)", Icon: FolderTree },
      { key: "lessons",  label: "الدروس",          Icon: PlayCircle },
      { key: "sheikhs",  label: "المشايخ",          Icon: User },
      { key: "library",  label: "المكتبة",          Icon: Library },
      { key: "fawaid",   label: "الفوائد",          Icon: Lightbulb },
      { key: "adhkar",   label: "الأذكار",          Icon: RefreshCw },
      { key: "miracles", label: "الإعجاز العلمي",  Icon: Sparkles },
      { key: "qa",       label: "الأسئلة والأجوبة", Icon: HelpCircle },
      { key: "quiz",     label: "المسابقة",         Icon: Target },
    ],
  },
  {
    title: "الشريعة",
    items: [
      { key: "fiqh-council",   label: "المجمع الفقهي",   Icon: Scale },
      { key: "rulings",        label: "الأحكام الشرعية",  Icon: Landmark },
      { key: "annual-courses", label: "الدورات العلمية",  Icon: GraduationCap },
      { key: "learning-paths", label: "المسارات العلمية", Icon: Route },
      { key: "week-day-facts", label: "أيام الأسبوع",     Icon: CalendarClock },
    ],
  },
  {
    title: "المجتمع",
    items: [
      { key: "users",       label: "المستخدمون",    Icon: Users },
      { key: "submissions", label: "مقترحات",       Icon: MessageSquare },
      { key: "reports",     label: "التقارير",      Icon: Flag },
    ],
  },
  {
    title: "الاستيراد والأتمتة",
    items: [
      { key: "image-import",     label: "استخلاص من صور",   Icon: Image },
      { key: "smart-cms",        label: "CMS الذكي",        Icon: Bot },
      { key: "aggregator",       label: "محرك التجميع",     Icon: Settings2 },
      { key: "knowledge-engine", label: "Auto Knowledge",    Icon: Brain },
      { key: "telegram",         label: "Telegram",          Icon: Send },
      { key: "prophet-stories",  label: "قصص الأنبياء",     Icon: BookOpen },
      { key: "islamic-stories",  label: "القصص الإسلامية",  Icon: Building2 },
      { key: "updates",          label: "المستجدات",        Icon: Radio },
      { key: "universities",     label: "دليل الجامعات",    Icon: School },
    ],
  },
  {
    title: "التحليل",
    items: [
      { key: "search-analytics",       label: "تحليل البحث",    Icon: Search },
      { key: "verified-knowledge",     label: "المعرفة الموثقة", Icon: CheckCircle2 },
      { key: "scholarly-verification", label: "التوثيق العلمي",  Icon: ShieldCheck },
      { key: "knowledge-reasoning",    label: "محرك الاستدلال",  Icon: MessageCircle },
    ],
  },
  {
    title: "النظام المتقدم",
    items: [
      { key: "autonomous-ai",        label: "المنظومة الذاتية",   Icon: FlaskConical },
      { key: "global-reference",     label: "المرجع العالمي",     Icon: Globe },
      { key: "islamic-intelligence", label: "الاستخبارات العلمية", Icon: Dna },
      { key: "open-platform",        label: "Open Platform",       Icon: Unlock },
      { key: "governance",           label: "الحوكمة المؤسسية",   Icon: Landmark },
      { key: "knowledge-graph",      label: "الرسم البياني",      Icon: Network },
      { key: "settings",             label: "الإعدادات",          Icon: Settings },
    ],
  },
];

type Flash = { type: "success" | "error"; message: string } | null;

type AdminShellContextValue = {
  flash: Flash;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  clearFlash: () => void;
  onSectionChange: (section: AdminSection) => void;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error("useAdminShell must be used within AdminShell");
  return ctx;
}

function FlashBanner({ flash, onClose }: { flash: Flash; onClose: () => void }) {
  if (!flash) return null;
  return (
    <div role="alert" className={`admin-flash admin-flash--${flash.type}`}>
      <span>{flash.message}</span>
      <button type="button" onClick={onClose} aria-label="إغلاق" className="admin-flash__close">
        ×
      </button>
    </div>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return "م";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0])
    : parts[0].slice(0, 2);
}

type AdminShellProps = {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  children: ReactNode;
};

export function AdminShell({ section, onSectionChange, children }: AdminShellProps) {
  const [flash, setFlash]           = useState<Flash>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user }            = useAuth();
  const [, navigate]                = useLocation();
  const flashTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); }, []);

  const showSuccess = useCallback((message: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlash({ type: "success", message });
    flashTimerRef.current = setTimeout(() => setFlash(null), 5000);
  }, []);

  const showError = useCallback((message: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlash({ type: "error", message });
    flashTimerRef.current = setTimeout(() => setFlash(null), 7000);
  }, []);

  const clearFlash  = useCallback(() => setFlash(null), []);
  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNavClick = (key: AdminSection) => {
    onSectionChange(key);
    closeMobile();
  };

  const fullName = user?.profile?.full_name;
  const initials = getInitials(fullName);

  const currentLabel =
    NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === section)?.label ?? "لوحة التحكم";

  return (
    <AdminShellContext.Provider value={{ flash, showSuccess, showError, clearFlash, onSectionChange }}>
      {/* شريط علوي للجوال */}
      <div className="admin-topbar">
        <button
          type="button"
          className="admin-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="فتح القائمة"
          aria-expanded={mobileOpen}
        >
          ☰
        </button>
        <p className="admin-topbar__title">{currentLabel}</p>
        <Link href="/" className="admin-topbar__back" aria-label="العودة للموقع">
          ← الموقع
        </Link>
      </div>

      <div className="admin-shell">
        {/* غطاء الجوال */}
        <div
          className={`admin-backdrop${mobileOpen ? " is-open" : ""}`}
          onClick={closeMobile}
          aria-hidden="true"
        />

        {/* ── الشريط الجانبي ── */}
        <aside
          className={`admin-sidebar${mobileOpen ? " is-open" : ""}`}
          aria-label="قائمة الإدارة"
        >
          {/* شعار المنصة */}
          <div className="admin-sidebar-logo">
            <span className="admin-sidebar-logo__icon"><Building2 size={22} strokeWidth={1.5} aria-hidden="true" /></span>
            <p className="admin-sidebar-logo__title">المجلس العلمي</p>
            <p className="admin-sidebar-logo__subtitle">Admin Dashboard</p>
          </div>

          {/* معلومات المستخدم */}
          {fullName && (
            <div className="admin-sidebar-user">
              <div className="admin-sidebar-user__avatar">{initials}</div>
              <div className="admin-sidebar-user__info">
                <p className="admin-sidebar-user__name">{fullName}</p>
                <p className="admin-sidebar-user__role">مدير النظام</p>
              </div>
            </div>
          )}

          {/* روابط سريعة */}
          <div className="admin-sidebar__quicklinks">
            <Link href="/admin/auto-content" className="admin-quicklink">
              ⬆ الاستيراد التلقائي
            </Link>
            <Link href="/admin/autonomous-platform" className="admin-quicklink admin-quicklink--accent">
              ⚙ المنصة الذاتية AKP
            </Link>
            <Link href="/" className="admin-quicklink">
              ← العودة للموقع
            </Link>
            <button type="button" onClick={handleLogout} className="admin-logout-btn">
              تسجيل الخروج
            </button>
          </div>

          {/* التنقل المُجمَّع */}
          <nav aria-label="أقسام الإدارة" className="admin-nav">
            {NAV_GROUPS.map((group, gi) => (
              <div key={gi} className="admin-nav__group">
                {group.title && (
                  <p className="admin-nav__group-label" aria-hidden="true">
                    {group.title}
                  </p>
                )}
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavClick(item.key)}
                    aria-current={section === item.key ? "page" : undefined}
                    className={`admin-nav__item${section === item.key ? " is-active" : ""}`}
                  >
                    <span className="admin-nav__item-icon" aria-hidden="true">
                      {(() => { const I = item.Icon; return <I size={14} strokeWidth={1.8} />; })()}
                    </span>
                    <span className="admin-nav__item-label">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ── المحتوى الرئيسي ── */}
        <main className="admin-main">
          <div className="admin-main-header">
            <Link href="/" className="admin-back-btn" aria-label="العودة للموقع الرئيسي">
              ← العودة للموقع
            </Link>
            <span className="admin-main-header__title">{currentLabel}</span>
          </div>
          <FlashBanner flash={flash} onClose={clearFlash} />
          {children}
        </main>
      </div>
    </AdminShellContext.Provider>
  );
}
