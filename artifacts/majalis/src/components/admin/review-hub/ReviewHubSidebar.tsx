/**
 * Collapsible sidebar for Review Hub — 5 primary destinations.
 */
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

export type ReviewHubNavKey =
  | "overview"
  | "review"
  | "content"
  | "roles"
  | "settings";

export type ReviewHubSidebarProps = {
  collapsed: boolean;
  darkMode: boolean;
  active: ReviewHubNavKey;
  onToggleCollapse: () => void;
  onToggleDark: () => void;
  onNavigate: (key: ReviewHubNavKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

const NAV: Array<{
  key: ReviewHubNavKey;
  label: string;
  href?: string;
  Icon: typeof LayoutDashboard;
  primary?: boolean;
}> = [
  { key: "overview", label: "نظرة عامة", href: "/admin", Icon: LayoutDashboard },
  { key: "review", label: "خانة المراجعة", Icon: ClipboardCheck, primary: true },
  {
    key: "content",
    label: "القرآن والمحتوى",
    href: "/admin?section=categories",
    Icon: BookOpen,
  },
  { key: "roles", label: "المستخدمون والعلماء", href: "/admin?section=users", Icon: Users },
  { key: "settings", label: "إعدادات النظام", href: "/admin?section=settings", Icon: Settings },
];

export function ReviewHubSidebar({
  collapsed,
  darkMode,
  active,
  onToggleCollapse,
  onToggleDark,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: ReviewHubSidebarProps) {
  const [, navigate] = useLocation();

  return (
    <>
      <div
        className={`rh-backdrop${mobileOpen ? " is-open" : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside
        className={`rh-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-open" : ""}`}
        aria-label="تنقل لوحة الإدارة"
      >
        <div className="rh-sidebar__brand">
          <span className="rh-sidebar__mark" aria-hidden="true">
            م
          </span>
          {!collapsed ? (
            <div>
              <p className="rh-sidebar__title">المجلس العلمي</p>
              <p className="rh-sidebar__sub">لوحة الإدارة</p>
            </div>
          ) : null}
          <button
            type="button"
            className="rh-sidebar__collapse"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            {collapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
          </button>
        </div>

        <nav className="rh-sidebar__nav">
          {NAV.map(({ key, label, href, Icon, primary }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                className={`rh-sidebar__item${isActive ? " is-active" : ""}${primary ? " is-primary" : ""}`}
                aria-current={isActive ? "page" : undefined}
                title={label}
                onClick={() => {
                  onNavigate(key);
                  onCloseMobile();
                  if (href && key !== "review") navigate(href);
                }}
              >
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                {!collapsed ? <span>{label}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="rh-sidebar__foot">
          <button
            type="button"
            className="rh-sidebar__item"
            onClick={onToggleDark}
            aria-pressed={darkMode}
            title={darkMode ? "وضع فاتح" : "وضع داكن"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed ? <span>{darkMode ? "وضع فاتح" : "وضع داكن"}</span> : null}
          </button>
          <Link href="/" className="rh-sidebar__site" onClick={onCloseMobile}>
            ← الموقع
          </Link>
        </div>
      </aside>
    </>
  );
}

export function ReviewHubMobileToggle({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="rh-mobile-toggle"
      onClick={onOpen}
      aria-label="فتح القائمة"
    >
      <Menu size={18} />
    </button>
  );
}

export default ReviewHubSidebar;
