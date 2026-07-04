import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { C } from "@/lib/theme";

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
  | "prophet-stories";

type NavItem = { key: AdminSection; label: string; icon?: string };
type NavGroup = { group: string; items: NavItem[] };

/** التنقّل مُجمّع منطقياً: عام، محتوى ديني، مراجعة، معرفة، أتمتة، إدارة. */
export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    group: "عام",
    items: [
      { key: "dashboard", label: "لوحة التحكم", icon: "🏠" },
      { key: "reports", label: "التقارير", icon: "📊" },
      { key: "search-analytics", label: "تحليل البحث", icon: "🔍" },
    ],
  },
  {
    group: "المحتوى الديني",
    items: [
      { key: "lessons", label: "الدروس", icon: "📚" },
      { key: "sheikhs", label: "المشايخ", icon: "👤" },
      { key: "library", label: "المكتبة", icon: "📖" },
      { key: "rulings", label: "الأحكام الشرعية", icon: "⚖️" },
      { key: "fatwa", label: "الفتاوى", icon: "📜" },
      { key: "qa", label: "الأسئلة", icon: "❓" },
      { key: "quiz", label: "أسئلة المسابقة", icon: "🎯" },
      { key: "fawaid", label: "الفوائد", icon: "💡" },
      { key: "adhkar", label: "الأذكار", icon: "🤲" },
      { key: "miracles", label: "الإعجاز العلمي", icon: "🔬" },
      { key: "annual-courses", label: "الدورات العلمية", icon: "🎓" },
      { key: "updates", label: "المستجدات", icon: "📰" },
    ],
  },
  {
    group: "المراجعة والتوثيق",
    items: [
      { key: "submissions", label: "مقترحات المحتوى", icon: "📥" },
      { key: "prophet-stories", label: "قصص الأنبياء", icon: "📖" },
      { key: "fiqh-council", label: "المجمع الفقهي", icon: "🏛️" },
      { key: "scholarly-verification", label: "التوثيق العلمي", icon: "✅" },
      { key: "verified-knowledge", label: "المعرفة الموثقة", icon: "🛡️" },
    ],
  },
  {
    group: "المعرفة والذكاء",
    items: [
      { key: "knowledge-engine", label: "محرّك المعرفة", icon: "⚙️" },
      { key: "knowledge-reasoning", label: "محرّك الاستدلال", icon: "🧠" },
      { key: "islamic-intelligence", label: "الاستخبارات العلمية", icon: "🛰️" },
      { key: "global-reference", label: "المرجع العالمي", icon: "🌍" },
      { key: "knowledge-graph", label: "الرسم البياني المعرفي", icon: "🕸️" },
      { key: "digital-learning", label: "التعليم الرقمي", icon: "💻" },
      { key: "autonomous-ai", label: "المنظومة الذاتية", icon: "🤖" },
    ],
  },
  {
    group: "الأتمتة والتكامل",
    items: [
      { key: "telegram", label: "Telegram", icon: "📢" },
      { key: "aggregator", label: "محرك التجميع", icon: "🔗" },
      { key: "smart-cms", label: "CMS الذكي", icon: "🗂️" },
      { key: "open-platform", label: "Open Platform", icon: "🔓" },
    ],
  },
  {
    group: "الإدارة",
    items: [
      { key: "users", label: "المستخدمون", icon: "👥" },
      { key: "governance", label: "الحوكمة المؤسسية", icon: "🏢" },
      { key: "universities", label: "دليل الجامعات", icon: "🏫" },
      { key: "settings", label: "الإعدادات", icon: "⚙️" },
    ],
  },
];

/** قائمة مسطّحة (للتوافق ولإيجاد عنوان القسم الحالي). */
export const ADMIN_NAV: NavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

type Flash = { type: "success" | "error"; message: string } | null;

type AdminShellContextValue = {
  flash: Flash;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  clearFlash: () => void;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error("useAdminShell must be used within AdminShell");
  return ctx;
}

function FlashBanner({ flash, onClose }: { flash: Flash; onClose: () => void }) {
  if (!flash) return null;
  const isError = flash.type === "error";
  return (
    <div
      role="alert"
      style={{
        marginBottom: "1rem",
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        border: `1px solid ${isError ? "#dc2626" : C.emerald}`,
        background: isError ? "#FEE2E2" : "#E8F5E9",
        color: isError ? "#991B1B" : C.emeraldDeep,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        fontSize: "0.875rem",
      }}
    >
      <span>{flash.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="إغلاق"
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, color: "inherit" }}
      >
        ×
      </button>
    </div>
  );
}

type AdminShellProps = {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  children: ReactNode;
};

export function AdminShell({ section, onSectionChange, children }: AdminShellProps) {
  const [flash, setFlash] = useState<Flash>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { logout, user } = useAuth();
  const [, navigate] = useLocation();
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); }, []);

  // إغلاق الدرج عند تغيير القسم + منع تمرير الخلفية أثناء فتحه
  useEffect(() => { setDrawerOpen(false); }, [section]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

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

  const clearFlash = useCallback(() => setFlash(null), []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const activeLabel = ADMIN_NAV.find((n) => n.key === section)?.label ?? "لوحة التحكم";

  return (
    <AdminShellContext.Provider value={{ flash, showSuccess, showError, clearFlash }}>
      {/* شريط علوي بالجوال */}
      <div className="admin-topbar">
        <button
          type="button"
          className="admin-hamburger"
          aria-label="فتح القائمة"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          ☰
        </button>
        <p className="admin-topbar__title">{activeLabel}</p>
      </div>

      <div className="admin-shell">
        {/* غطاء خلفي للدرج */}
        <div
          className={`admin-backdrop${drawerOpen ? " is-open" : ""}`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />

        <aside className={`admin-sidebar${drawerOpen ? " is-open" : ""}`}>
          <p className="admin-sidebar__brand">لوحة تحكم المجلس العلمي</p>
          {user?.profile?.full_name && (
            <p className="admin-sidebar__user">{user.profile.full_name}</p>
          )}

          <div className="admin-sidebar__quicklinks">
            <Link href="/admin/auto-content" className="admin-quicklink">الاستيراد التلقائي</Link>
            <Link href="/admin/autonomous-platform" className="admin-quicklink admin-quicklink--accent">⚙ المنصة الذاتية AKP</Link>
            <Link href="/" className="admin-quicklink">← العودة للموقع</Link>
          </div>
          <button type="button" onClick={handleLogout} className="admin-logout-btn">
            تسجيل الخروج
          </button>

          <nav className="admin-nav" aria-label="أقسام لوحة التحكم">
            {ADMIN_NAV_GROUPS.map((grp) => (
              <div key={grp.group} className="admin-nav__group">
                <p className="admin-nav__group-label">{grp.group}</p>
                {grp.items.map((n) => (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => onSectionChange(n.key)}
                    className={`admin-nav__item${section === n.key ? " is-active" : ""}`}
                    aria-current={section === n.key ? "page" : undefined}
                  >
                    {n.icon && <span className="admin-nav__item-icon" aria-hidden="true">{n.icon}</span>}
                    <span className="admin-nav__item-label">{n.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="admin-main">
          <FlashBanner flash={flash} onClose={clearFlash} />
          {children}
        </main>
      </div>
    </AdminShellContext.Provider>
  );
}
