import { Link, useLocation } from "wouter";
import { useId, useMemo, useRef, useState, type MouseEvent } from "react";
import { ChevronLeft, Moon, Search, Sun } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme-preference";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { isNavHrefActive } from "@/lib/nav-active";
import {
  filterServicesCenterGroups,
  type ServicesCenterItem,
} from "@/lib/services-center-nav";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { haptics } from "@/lib/haptics";
import "@/styles/components/more-bottom-sheet.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHARE_URL = "https://majlisilm.com/";
const SHARE_TEXT = "المجلس العلمي — منصة شرعية جامعة للمصحف والأذكار والدروس والعلم الموثّق.";

function themeLabel(preference: ThemePreference, resolved: "light" | "dark") {
  const base = THEME_OPTIONS.find((o) => o.id === preference)?.label ?? "تلقائي";
  if (preference === "auto") {
    return `${base} (${resolved === "dark" ? "ليلي الآن" : "نهاري الآن"})`;
  }
  return base;
}

export function MoreBottomSheet({ open, onClose }: Props) {
  const [location, navigate] = useLocation();
  const { preference, resolvedTheme, setPreference, toggleDark } = useThemePreference();
  const { isLoggedIn, logout } = useAuth();
  const [query, setQuery] = useState("");
  const searchId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => filterServicesCenterGroups(query), [query]);

  const onSoonClick = (label: string) => {
    onClose();
    window.dispatchEvent(new CustomEvent("global-coming-soon-open", { detail: { title: label } }));
  };

  const openSearch = () => {
    onClose();
    window.dispatchEvent(new CustomEvent("global-search-open"));
  };

  const shareApp = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "المجلس العلمي", text: SHARE_TEXT, url: SHARE_URL });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SHARE_URL);
      }
    } catch {
      /* ألغى المستخدم المشاركة */
    }
    onClose();
  };

  const rateApp = () => {
    onClose();
    window.open("https://majlisilm.com/contact?topic=rate", "_blank", "noopener,noreferrer");
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate("/login");
  };

  const cycleTheme = () => {
    const order: ThemePreference[] = ["light", "dark", "auto"];
    const idx = order.indexOf(preference);
    setPreference(order[(idx + 1) % order.length]);
  };

  const runItem = (item: ServicesCenterItem, e?: MouseEvent) => {
    haptics.selection();
    const { action } = item;
    if (action.kind === "link") {
      if (isComingSoonPath(action.href)) {
        e?.preventDefault();
        onSoonClick(item.label);
        return;
      }
      onClose();
      return;
    }
    e?.preventDefault();
    if (action.kind === "search") openSearch();
    else if (action.kind === "theme") cycleTheme();
    else if (action.kind === "share") void shareApp();
    else if (action.kind === "rate") rateApp();
    else if (action.kind === "logout") void handleLogout();
  };

  const renderItem = (item: ServicesCenterItem, layout: "quick" | "list") => {
    const href = item.action.kind === "link" ? item.action.href : undefined;
    const active = href ? isNavHrefActive(location, href) : false;
    const soon = href ? isComingSoonPath(href) : false;
    const isTheme = item.action.kind === "theme";
    const isLogout = item.action.kind === "logout";
    if (isLogout && !isLoggedIn) return null;

    const className = [
      "more-sheet-item",
      layout === "quick" ? "more-sheet-item--quick" : "more-sheet-item--row",
      active ? "more-sheet-item--active" : "",
      soon ? "more-sheet-item--soon" : "",
      isTheme ? "more-sheet-item--theme" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const icon = isTheme ? (
      resolvedTheme === "dark" ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />
    ) : (
      <item.Icon size={18} strokeWidth={1.8} />
    );

    const label = isTheme ? "المظهر" : item.label;
    const meta = isTheme ? themeLabel(preference, resolvedTheme) : soon ? "قريبًا" : null;
    const aria = isTheme
      ? `المظهر: ${themeLabel(preference, resolvedTheme)}`
      : soon
        ? `${item.label} — قريبًا`
        : item.label;

    const inner = (
      <>
        <span className="more-sheet-item__icon" aria-hidden="true">{icon}</span>
        <span className="more-sheet-item__text">
          <span className="more-sheet-item__label">{label}</span>
          {meta ? <span className="more-sheet-item__meta">{meta}</span> : null}
        </span>
        {layout === "list" ? (
          isTheme ? (
            <button
              type="button"
              className="more-sheet-theme-switch"
              onClick={(e) => {
                e.stopPropagation();
                toggleDark();
              }}
              aria-label={resolvedTheme === "dark" ? "التحويل إلى الوضع النهاري" : "التحويل إلى الوضع الليلي"}
            >
              <span className={`more-sheet-theme-switch__knob${resolvedTheme === "dark" ? " is-on" : ""}`} />
            </button>
          ) : (
            <ChevronLeft className="more-sheet-item__chevron" size={18} strokeWidth={1.8} aria-hidden="true" />
          )
        ) : null}
      </>
    );

    if (href && !soon) {
      return (
        <Link
          key={item.id}
          href={href}
          onClick={() => {
            haptics.selection();
            onClose();
          }}
          className={className}
          aria-current={active ? "page" : undefined}
          aria-label={aria}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        className={className}
        onClick={(e) => runItem(item, e)}
        aria-label={aria}
        aria-current={active ? "page" : undefined}
      >
        {inner}
      </button>
    );
  };

  return (
    <AppBottomSheet
      open={open}
      onClose={() => {
        setQuery("");
        onClose();
      }}
      title="مركز الخدمات"
      snap="full"
      closeLabel="إغلاق"
      className="bottom-sheet--services"
      initialFocusRef={searchRef}
    >
      <div className="bottom-sheet__search">
        <label htmlFor={searchId} className="sr-only">بحث في مركز الخدمات</label>
        <Search className="bottom-sheet__search-icon" size={16} strokeWidth={1.8} aria-hidden="true" />
        <input
          ref={searchRef}
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bottom-sheet__search-input"
          placeholder="ابحث في الخدمات…"
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      <div className="bottom-sheet__body-inner">
        {groups.length === 0 ? (
          <p className="bottom-sheet__empty">لا نتائج مطابقة.</p>
        ) : (
          groups.map((group) => (
            <section key={group.id} className="bottom-sheet__section" aria-labelledby={`svc-${group.id}`}>
              <h3 id={`svc-${group.id}`} className="bottom-sheet__section-label">{group.title}</h3>
              <div className={group.layout === "quick" ? "bottom-sheet__quick" : "bottom-sheet__list"}>
                {group.items.map((item) => renderItem(item, group.layout === "quick" ? "quick" : "list"))}
              </div>
            </section>
          ))
        )}
      </div>
    </AppBottomSheet>
  );
}
