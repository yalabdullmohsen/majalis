"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookMarked, BookOpen, GraduationCap, Home, LayoutGrid, Lightbulb } from "lucide-react";
import { MoreBottomSheet } from "./MoreBottomSheet";

type NavTab = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean }>;
};

const NAV_TABS: NavTab[] = [
  { href: "/",        label: "الرئيسية", Icon: Home },
  { href: "/fawaid",  label: "الفوائد",  Icon: Lightbulb },
  { href: "/lessons", label: "الدروس",   Icon: GraduationCap },
  { href: "/quran",   label: "المصحف",   Icon: BookMarked },
  { href: "/adhkar",  label: "الأذكار",  Icon: BookOpen },
];

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(href + "/");
  };

  return (
    <>
      <nav className="bottom-nav bottom-nav--v2" aria-label="التنقل السفلي">
        {NAV_TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav__tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="bottom-nav__tab-icon">
                <Icon
                  size={24}
                  strokeWidth={active ? 2.4 : 1.6}
                  aria-hidden={true}
                />
              </span>
              <span className="bottom-nav__tab-label">{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={`bottom-nav__tab${moreOpen ? " is-active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-label="قائمة التطبيق"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span className="bottom-nav__tab-icon">
            <LayoutGrid size={24} strokeWidth={moreOpen ? 2.4 : 1.6} aria-hidden={true} />
          </span>
          <span className="bottom-nav__tab-label">المزيد</span>
        </button>
      </nav>

      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
