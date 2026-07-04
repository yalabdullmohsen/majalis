import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";

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
  | "fatwa"
  | "rulings"
  | "annual-courses"
  | "updates"
  | "knowledge-engine"
  | "scholarly-verification"
  | "verified-knowledge"
  | "knowledge-reasoning"
  | "search-analytics"
  | "digital-learning"
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
  | "islamic-stories";

type NavItem = { key: AdminSection; label: string; icon: string };

const NAV_GROUPS: Array<{ title?: string; items: NavItem[] }> = [
  {
    items: [
      { key: "dashboard", label: "لوحة التحكم", icon: "◉" },
    ],
  },
  {
    title: "المحتوى",
    items: [
      { key: "lessons",  label: "الدروس",          icon: "▶" },
      { key: "sheikhs",  label: "المشايخ",          icon: "👤" },
      { key: "library",  label: "المكتبة",          icon: "📚" },
      { key: "fawaid",   label: "الفوائد",          icon: "💡" },
      { key: "adhkar",   label: "الأذكار",          icon: "◎" },
      { key: "miracles", label: "الإعجاز العلمي",  icon: "✨" },
      { key: "qa",       label: "الأسئلة والأجوبة", icon: "❓" },
      { key: "quiz",     label: "المسابقة",         icon: "🎯" },
    ],
  },
  {
    title: "الشريعة",
    items: [
      { key: "fiqh-council",   label: "المجمع الفقهي",   icon: "⚖" },
      { key: "fatwa",          label: "الفتاوى",           icon: "📜" },
      { key: "rulings",        label: "الأحكام الشرعية",  icon: "🏛" },
      { key: "annual-courses", label: "الدورات العلمية",  icon: "🎓" },
    ],
  },
  {
    title: "المجتمع",
    items: [
      { key: "users",       label: "المستخدمون",    icon: "👥" },
      { key: "submissions", label: "مقترحات",       icon: "📩" },
      { key: "reports",     label: "التقارير",      icon: "📊" },
    ],
  },
  {
    title: "الاستيراد والأتمتة",
    items: [
      { key: "smart-cms",        label: "CMS الذكي",        icon: "🤖" },
      { key: "aggregator",       label: "محرك التجميع",     icon: "⚙" },
      { key: "knowledge-engine", label: "Auto Knowledge",    icon: "🧠" },
      { key: "telegram",         label: "Telegram",          icon: "📢" },
      { key: "prophet-stories",  label: "قصص الأنبياء",     icon: "📖" },
      { key: "islamic-stories",  label: "القصص الإسلامية",  icon: "🕌" },
      { key: "updates",          label: "المستجدات",        icon: "📡" },
      { key: "universities",     label: "دليل الجامعات",    icon: "🏫" },
    ],
  },
  {
    title: "التحليل",
    items: [
      { key: "search-analytics",       label: "تحليل البحث",    icon: "🔍" },
      { key: "verified-knowledge",     label: "المعرفة الموثقة", icon: "✅" },
      { key: "scholarly-verification", label: "التوثيق العلمي",  icon: "🔏" },
      { key: "knowledge-reasoning",    label: "محرك الاستدلال",  icon: "💭" },
      { key: "digital-learning",       label: "التعليم الرقمي",  icon: "📱" },
    ],
  },
  {
    title: "النظام المتقدم",
    items: [
      { key: "autonomous-ai",        label: "المنظومة الذاتية",   icon: "🔬" },
      { key: "global-reference",     label: "المرجع العالمي",     icon: "🌍" },
      { key: "islamic-intelligence", label: "الاستخبارات العلمية", icon: "🧬" },
      { key: "open-platform",        label: "Open Platform",       icon: "🔓" },
      { key: "governance",           label: "الحوكمة المؤسسية",   icon: "🏛" },
      { key: "knowledge-graph",      label: "الرسم البياني",      icon: "🕸" },
      { key: "settings",             label: "الإعدادات",          icon: "⚙" },
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
            <span className="admin-sidebar-logo__icon">🕌</span>
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
                      {item.icon}
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
          <FlashBanner flash={flash} onClose={clearFlash} />
          {children}
        </main>
      </div>
    </AdminShellContext.Provider>
  );
}
