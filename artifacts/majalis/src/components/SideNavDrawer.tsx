"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function SideNavDrawer({ open, onClose }: Props) {
  const pathname = usePathname() ?? "/";
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("side-nav-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("side-nav-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={`side-nav-backdrop side-nav-backdrop--v2${open ? " is-open" : ""}`}
      onClick={onClose}
      role="presentation"
      aria-hidden={!open}
    >
      <aside
        className={`side-nav-drawer side-nav-drawer--v2${open ? " is-open" : ""}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="القائمة الجانبية"
        aria-hidden={!open}
      >
        <div className="side-nav-drawer__head side-nav-drawer__head--v2">
          <div className="side-nav-drawer__brand">
            <img src="/logo.png" alt="" width={36} height={36} />
            <strong>المجلس العلمي</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="side-nav-close">
            <X size={22} />
          </button>
        </div>

        <div className="side-nav-drawer__body">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="side-nav-group side-nav-group--v2">
              <p className="side-nav-group__title">{group.title}</p>
              <nav>
                {group.links.map((link) => {
                  const active = pathname === link.href || pathname.startsWith(`${link.href}/`) || pathname.startsWith(`${link.href}?`);
                  const Icon = ICONS[link.href.split("?")[0]] || BookOpen;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
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

          <div className="side-nav-group side-nav-group--v2 side-nav-group--admin">
            <p className="side-nav-group__title">الإدارة</p>
            <nav>
              {isAdmin ? (
                <Link href="/admin" onClick={onClose} className={`side-nav-link side-nav-link--v2${pathname.startsWith("/admin") ? " is-active" : ""}`}>
                  <Settings size={18} />
                  <span>لوحة التحكم</span>
                </Link>
              ) : (
                <Link href="/login?next=/admin" onClick={onClose} className="side-nav-link side-nav-link--v2">
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
}

export default SideNavDrawer;
