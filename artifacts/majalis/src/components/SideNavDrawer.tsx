"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  BookMarked,
  Clock,
  Compass,
  GraduationCap,
  Heart,
  Home,
  Library,
  MessageCircleQuestion,
  Mic2,
  Moon,
  Radio,
  Scale,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Sun,
  Tv,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { NAV_GROUPS } from "@/lib/navigation";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "/": Home,
  "/search": Search,
  "/lessons": GraduationCap,
  "/annual-courses": BookMarked,
  "/library": Library,
  "/fiqh-council": Scale,
  "/fatwa": ScrollText,
  "/rulings": ScrollText,
  "/updates": Sparkles,
  "/calendar": Clock,
  "/fawaid": Heart,
  "/qa": MessageCircleQuestion,
  "/quran": BookOpen,
  "/quran-radio": Radio,
  "/quran-live": Tv,
  "/quran/tajweed": Mic2,
  "/quran/surah-stories": Library,
  "/daily-wird": Sun,
  "/adhkar": Sparkles,
  "/tasbih": Compass,
  "/arbaeen-nawawi": ScrollText,
  "/occasions": Moon,
  "/prayer-times": Clock,
  "/prayer-ranks": Heart,
  "/qibla": Compass,
  "/settings": Settings,
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function lockBodyScroll(locked: boolean) {
  if (locked) {
    document.body.classList.add("side-nav-open");
  } else {
    document.body.classList.remove("side-nav-open");
  }
}

export function SideNavDrawer({ open, onClose }: Props) {
  const [pathname] = useLocation();
  const { isAdmin, isLoggedIn } = useAuth();

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    lockBodyScroll(false);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) {
      lockBodyScroll(false);
      return;
    }

    lockBodyScroll(true);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const onPopState = () => close();

    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPopState);

    return () => {
      lockBodyScroll(false);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPopState);
    };
  }, [open, close]);

  if (!open) return null;

  const handleBackdropClose = (event: React.PointerEvent) => {
    event.preventDefault();
    close();
  };

  const handleLinkClick = () => {
    close();
  };

  const drawer = (
    <div
      className="side-nav-backdrop--v2"
      onPointerDown={handleBackdropClose}
      role="presentation"
    >
      <aside
        className="side-nav-drawer--v2"
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="القائمة الجانبية"
      >
        <div className="side-nav-drawer__head side-nav-drawer__head--v2">
          <div className="side-nav-drawer__brand">
            <img src="/logo.png" alt="" width={36} height={36} />
            <strong>المجلس العلمي</strong>
          </div>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="إغلاق"
            className="side-nav-close"
          >
            <X size={22} aria-hidden="true" />
            <span className="sr-only">إغلاق</span>
          </button>
        </div>

        <div className="side-nav-drawer__body">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="side-nav-group side-nav-group--v2">
              <p className="side-nav-group__title">{group.title}</p>
              <nav>
                {group.links.map((link) => {
                  const active =
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`) ||
                    pathname.startsWith(`${link.href}?`);
                  const Icon = ICONS[link.href.split("?")[0]] || BookOpen;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleLinkClick}
                      className={`side-nav-link side-nav-link--v2${active ? " is-active" : ""}`}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          <div className="side-nav-group side-nav-group--v2">
            <p className="side-nav-group__title">الحساب</p>
            <nav>
              {!isLoggedIn ? (
                <>
                  <Link href="/login" onClick={handleLinkClick} className="side-nav-link side-nav-link--v2">
                    <Settings size={18} />
                    <span>دخول</span>
                  </Link>
                  <Link href="/register" onClick={handleLinkClick} className="side-nav-link side-nav-link--v2">
                    <UserPlus size={18} />
                    <span>إنشاء حساب</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/settings"
                  onClick={handleLinkClick}
                  className={`side-nav-link side-nav-link--v2${pathname.startsWith("/settings") ? " is-active" : ""}`}
                >
                  <Settings size={18} />
                  <span>الإعدادات</span>
                </Link>
              )}
            </nav>
          </div>

          <div className="side-nav-group side-nav-group--v2 side-nav-group--admin">
            <p className="side-nav-group__title">الإدارة</p>
            <nav>
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={handleLinkClick}
                  className={`side-nav-link side-nav-link--v2${pathname.startsWith("/admin") ? " is-active" : ""}`}
                >
                  <Settings size={18} />
                  <span>لوحة التحكم</span>
                </Link>
              ) : (
                <Link href="/login?next=/admin" onClick={handleLinkClick} className="side-nav-link side-nav-link--v2">
                  <Settings size={18} />
                  <span>دخول المسؤول</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

export default SideNavDrawer;
