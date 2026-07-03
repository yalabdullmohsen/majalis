"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, GraduationCap, Home, LayoutGrid, Moon } from "lucide-react";
import { MoreBottomSheet } from "./MoreBottomSheet";

const TABS = [
  { href: "/",                 label: "الرئيسية", Icon: Home },
  { href: "/lessons",          label: "الدروس",   Icon: GraduationCap },
  { href: "/quran",            label: "القرآن",   Icon: BookOpen },
  { href: "/prayer-countdown", label: "الصلاة",   Icon: Moon },
] as const;

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(href + "/");
  };

  return (
    <>
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

        {/* زر "المزيد" — يفتح الشبكة الشاملة */}
        <button
          type="button"
          className={`bottom-nav__tab${moreOpen ? " is-active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-label="قائمة التطبيق"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span className="bottom-nav__tab-icon">
            <LayoutGrid size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="bottom-nav__tab-label">المزيد</span>
        </button>
      </nav>

      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
