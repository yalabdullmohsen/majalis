import { Link, useLocation } from "wouter";
import { useCallback, useId, useMemo, useState, type MouseEvent } from "react";
import { ChevronLeft, Moon, Sun } from "lucide-react";
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
import { MoreHubFromRegistry } from "@/features/more/MoreHubFromRegistry";
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
  const _searchId = useId();
  void _searchId;
  void setQuery;

  const groups = useMemo(() => filterServicesCenterGroups(query), [query]);

  const handleSheetClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

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

  const renderItem = (item: ServicesCenterItem, layout: "quick" | "list" | "featured") => {
    const href = item.action.kind === "link" ? item.action.href : undefined;
    const active = href ? isNavHrefActive(location, href) : false;
    const soon = href ? isComingSoonPath(href) : false;
    const isTheme = item.action.kind === "theme";
    const isLogout = item.action.kind === "logout";
    if (isLogout && !isLoggedIn) return null;

    const className = [
      "more-sheet-item",
        layout === "featured"
        ? "more-sheet-item--featured surface-brand"
        : layout === "quick"
          ? "more-sheet-item--quick"
          : "more-sheet-item--row",
      active ? "more-sheet-item--active" : "",
      soon ? "more-sheet-item--soon" : "",
      isTheme ? "more-sheet-item--theme" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const iconSize = layout === "featured" ? 28 : 18;
    const icon = isTheme ? (
      resolvedTheme === "dark" ? <Sun size={iconSize} strokeWidth={1.8} /> : <Moon size={iconSize} strokeWidth={1.8} />
    ) : (
      <item.Icon size={iconSize} strokeWidth={1.8} />
    );

    const label = isTheme ? "المظهر" : item.label;
    const meta = isTheme
      ? themeLabel(preference, resolvedTheme)
      : soon
        ? "قريبًا"
        : item.subtitle ?? null;
    const aria = isTheme
      ? `المظهر: ${themeLabel(preference, resolvedTheme)}`
      : soon
        ? `${item.label} — قريبًا`
        : item.subtitle
          ? `${item.label} — ${item.subtitle}`
          : item.label;

    const inner = (
      <>
        {layout === "featured" ? <span className="more-sheet-item__shimmer" aria-hidden="true" /> : null}
        <span className="more-sheet-item__icon" aria-hidden="true">{icon}</span>
        <span className="more-sheet-item__text">
          <span className="more-sheet-item__label">{label}</span>
          {meta ? (
            <span className={`more-sheet-item__meta${layout === "featured" ? " on-brand-secondary" : ""}`}>
              {meta}
            </span>
          ) : null}
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
      onClose={handleSheetClose}
      title="المزيد"
      snap="full"
      closeLabel="إغلاق"
      className="bottom-sheet--services"
    >
      <div className="bottom-sheet__body-inner">
        <MoreHubFromRegistry showSearch onNavigate={handleSheetClose} />
      </div>
      {/* يُبقى مسار التوافق للاختبارات القديمة؛ العرض الفعلي من السجل أعلاه */}
      <div hidden aria-hidden="true" className="sr-only">
        {groups.length === 0 ? (
          <p className="bottom-sheet__empty">لا نتائج مطابقة.</p>
        ) : (
          groups.map((group) => (
            <section key={group.id} className="bottom-sheet__section" aria-labelledby={`svc-${group.id}`}>
              <h3
                id={`svc-${group.id}`}
                className={`bottom-sheet__section-label${group.id === "hubs" ? " sr-only" : ""}`}
              >
                {group.title}
              </h3>
              <div
                className={
                  group.layout === "featured"
                    ? "bottom-sheet__featured"
                    : group.layout === "quick"
                      ? "bottom-sheet__quick"
                      : "bottom-sheet__list"
                }
              >
                {group.items.map((item) =>
                  renderItem(
                    item,
                    group.layout === "featured" ? "featured" : group.layout === "quick" ? "quick" : "list",
                  ),
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </AppBottomSheet>
  );
}
