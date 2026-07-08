"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookMarked, GraduationCap, Home, LayoutGrid, Sunset } from "lucide-react";
import { MoreBottomSheet } from "./MoreBottomSheet";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";

type NavTab = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
};

const NAV_TABS: NavTab[] = [
  { href: "/",        label: "الرئيسية", Icon: Home },
  { href: "/lessons", label: "الدروس",   Icon: GraduationCap },
  { href: "/quran",   label: "المصحف",   Icon: BookMarked },
];

export function BottomNavBar() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { countdown } = usePrayerCountdown();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(href + "/");
  };

  const prayerActive =
    location.startsWith("/prayer-countdown") || location.startsWith("/prayer-times");
  const next = countdown?.next;

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
                <Icon size={24} strokeWidth={active ? 2.4 : 1.6} aria-hidden={true} />
              </span>
              <span className="bottom-nav__tab-label">{label}</span>
            </Link>
          );
        })}

        {/* تبويب الصلاة مع العداد */}
        <Link
          href="/prayer-times"
          className={`bottom-nav__tab${prayerActive ? " is-active" : ""}`}
          aria-current={prayerActive ? "page" : undefined}
          aria-label={next ? `الصلاة القادمة: ${next.name} ${next.time}` : "مواقيت الصلاة"}
        >
          <span className="bottom-nav__tab-icon bottom-nav__tab-icon--prayer">
            <Sunset size={24} strokeWidth={prayerActive ? 2.4 : 1.6} aria-hidden={true} />
            {next && (
              <span className="bottom-nav__prayer-badge" aria-hidden="true">
                {next.time}
              </span>
            )}
          </span>
          <span className="bottom-nav__tab-label">الصلاة</span>
        </Link>

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
