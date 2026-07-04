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

export const ADMIN_NAV: { key: AdminSection; label: string }[] = [
  { key: "dashboard",               label: "لوحة التحكم" },
  { key: "prophet-stories",         label: "📖 قصص الأنبياء — مراجعة" },
  { key: "islamic-stories",         label: "🕌 القصص الإسلامية — مراجعة" },
  { key: "telegram",                label: "📢 Telegram" },
  { key: "universities",            label: "دليل الجامعات" },
  { key: "submissions",             label: "مقترحات المحتوى" },
  { key: "smart-cms",               label: "CMS الذكي" },
  { key: "aggregator",              label: "محرك التجميع" },
  { key: "knowledge-engine",        label: "Auto Knowledge Engine" },
  { key: "scholarly-verification",  label: "التوثيق العلمي" },
  { key: "verified-knowledge",      label: "المعرفة الموثقة" },
  { key: "knowledge-reasoning",     label: "محرك الاستدلال" },
  { key: "search-analytics",        label: "تحليل البحث" },
  { key: "digital-learning",        label: "التعليم الرقمي" },
  { key: "autonomous-ai",           label: "المنظومة الذاتية" },
  { key: "global-reference",        label: "المرجع العالمي" },
  { key: "islamic-intelligence",    label: "الاستخبارات العلمية" },
  { key: "open-platform",           label: "Open Platform" },
  { key: "governance",              label: "الحوكمة المؤسسية" },
  { key: "knowledge-graph",         label: "الرسم البياني المعرفي" },
  { key: "quiz",                    label: "أسئلة المسابقة" },
  { key: "lessons",                 label: "الدروس" },
  { key: "sheikhs",                 label: "المشايخ" },
  { key: "library",                 label: "المكتبة" },
  { key: "miracles",                label: "الإعجاز العلمي" },
  { key: "fawaid",                  label: "الفوائد" },
  { key: "adhkar",                  label: "الأذكار" },
  { key: "qa",                      label: "الأسئلة" },
  { key: "users",                   label: "المستخدمون" },
  { key: "reports",                 label: "التقارير" },
  { key: "fiqh-council",            label: "المجمع الفقهي" },
  { key: "fatwa",                   label: "الفتاوى" },
  { key: "rulings",                 label: "الأحكام الشرعية" },
  { key: "annual-courses",          label: "الدورات العلمية" },
  { key: "updates",                 label: "المستجدات" },
  { key: "settings",                label: "الإعدادات" },
];

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
  return (
    <div role="alert" className={`admin-flash admin-flash--${flash.type}`}>
      <span>{flash.message}</span>
      <button type="button" onClick={onClose} aria-label="إغلاق" className="admin-flash__close">
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
  const { logout, user } = useAuth();
  const [, navigate] = useLocation();
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearFlash = useCallback(() => setFlash(null), []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AdminShellContext.Provider value={{ flash, showSuccess, showError, clearFlash }}>
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="قائمة الإدارة">
          <p className="admin-sidebar__title">لوحة تحكم المجلس العلمي</p>
          {user?.profile?.full_name && (
            <p className="admin-sidebar__user">{user.profile.full_name}</p>
          )}
          <Link href="/admin/auto-content" className="admin-sidebar__quick-link admin-sidebar__quick-link--brass">
            الاستيراد التلقائي
          </Link>
          <Link href="/admin/autonomous-platform" className="admin-sidebar__quick-link admin-sidebar__quick-link--emerald">
            ⚙ المنصة الذاتية AKP
          </Link>
          <Link href="/" className="admin-sidebar__quick-link admin-sidebar__quick-link--brass">
            ← العودة للموقع
          </Link>
          <button type="button" onClick={handleLogout} className="admin-logout-btn">
            تسجيل الخروج
          </button>
          <nav aria-label="أقسام الإدارة" style={{ marginTop: "0.75rem" }}>
            {ADMIN_NAV.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => onSectionChange(n.key)}
                aria-current={section === n.key ? "page" : undefined}
                className={`admin-nav-item${section === n.key ? " is-active" : ""}`}
              >
                {n.label}
              </button>
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
