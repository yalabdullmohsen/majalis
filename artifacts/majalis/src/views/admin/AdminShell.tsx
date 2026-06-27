import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
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
  | "condolences"
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
  | "smart-cms";

export const ADMIN_NAV: { key: AdminSection; label: string }[] = [
  { key: "dashboard", label: "لوحة التحكم" },
  { key: "smart-cms", label: "CMS الذكي" },
  { key: "aggregator", label: "محرك التجميع" },
  { key: "knowledge-engine", label: "Auto Knowledge Engine" },
  { key: "scholarly-verification", label: "التوثيق العلمي" },
  { key: "verified-knowledge", label: "المعرفة الموثقة" },
  { key: "knowledge-reasoning", label: "محرك الاستدلال" },
  { key: "search-analytics", label: "تحليل البحث" },
  { key: "digital-learning", label: "التعليم الرقمي" },
  { key: "autonomous-ai", label: "المنظومة الذاتية" },
  { key: "global-reference", label: "المرجع العالمي" },
  { key: "islamic-intelligence", label: "الاستخبارات العلمية" },
  { key: "open-platform", label: "Open Platform" },
  { key: "governance", label: "الحوكمة المؤسسية" },
  { key: "lessons", label: "الدروس" },
  { key: "sheikhs", label: "المشايخ" },
  { key: "library", label: "المكتبة" },
  { key: "miracles", label: "الإعجاز العلمي" },
  { key: "fawaid", label: "الفوائد" },
  { key: "adhkar", label: "الأذكار" },
  { key: "qa", label: "الأسئلة" },
  { key: "condolences", label: "قوالب التعزية" },
  { key: "users", label: "المستخدمون" },
  { key: "reports", label: "التقارير" },
  { key: "fiqh-council", label: "المجمع الفقهي" },
  { key: "fatwa", label: "الفتاوى" },
  { key: "rulings", label: "الأحكام الشرعية" },
  { key: "annual-courses", label: "الدورات العلمية" },
  { key: "updates", label: "المستجدات" },
  { key: "settings", label: "الإعدادات" },
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
  const { logout, user } = useAuth();
  const [, navigate] = useLocation();

  const showSuccess = useCallback((message: string) => {
    setFlash({ type: "success", message });
    window.setTimeout(() => setFlash(null), 5000);
  }, []);

  const showError = useCallback((message: string) => {
    setFlash({ type: "error", message });
    window.setTimeout(() => setFlash(null), 7000);
  }, []);

  const clearFlash = useCallback(() => setFlash(null), []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AdminShellContext.Provider value={{ flash, showSuccess, showError, clearFlash }}>
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)", background: C.parchment }}>
        <aside
          style={{
            width: "220px",
            flexShrink: 0,
            borderLeft: `1px solid ${C.line}`,
            background: C.parchmentDeep,
            padding: "1.5rem 0",
          }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: C.inkSoft,
              padding: "0 1rem",
              marginBottom: "0.75rem",
              letterSpacing: "0.06em",
            }}
          >
            لوحة تحكم المجلس العلمي
          </p>
          {user?.profile?.full_name && (
            <p style={{ fontSize: "0.75rem", color: C.inkSoft, padding: "0 1rem", marginBottom: "0.5rem" }}>
              {user.profile.full_name}
            </p>
          )}
          <Link
            href="/admin/auto-content"
            style={{
              display: "block",
              padding: "0.5rem 1rem",
              marginBottom: "0.35rem",
              textDecoration: "none",
              fontSize: "0.75rem",
              color: C.brassDeep,
            }}
          >
            الاستيراد التلقائي
          </Link>
          <Link
            href="/"
            style={{
              display: "block",
              padding: "0.5rem 1rem",
              marginBottom: "0.35rem",
              textDecoration: "none",
              fontSize: "0.75rem",
              color: C.brassDeep,
            }}
          >
            ← العودة للموقع
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="admin-logout-btn"
          >
            تسجيل الخروج
          </button>
          <nav style={{ marginTop: "0.75rem" }}>
            {ADMIN_NAV.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => onSectionChange(n.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "0.625rem 1rem",
                  border: "none",
                  borderRight: `3px solid ${section === n.key ? C.emerald : "transparent"}`,
                  background: section === n.key ? C.sage : "transparent",
                  color: section === n.key ? C.emeraldDeep : C.inkSoft,
                  fontWeight: section === n.key ? 700 : 400,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "right",
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </aside>
        <main style={{ flex: 1, padding: "1.75rem 2rem 3rem", overflow: "auto", minWidth: 0 }}>
          <FlashBanner flash={flash} onClose={clearFlash} />
          {children}
        </main>
      </div>
    </AdminShellContext.Provider>
  );
}
