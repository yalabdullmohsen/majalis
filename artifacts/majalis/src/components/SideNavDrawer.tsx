import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { NAV_GROUPS } from "@/lib/navigation";
import { C } from "@/lib/theme";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SideNavDrawer({ open, onClose }: Props) {
  const [location] = useLocation();
  const { isAdmin } = useAuth();
  if (!open) return null;

  return (
    <div className="side-nav-backdrop" onClick={onClose} role="presentation">
      <aside
        className="side-nav-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="القائمة الجانبية"
      >
        <div className="side-nav-drawer__head">
          <strong>المجلس العلمي</strong>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            إغلاق
          </button>
        </div>
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="side-nav-group">
            <p className="side-nav-group__title">{group.title}</p>
            <nav>
              {group.links.map((link) => {
                const active = location === link.href || location.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    style={{
                      color: active ? C.emeraldDeep : C.inkSoft,
                      background: active ? C.sage : "transparent",
                    }}
                    className="side-nav-link"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
        <div className="side-nav-group side-nav-group--admin">
          <p className="side-nav-group__title">الإدارة</p>
          <nav>
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={onClose}
                className="side-nav-link"
                style={{
                  color: location.startsWith("/admin") ? C.emeraldDeep : C.inkSoft,
                  background: location.startsWith("/admin") ? C.sage : "transparent",
                }}
              >
                لوحة التحكم
              </Link>
            ) : (
              <Link
                href="/login?next=/admin"
                onClick={onClose}
                className="side-nav-link side-nav-link--admin"
                style={{
                  color: location === "/login" ? C.emeraldDeep : C.inkSoft,
                  background: location === "/login" ? C.sage : "transparent",
                }}
              >
                دخول المسؤول
              </Link>
            )}
          </nav>
        </div>
      </aside>
    </div>
  );
}

export default SideNavDrawer;
