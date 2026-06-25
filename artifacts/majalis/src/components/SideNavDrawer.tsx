import { Link, useLocation } from "wouter";
import { NAV_GROUPS } from "@/lib/navigation";
import { C } from "@/lib/theme";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SideNavDrawer({ open, onClose }: Props) {
  const [location] = useLocation();
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
      </aside>
    </div>
  );
}

export default SideNavDrawer;
