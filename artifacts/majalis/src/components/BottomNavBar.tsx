"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, GraduationCap, Home, LayoutGrid, Moon } from "lucide-react";
import { MoreBottomSheet } from "./MoreBottomSheet";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";

// مجموعتان تُحيطان بزرّ الصلاة المركزي
const LEFT_TABS = [
  { href: "/",        label: "الرئيسية", Icon: Home },
  { href: "/lessons", label: "الدروس",   Icon: GraduationCap },
] as const;

const RIGHT_TABS = [
  { href: "/quran",   label: "القرآن",   Icon: BookOpen },
] as const;

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

  const renderTab = ({ href, label, Icon }: { href: string; label: string; Icon: typeof Home }) => (
    <Link
      key={href}
      href={href}
      className={`bottom-nav__tab${isActive(href) ? " is-active" : ""}`}
      aria-current={isActive(href) ? "page" : undefined}
    >
      <span className="bottom-nav__tab-icon">
        <Icon size={21} strokeWidth={isActive(href) ? 2.2 : 1.7} aria-hidden="true" />
      </span>
      <span className="bottom-nav__tab-label">{label}</span>
    </Link>
  );

  return (
    <>
      <nav className="bottom-nav" aria-label="التنقل السفلي">
        {LEFT_TABS.map(renderTab)}

        {/* زرّ الصلاة المركزي — مواقيت حيّة في نصّ القائمة */}
        <Link
          href="/prayer-countdown"
          className={`bottom-nav__center${prayerActive ? " is-active" : ""}`}
          aria-current={prayerActive ? "page" : undefined}
          aria-label={next ? `الصلاة القادمة: ${next.name} ${next.time}` : "مواقيت الصلاة"}
        >
          <span className="bottom-nav__center-btn">
            <Moon size={22} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="bottom-nav__center-meta">
            {next ? (
              <>
                <span className="bottom-nav__center-name">{next.name}</span>
                <span className="bottom-nav__center-time">{next.time}</span>
              </>
            ) : (
              <span className="bottom-nav__center-name">الصلاة</span>
            )}
          </span>
        </Link>

        {RIGHT_TABS.map(renderTab)}

        {/* زرّ "المزيد" — يفتح الشبكة الشاملة */}
        <button
          type="button"
          className={`bottom-nav__tab${moreOpen ? " is-active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-label="قائمة التطبيق"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span className="bottom-nav__tab-icon">
            <LayoutGrid size={21} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <span className="bottom-nav__tab-label">المزيد</span>
        </button>
      </nav>

      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
