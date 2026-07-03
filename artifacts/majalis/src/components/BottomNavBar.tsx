"use client";

import { Link, useLocation } from "wouter";
import { BookOpen, GraduationCap, Home, Menu, Moon } from "lucide-react";

const TABS = [
  { href: "/",                 label: "الرئيسية", Icon: Home },
  { href: "/lessons",          label: "الدروس",   Icon: GraduationCap },
  { href: "/quran",            label: "القرآن",   Icon: BookOpen },
  { href: "/prayer-countdown", label: "الصلاة",   Icon: Moon },
] as const;

export function BottomNavBar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(href + "/");
  };

  const openSideNav = () => {
    window.dispatchEvent(new CustomEvent("sidenav-open"));
  };

  return (
    <nav className="bottom-nav" aria-label="التنقل السفلي">
      {TABS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`bottom-nav__tab${isActive(href) ? " is-active" : ""}`}
          aria-current={isActive(href) ? "page" : undefined}
        >
          <span className="bottom-nav__tab-icon">
            <Icon size={22} strokeWidth={isActive(href) ? 2.2 : 1.8} aria-hidden="true" />
          </span>
          <span className="bottom-nav__tab-label">{label}</span>
        </Link>
      ))}
      <button
        type="button"
        className="bottom-nav__tab"
        onClick={openSideNav}
        aria-label="القائمة الرئيسية"
        aria-haspopup="dialog"
        style={{ marginInlineStart: "auto" }}
      >
        <span className="bottom-nav__tab-icon">
          <Menu size={22} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="bottom-nav__tab-label">القائمة</span>
      </button>
    </nav>
  );
}
