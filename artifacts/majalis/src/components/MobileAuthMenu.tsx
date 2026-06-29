"use client";

import { createPortal } from "react-dom";
import { Link } from "wouter";
import { User } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { ACCOUNT_MENU_LINKS } from "@/lib/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
  onLogout: () => void;
  isActive: (href: string) => boolean;
};

function displayInitial(user: ReturnType<typeof useAuth>["user"]) {
  const name = user?.profile?.full_name || user?.profile?.name || user?.email || "م";
  return name.trim().slice(0, 1).toUpperCase();
}

export function MobileAuthMenu({ open, onClose, onToggle, onLogout, isActive }: Props) {
  const { isAdmin, isLoggedIn, user } = useAuth();

  const guestControl = (
    <div className="mobile-auth-control">
      <button
        type="button"
        className="navbar-login navbar-login--mobile navbar-login--solo"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="mobile-auth-menu-panel"
        aria-haspopup="true"
        aria-label="تسجيل الدخول أو إنشاء حساب"
      >
        دخول
      </button>
    </div>
  );

  const accountControl = (
    <div className="mobile-auth-control">
      <button
        type="button"
        className="mobile-auth-avatar"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="mobile-auth-menu-panel"
        aria-haspopup="true"
        aria-label="قائمة الحساب"
      >
        <span className="mobile-auth-avatar__initial" aria-hidden="true">
          {displayInitial(user)}
        </span>
        <User size={18} className="mobile-auth-avatar__icon" aria-hidden="true" />
      </button>
    </div>
  );

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="mobile-nav-layer mobile-nav-layer--account" role="presentation">
            <button type="button" className="mobile-nav-backdrop" aria-label="إغلاق قائمة الحساب" onClick={onClose} />
            <div
              id="mobile-auth-menu-panel"
              className="mobile-auth-menu"
              role="dialog"
              aria-modal="true"
              aria-label={isLoggedIn ? "قائمة الحساب" : "خيارات الدخول"}
              onClick={(event) => event.stopPropagation()}
            >
              {!isLoggedIn ? (
                <nav aria-label="خيارات الدخول">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className={`mobile-auth-menu__link${isActive("/login") ? " is-active" : ""}`}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className={`mobile-auth-menu__link${isActive("/register") ? " is-active" : ""}`}
                  >
                    إنشاء حساب
                  </Link>
                </nav>
              ) : (
                <>
                  <div className="mobile-auth-menu__head">
                    <span className="mobile-auth-menu__avatar" aria-hidden="true">
                      {displayInitial(user)}
                    </span>
                    <div className="mobile-auth-menu__meta">
                      <strong>{user?.profile?.full_name || user?.profile?.name || "حسابي"}</strong>
                      {user?.email && <span>{user.email}</span>}
                    </div>
                  </div>
                  <nav aria-label="قائمة الحساب">
                    {ACCOUNT_MENU_LINKS.filter((link) => !link.adminOnly || isAdmin).map((link) => (
                      <Link
                        key={`${link.href}-${link.label}`}
                        href={link.href}
                        onClick={onClose}
                        className={`mobile-auth-menu__link${isActive(link.href) ? " is-active" : ""}`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <button type="button" onClick={onLogout} className="mobile-auth-menu__logout">
                      تسجيل الخروج
                    </button>
                  </nav>
                </>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {isLoggedIn ? accountControl : guestControl}
      {panel}
    </>
  );
}

export default MobileAuthMenu;
