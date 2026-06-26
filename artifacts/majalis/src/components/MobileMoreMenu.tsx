"use client";

import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { MOBILE_MORE_NAV } from "@/lib/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
  onLogout: () => void;
  searchBox: React.ReactNode;
  tabStyle: (active: boolean) => React.CSSProperties;
  location: string;
};

export function MobileMoreMenu({
  open,
  onClose,
  isActive,
  isAdmin,
  isLoggedIn,
  onLogout,
  searchBox,
  tabStyle,
  location,
}: Props) {
  if (!open || typeof document === "undefined") return null;

  const menu = (
    <div className="mobile-nav-layer mobile-nav-layer--more" role="presentation">
      <button type="button" className="mobile-nav-backdrop" aria-label="إغلاق قائمة المزيد" onClick={onClose} />
      <div id="navbar-mobile-more-panel" className="navbar-mobile-panel navbar-mobile-panel--portaled" role="dialog" aria-label="قائمة المزيد">
        {searchBox}
        <nav aria-label="روابط المزيد">
          {MOBILE_MORE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{ ...tabStyle(isActive(item.href)), display: "block", padding: "0.6rem 0.75rem" }}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin ? (
            <>
              <Link
                href="/admin"
                onClick={onClose}
                style={{ ...tabStyle(location.startsWith("/admin")), display: "block", padding: "0.6rem 0.75rem" }}
              >
                لوحة التحكم
              </Link>
              <button type="button" onClick={onLogout} className="navbar-logout navbar-logout--block">
                تسجيل الخروج
              </button>
            </>
          ) : isLoggedIn ? (
            <>
              <Link
                href="/settings"
                onClick={onClose}
                style={{ ...tabStyle(isActive("/settings")), display: "block", padding: "0.6rem 0.75rem" }}
              >
                الإعدادات
              </Link>
              <button type="button" onClick={onLogout} className="navbar-logout navbar-logout--block">
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                style={{ ...tabStyle(isActive("/login")), display: "block", padding: "0.6rem 0.75rem" }}
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                style={{ ...tabStyle(isActive("/register")), display: "block", padding: "0.6rem 0.75rem" }}
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );

  return createPortal(menu, document.body);
}

export default MobileMoreMenu;
