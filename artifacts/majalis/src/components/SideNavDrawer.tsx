import { createPortal } from "react-dom";
import { memo, useCallback, useEffect, useRef } from "react";
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

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const SideNavDrawer = memo(function SideNavDrawer({
  open,
  onClose,
  onLogout,
}: DrawerProps) {
  const [pathname] = useLocation();
  const { isAdmin, isLoggedIn, user } = useAuth();
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const closeBtn = panelRef.current?.querySelector<HTMLElement>(".sidebar-close");
      window.requestAnimationFrame(() => closeBtn?.focus({ preventScroll: true }));
      return;
    }
    previouslyFocusedRef.current?.focus?.({ preventScroll: true });
    previouslyFocusedRef.current = null;
  }, [open]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.willChange = "transform";
    const clear = () => {
      panel.style.willChange = "auto";
    };
    panel.addEventListener("transitionend", clear);
    const t = window.setTimeout(clear, 240);
    return () => {
      window.clearTimeout(t);
      panel.removeEventListener("transitionend", clear);
      panel.style.willChange = "auto";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (n) => !n.hasAttribute("disabled") && n.getAttribute("aria-hidden") !== "true",
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const { swipeHandlers } = usePageSwipe({
    /* RTL: السحب نحو اليمين (خارج الشاشة من الحافة اليمنى) يغلق الدرج */
    onPrev: onClose,
    onNext: () => {},
    threshold: 70,
    disabled: !open,
  });

  const isActive = (href: string) => isNavHrefActive(pathname, href);
  const handleLogout = useCallback(() => {
    onClose();
    onLogout?.();
  }, [onClose, onLogout]);

  if (typeof document === "undefined") return null;

  const drawer = (
    <div
      id="drawer-root"
      data-open={open ? "true" : "false"}
      aria-hidden={open ? undefined : true}
      inert={!open}
    >
      <button
        type="button"
        className="drawer-scrim"
        tabIndex={open ? 0 : -1}
        aria-label="إغلاق القائمة"
        onClick={onClose}
      />
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <aside
        ref={panelRef}
        id="main-navigation-drawer"
        className="drawer-panel sidebar-panel side-nav-drawer--v2"
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label="القائمة الجانبية"
        onClick={(e) => e.stopPropagation()}
        {...swipeHandlers}
      >
        <header className="sidebar-header">
          <div className="sidebar-brand">
            <p className="sidebar-title">القائمة</p>
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
                    onClick={handleLogout}
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

          <div hidden aria-hidden="true">
            {SIDEBAR_NAV_GROUPS.map((g) => g.id).join(",")}
          </div>
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
});

export default SideNavDrawer;
