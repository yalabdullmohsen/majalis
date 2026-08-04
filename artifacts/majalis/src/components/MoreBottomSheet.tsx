import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Moon, Sun, X } from "lucide-react";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { isNavHrefActive } from "@/lib/nav-active";
import { MORE_SHEET_ITEMS } from "@/lib/sidebar-nav";
import "@/styles/components/more-bottom-sheet.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MoreBottomSheet({ open, onClose }: Props) {
  const [location] = useLocation();
  const { resolvedTheme, toggleDark } = useThemePreference();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const onSoonClick = (label: string) => {
    onClose();
    window.dispatchEvent(new CustomEvent("global-coming-soon-open", { detail: { title: label } }));
  };

  return createPortal(
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div className="bottom-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="المزيد"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__head">
          <span>المزيد</span>
          <button
            type="button"
            onClick={onClose}
            className="bottom-sheet__close-btn"
            aria-label="إغلاق القائمة"
          ><X size={18} strokeWidth={1.8} aria-hidden="true" /></button>
        </div>

        <div className="bottom-sheet__body">
          <button
            type="button"
            className="more-sheet-theme-toggle"
            onClick={toggleDark}
            aria-label={resolvedTheme === "dark" ? "التحويل إلى الوضع النهاري" : "التحويل إلى الوضع الليلي"}
          >
            <span className="more-sheet-theme-toggle__meta">
              {resolvedTheme === "dark"
                ? <Sun size={18} strokeWidth={1.8} aria-hidden="true" />
                : <Moon size={18} strokeWidth={1.8} aria-hidden="true" />}
              <span>{resolvedTheme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>
            </span>
            <span aria-hidden="true">{resolvedTheme === "dark" ? "الوضع الحالي: ليلي" : "الوضع الحالي: نهاري"}</span>
          </button>

          <div className="bottom-sheet__section">
            <p className="bottom-sheet__section-label">أقسام</p>
            <div className="bottom-sheet__grid">
              {MORE_SHEET_ITEMS.map(({ href, label, Icon }) => {
                const active = isNavHrefActive(location, href);
                const soon = isComingSoonPath(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={soon ? (e) => { e.preventDefault(); onSoonClick(label); } : onClose}
                    className={`more-sheet-item${active ? " more-sheet-item--active" : ""}${soon ? " more-sheet-item--soon" : ""}`}
                    aria-current={active ? "page" : undefined}
                    aria-label={soon ? `${label} — قريبًا` : label}
                  >
                    <span className="more-sheet-item__icon" aria-hidden="true">
                      <Icon size={20} strokeWidth={1.8} />
                    </span>
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
