"use client";

import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Clock,
  Compass,
  GraduationCap,
  Heart,
  Home,
  Library,
  MessageCircleQuestion,
  Mic2,
  Radio,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Sun,
  Tv,
  Mail,
} from "lucide-react";
import { getMobileMoreNav, type NavLink } from "@/lib/navigation";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  home: Home,
  search: Search,
  lessons: GraduationCap,
  courses: ScrollText,
  library: Library,
  fiqh: ScrollText,
  fatwa: ScrollText,
  rulings: ScrollText,
  updates: Sparkles,
  calendar: Clock,
  fawaid: Heart,
  qa: MessageCircleQuestion,
  mushaf: BookOpen,
  quran: BookOpen,
  tajweed: Mic2,
  stories: Library,
  live: Tv,
  radio: Radio,
  wird: Sun,
  adhkar: Sparkles,
  tasbih: Compass,
  arbaeen: ScrollText,
  occasions: Sparkles,
  prayer: Clock,
  ranks: Heart,
  qibla: Compass,
  settings: Settings,
  contact: Mail,
};

function NavIcon({ link }: { link: NavLink }) {
  const Icon = (link.icon && ICONS[link.icon]) || BookOpen;
  return <Icon size={16} aria-hidden="true" />;
}

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
  const moreLinks = getMobileMoreNav(isAdmin);

  if (!open || typeof document === "undefined") return null;

  const menu = (
    <div className="mobile-nav-layer mobile-nav-layer--more" role="presentation">
      <button type="button" className="mobile-nav-backdrop" aria-label="إغلاق قائمة المزيد" onClick={onClose} />
      <div id="navbar-mobile-more-panel" className="navbar-mobile-panel navbar-mobile-panel--portaled" role="dialog" aria-label="قائمة المزيد">
        {searchBox}
        <nav aria-label="روابط المزيد">
          {moreLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`mobile-more-link${isActive(item.href) ? " is-active" : ""}`}
              style={{ ...tabStyle(isActive(item.href)), display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.75rem" }}
            >
              <NavIcon link={item} />
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
