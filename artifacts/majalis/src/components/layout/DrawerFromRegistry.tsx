/**
 * صفوف الدرج من سجل الأقسام — أيقونة + عنوان، بلا بطاقات متدرّجة.
 */
import { memo, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { SIDEBAR_NAV_GROUPS } from "@/lib/sidebar-nav";
import { isNavHrefActive } from "@/lib/nav-active";

type Props = {
  onNavigate?: () => void;
  className?: string;
};

export const DrawerFromRegistry = memo(function DrawerFromRegistry({
  onNavigate,
  className,
}: Props) {
  const groups = useMemo(() => SIDEBAR_NAV_GROUPS, []);
  const [pathname] = useLocation();

  return (
    <div className={className}>
      {groups.map((group) => (
        <section
          key={group.id}
          className="sidebar-section"
          aria-label={group.title || undefined}
        >
          {group.title ? (
            <h2 className="sidebar-section-title">{group.title}</h2>
          ) : null}
          <nav aria-label={group.title || "تنقّل الدرج"}>
            {group.items.map((item) => {
              const active = isNavHrefActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`sidebar-item${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                >
                  <span className="sidebar-item-icon" aria-hidden="true">
                    <item.Icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="sidebar-item-text">
                    <span className="sidebar-item-title">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </section>
      ))}
    </div>
  );
});
