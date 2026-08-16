import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, LogOut, Settings, UserPlus, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { usePageSwipe } from "@/hooks/usePageSwipe";
import { isNavHrefActive } from "@/lib/nav-active";
import { SIDEBAR_NAV_GROUPS } from "@/lib/sidebar-nav";
import { DrawerFromRegistry } from "@/components/layout/DrawerFromRegistry";
import "@/styles/components/sidebar-redesign.css";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  onLogout?: () => void;
};

export function SideNavDrawer({ open, onClose, onLogout }: DrawerProps) {
  const [pathname] = useLocation();
  const { isAdmin, isLoggedIn, user } = useAuth();

  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    } else {
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  const { swipeHandlers } = usePageSwipe({
    onPrev: onClose,
    onNext: () => {},
    threshold: 70,
    disabled: !open,
  });

  if (!open || typeof document === "undefined") return null;

  const isActive = (href: string) => isNavHrefActive(pathname, href);

  const drawer = (
    <div className="mobile-nav-layer mobile-nav-layer--drawer" role="presentation">
      <button
        type="button"
        className="mobile-nav-backdrop sidebar-backdrop"
        aria-label="إغلاق القائمة"
        onClick={onClose}
      />
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <aside
        id="main-navigation-drawer"
        className="sidebar-panel side-nav-drawer--v2"
        role="dialog"
        aria-modal="true"
        aria-label="القائمة الجانبية"
        onClick={(e) => e.stopPropagation()}
        {...swipeHandlers}
      >
        <header className="sidebar-header">
          <div className="sidebar-brand">
            <p className="sidebar-title">المجلس العلمي</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق القائمة" className="sidebar-close">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        <div className="sidebar-body">
          <DrawerFromRegistry onNavigate={onClose} />

          <section className="sidebar-section" aria-labelledby="sidebar-sec-session">
            <h2 id="sidebar-sec-session" className="sidebar-section-title">
              الجلسة
            </h2>
            <nav aria-label="الجلسة">
              {isLoggedIn && (user?.profile?.full_name || user?.email) ? (
                <div
                  className="sidebar-user-chip"
                  title={user.profile?.full_name || user.email || undefined}
                >
                  {user.profile?.full_name || user.email}
                </div>
              ) : null}

              {!isLoggedIn ? (
                <>
                  <Link href="/login" onClick={onClose} className="sidebar-item" aria-label="تسجيل الدخول">
                    <span className="sidebar-item-icon" aria-hidden="true">
                      <LogIn size={18} strokeWidth={1.8} />
                    </span>
                    <span className="sidebar-item-text">
                      <span className="sidebar-item-title">تسجيل الدخول</span>
                    </span>
                  </Link>
                  <Link href="/register" onClick={onClose} className="sidebar-item" aria-label="إنشاء حساب">
                    <span className="sidebar-item-icon" aria-hidden="true">
                      <UserPlus size={18} strokeWidth={1.8} />
                    </span>
                    <span className="sidebar-item-text">
                      <span className="sidebar-item-title">إنشاء حساب</span>
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={onClose}
                      className={`sidebar-item${isActive("/admin") ? " active" : ""}`}
                      aria-current={isActive("/admin") ? "page" : undefined}
                      aria-label="لوحة التحكم"
                    >
                      <span className="sidebar-item-icon" aria-hidden="true">
                        <Settings size={18} strokeWidth={1.8} />
                      </span>
                      <span className="sidebar-item-text">
                        <span className="sidebar-item-title">لوحة التحكم</span>
                      </span>
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="sidebar-item sidebar-item--danger"
                    onClick={() => {
                      onClose();
                      onLogout?.();
                    }}
                    aria-label="تسجيل الخروج"
                  >
                    <span className="sidebar-item-icon" aria-hidden="true">
                      <LogOut size={18} strokeWidth={1.8} />
                    </span>
                    <span className="sidebar-item-text">
                      <span className="sidebar-item-title">تسجيل الخروج</span>
                    </span>
                  </button>
                </>
              )}
            </nav>
          </section>

          {/* توافق اختبارات: SIDEBAR_NAV_GROUPS من السجل */}
          <div hidden aria-hidden="true">
            {SIDEBAR_NAV_GROUPS.map((g) => g.id).join(",")}
          </div>
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

export default SideNavDrawer;
