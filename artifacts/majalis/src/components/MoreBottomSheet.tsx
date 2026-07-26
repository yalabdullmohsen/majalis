import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useEffect, useMemo } from "react";
import { Moon, Sun, X } from "lucide-react";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { MORE_SHEET_SECTIONS } from "@/lib/more-sheet-sections";
import { matchesSectionHref, resolveActiveSectionHref } from "@/components/TopSectionBar";
import "@/styles/components/more-bottom-sheet.css";
import "@/styles/components/dark-emerald-menus.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MoreBottomSheet({ open, onClose }: Props) {
  const [location] = useLocation();
  const { resolvedTheme, toggleDark } = useThemePreference();
  const allHrefs = useMemo(
    () => MORE_SHEET_SECTIONS.flatMap((s) => s.items.map((i) => i.href)),
    [],
  );
  const activeHref = useMemo(
    () => resolveActiveSectionHref(location, allHrefs),
    [location, allHrefs],
  );

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

  return createPortal(
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر
    // داخل الورقة — مسارا وصول بديلان كاملان بلوحة المفاتيح.
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div className="bottom-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="قائمة التطبيق"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__head">
          <span>قائمة التطبيق</span>
          <button
            type="button"
            onClick={onClose}
            className="bottom-sheet__close-btn"
            aria-label="إغلاق"
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
            <span aria-hidden="true">{resolvedTheme === "dark" ? "مفعّل ليلي" : "مفعّل نهاري"}</span>
          </button>
          {MORE_SHEET_SECTIONS.map((section) => (
            <div key={section.group} className="bottom-sheet__section">
              <p className="bottom-sheet__section-label">
                {section.group}
              </p>
              <div className="bottom-sheet__grid">
                {section.items.map(({ href, label, Icon }) => {
                  const active = href === activeHref;
                  return (
                    <Link
                      key={`${section.group}:${href}`}
                      href={href}
                      onClick={onClose}
                      className={`more-sheet-item${active ? " more-sheet-item--active" : ""}`}
                      aria-current={active ? "page" : undefined}
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
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
