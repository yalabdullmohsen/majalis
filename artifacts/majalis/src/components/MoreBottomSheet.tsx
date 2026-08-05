import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { ChevronLeft, Moon, Search, Sun, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme-preference";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { isNavHrefActive } from "@/lib/nav-active";
import {
  filterServicesCenterGroups,
  type ServicesCenterItem,
} from "@/lib/services-center-nav";
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
  const titleId = useId();
  const searchId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const groups = useMemo(() => filterServicesCenterGroups(query), [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDragOffset(0);
      return;
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keyHandler);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", keyHandler);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

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

  const onHandlePointerDown = (e: PointerEvent) => {
    dragStartY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandlePointerMove = (e: PointerEvent) => {
    if (dragStartY.current == null) return;
    const delta = Math.max(0, e.clientY - dragStartY.current);
    setDragOffset(delta);
  };
  const onHandlePointerUp = () => {
    if (dragOffset > 88) onClose();
    dragStartY.current = null;
    setDragOffset(0);
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
          onClick={onClose}
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

  return createPortal(
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div className="bottom-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        ref={sheetRef}
        className="bottom-sheet bottom-sheet--services"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={dragOffset ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        <div
          className="bottom-sheet__handle"
          role="presentation"
          aria-hidden="true"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        />
        <div className="bottom-sheet__head">
          <h2 id={titleId} className="bottom-sheet__title">مركز الخدمات</h2>
          <button
            type="button"
            onClick={onClose}
            className="bottom-sheet__close-btn"
            aria-label="إغلاق مركز الخدمات"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

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

        <div className="bottom-sheet__body">
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
        <div className="bottom-sheet__fade" aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}
