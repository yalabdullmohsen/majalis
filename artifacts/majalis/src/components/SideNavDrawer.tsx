"use client";

import { useState } from "react";
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
  Users,
  X,
} from "lucide-react";
import { SearchSuggestions } from "./SearchSuggestions";
import { MOBILE_DRAWER_GROUPS, NAV_GROUPS } from "@/lib/navigation";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "/": Home,
  "/search": Search,
  "/lessons": GraduationCap,
  "/annual-courses": BookMarked,
  "/quran-scientific-circles": GraduationCap,
  "/library": Library,
  "/research": GraduationCap,
  "/fiqh-council": Scale,
  "/fatwa": ScrollText,
  "/rulings": ScrollText,
  "/updates": Sparkles,
  "/calendar": Clock,
  "/fawaid": Heart,
  "/qa": MessageCircleQuestion,
  "/question-answer": MessageCircleQuestion,
  "/quran": BookOpen,
  "/quran/mushaf": BookOpen,
  "/quran/tafsir": ScrollText,
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
  "/sheikhs": Users,
  "/scholar-search": Search,
  "/learning/paths": GraduationCap,
  "/learning/quiz": GraduationCap,
  "/quiz": GraduationCap,
  "/about": Sparkles,
  "/privacy": ScrollText,
  "/terms": ScrollText,
  "/contact": MessageCircleQuestion,
  "/contribute": Heart,
  "/my-updates": Sparkles,
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** When true, show the streamlined mobile drawer groups */
  mobileLayout?: boolean;
};

function DrawerSearch({ onSubmitDone }: { onSubmitDone: () => void }) {
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();

  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    navigate(`/search/${encodeURIComponent(q)}`);
    setTerm("");
    onSubmitDone();
  };

  return (
    <form
      className="side-nav-drawer__search"
      onSubmit={(event) => {
        event.preventDefault();
        submit(term);
      }}
    >
      <SearchSuggestions
        value={term}
        onChange={setTerm}
        onSubmit={submit}
        placeholder="بحث في المنصة..."
        compact
      />
      <button type="button" onClick={() => submit(term)} aria-label="بحث" className="side-nav-drawer__search-btn">
        <Search size={18} aria-hidden="true" />
      </button>
    </form>
  );
}

export function SideNavDrawer({ open, onClose, mobileLayout = false }: Props) {
  const [pathname] = useLocation();
  const groups = mobileLayout ? MOBILE_DRAWER_GROUPS : NAV_GROUPS;

  if (!open || typeof document === "undefined") return null;

  const close = () => onClose();

  const drawer = (
    <div className="mobile-nav-layer mobile-nav-layer--drawer" role="presentation">
      <button
        type="button"
        className="mobile-nav-backdrop"
        aria-label="إغلاق القائمة الجانبية"
        onClick={close}
      />
      <aside
        id="main-navigation-drawer"
        className="side-nav-drawer--v2"
        role="dialog"
        aria-modal="true"
        aria-label="القائمة الجانبية"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="side-nav-drawer__head side-nav-drawer__head--v2">
          <Link href="/" onClick={close} className="side-nav-drawer__brand">
            <img src="/logo.png" alt="" width={36} height={36} />
            <strong>المجلس العلمي</strong>
          </Link>
          <button type="button" onClick={close} aria-label="إغلاق" className="side-nav-close">
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="side-nav-drawer__search-wrap">
          <DrawerSearch onSubmitDone={close} />
        </div>

        <div className="side-nav-drawer__body">
          {groups.map((group) => (
            <div key={group.id} className="side-nav-group side-nav-group--v2">
              <p className="side-nav-group__title">{group.title}</p>
              <nav aria-label={group.title}>
                {group.links.map((link) => {
                  const path = link.href.split("?")[0];
                  const active =
                    pathname === link.href ||
                    pathname === path ||
                    pathname.startsWith(`${path}/`) ||
                    pathname.startsWith(`${path}?`);
                  const Icon = ICONS[path] || BookOpen;
                  return (
                    <Link
                      key={`${group.id}-${link.label}-${link.href}`}
                      href={link.href}
                      onClick={close}
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
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

export default SideNavDrawer;
