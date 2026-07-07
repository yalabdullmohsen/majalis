"use client";

import { createPortal } from "react-dom";
import { Link } from "wouter";
import { MOBILE_MORE_NAV } from "@/lib/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
  onLogout: () => void;
  searchBox: React.ReactNode;
  location: string;
};

function tabCls(active: boolean, extra = "") {
  return `nav-tab nav-tab--block${active ? " nav-tab--active" : ""}${extra ? " " + extra : ""}`;
}

export function MobileMoreMenu({
  open,
  onClose,
  isActive,
  isAdmin,
  isLoggedIn,
  onLogout,
  searchBox,
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
              className={tabCls(isActive(item.href))}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin ? (
            <>
              <Link
                href="/admin"
                onClick={onClose}
                className={tabCls(location.startsWith("/admin"), "nav-tab--admin")}
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
                className={tabCls(isActive("/settings"))}
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
                className={tabCls(isActive("/login"))}
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className={tabCls(isActive("/register"))}
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
