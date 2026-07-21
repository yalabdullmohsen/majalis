"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, CircleHelp, GraduationCap, Home, LayoutGrid } from "lucide-react";
import { MoreBottomSheet } from "./MoreBottomSheet";

const NAV_TABS = [
  { href: "/",        label: "الرئيسية", Icon: Home },
  { href: "/quran",   label: "القرآن",   Icon: BookOpen },
  { href: "/qa",      label: "سؤال وجواب", Icon: CircleHelp },
  { href: "/learning/paths", label: "تعلّم", Icon: GraduationCap },
] as const;

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(href + "/");
  };

  const renderTab = ({ href, label, Icon }: { href: string; label: string; Icon: typeof Home }) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        className={`bottom-nav__tab${active ? " is-active" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <span className="bottom-nav__tab-icon">
          <Icon size={22} strokeWidth={active ? 2.3 : 1.6} aria-hidden="true" />
        </span>
        <span className="bottom-nav__tab-label">{label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="bottom-nav" aria-label="التنقل السفلي">
        {NAV_TABS.map(renderTab)}

        <button
          type="button"
          className={`bottom-nav__tab${moreOpen ? " is-active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-label="قائمة التطبيق"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span className="bottom-nav__tab-icon">
            <LayoutGrid size={22} strokeWidth={moreOpen ? 2.3 : 1.6} aria-hidden="true" />
          </span>
          <span className="bottom-nav__tab-label">المزيد</span>
        </button>
      </nav>

      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
