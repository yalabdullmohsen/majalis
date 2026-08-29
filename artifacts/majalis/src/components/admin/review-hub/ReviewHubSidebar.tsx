/**
 * Flutter AdminMainLayout sidebar — dark #1E1E2D, gold brand, brown selected.
 */
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

export type ReviewHubNavKey =
  | "overview"
  | "review"
  | "content"
  | "roles"
  | "settings";

export type ReviewHubSidebarProps = {
  active: ReviewHubNavKey;
  pendingCount: number;
  onNavigate: (key: ReviewHubNavKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

const NAV: Array<{
  key: ReviewHubNavKey;
  label: string;
  href?: string;
  Icon: typeof LayoutDashboard;
  badge?: boolean;
}> = [
  { key: "overview", label: "الإحصائيات العامة", Icon: LayoutDashboard },
  { key: "review", label: "مركز المراجعة", Icon: ClipboardCheck, badge: true },
  {
    key: "content",
    label: "إدارة المحتوى",
    href: "/admin?section=categories",
    Icon: BookOpen,
  },
  {
    key: "roles",
    label: "المستخدمين والمشايخ",
    href: "/admin?section=users",
    Icon: Users,
  },
];

export function ReviewHubSidebar({
  active,
  pendingCount,
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
        className={`rh-sidebar${mobileOpen ? " is-open" : ""}`}
        aria-label="تنقل لوحة الإدارة"
      >
        <div className="rh-sidebar__brand">
          <Sparkles size={26} className="rh-sidebar__spark" aria-hidden="true" />
          <p className="rh-sidebar__title">سُنّة</p>
        </div>

        <nav className="rh-sidebar__nav">
          {NAV.map(({ key, label, href, Icon, badge }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                className={`rh-sidebar__item${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  onNavigate(key);
                  onCloseMobile();
                  if (href && key !== "review" && key !== "overview") navigate(href);
                }}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span className="rh-sidebar__item-label">{label}</span>
                {badge ? (
                  <span className="rh-sidebar__badge">{pendingCount}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="rh-sidebar__foot">
          <div className="rh-sidebar__divider" />
          <button
            type="button"
            className={`rh-sidebar__item${active === "settings" ? " is-active" : ""}`}
            onClick={() => {
              onNavigate("settings");
              onCloseMobile();
              navigate("/admin?section=settings");
            }}
          >
            <Settings size={18} aria-hidden="true" />
            <span className="rh-sidebar__item-label">الإعدادات</span>
          </button>
          <Link href="/" className="rh-sidebar__site" onClick={onCloseMobile}>
            ← العودة للموقع
          </Link>
        </div>
      </aside>
    </>
  );
}

export default ReviewHubSidebar;
