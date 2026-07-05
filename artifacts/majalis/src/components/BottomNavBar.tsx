"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, GraduationCap, Home, LayoutGrid, Sunset } from "lucide-react";
import { MoreBottomSheet } from "./MoreBottomSheet";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";

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
        {LEFT_TABS.map(renderTab)}

        {/* عنصر الصلاة — عنصر خامس رسمي بنفس أسلوب باقي العناصر */}
        <Link
          href="/prayer-times"
          className={`bottom-nav__tab${prayerActive ? " is-active" : ""}`}
          aria-current={prayerActive ? "page" : undefined}
          aria-label={next ? `الصلاة القادمة: ${next.name} ${next.time}` : "مواقيت الصلاة"}
        >
          <span className="bottom-nav__tab-icon bottom-nav__tab-icon--prayer">
            <Sunset size={22} strokeWidth={prayerActive ? 2.3 : 1.6} aria-hidden="true" />
            {next && (
              <span className="bottom-nav__prayer-badge" aria-hidden="true">
                {next.time}
              </span>
            )}
          </span>
          <span className="bottom-nav__tab-label">الصلاة</span>
        </Link>

        {RIGHT_TABS.map(renderTab)}

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
