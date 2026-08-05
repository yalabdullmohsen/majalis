import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Brain, Moon, Settings, Sun, User, X } from "lucide-react";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { isNavHrefActive } from "@/lib/nav-active";
import { SIDEBAR_NAV_GROUPS } from "@/lib/sidebar-nav";
import "@/styles/components/more-bottom-sheet.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** مجموعات منظّمة لمركز الخدمات — ليست قائمة مسطّحة طويلة */
const MORE_GROUPS = SIDEBAR_NAV_GROUPS.filter((g) => g.id !== "quick" && g.id !== "account");

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
        className="bottom-sheet bottom-sheet--m2030"
        role="dialog"
        aria-modal="true"
        aria-label="المزيد"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__head">
          <span>مركز الخدمات</span>
          <button
            type="button"
            onClick={onClose}
            className="bottom-sheet__close-btn"
            aria-label="إغلاق القائمة"
          ><X size={18} strokeWidth={1.8} aria-hidden="true" /></button>
        </div>

        <div className="bottom-sheet__body">
          <div className="bottom-sheet__section">
            <p className="bottom-sheet__section-label">حساب وإعدادات</p>
            <div className="bottom-sheet__grid">
              <Link href="/my-learning" onClick={onClose} className="more-sheet-item" aria-label="حسابي">
                <span className="more-sheet-item__icon" aria-hidden="true"><User size={20} strokeWidth={1.8} /></span>
                <span>حسابي</span>
              </Link>
              <Link
                href="/memorize"
                onClick={onClose}
                className={`more-sheet-item${isNavHrefActive(location, "/memorize") ? " more-sheet-item--active" : ""}`}
                aria-label="الحفظ"
                aria-current={isNavHrefActive(location, "/memorize") ? "page" : undefined}
              >
                <span className="more-sheet-item__icon" aria-hidden="true"><Brain size={20} strokeWidth={1.8} /></span>
                <span>الحفظ</span>
              </Link>
              <Link href="/settings" onClick={onClose} className="more-sheet-item" aria-label="الإعدادات">
                <span className="more-sheet-item__icon" aria-hidden="true"><Settings size={20} strokeWidth={1.8} /></span>
                <span>الإعدادات</span>
              </Link>
              <button
                type="button"
                className="more-sheet-item more-sheet-theme-toggle"
                onClick={toggleDark}
                aria-label={resolvedTheme === "dark" ? "التحويل إلى الوضع النهاري" : "التحويل إلى الوضع الليلي"}
              >
                <span className="more-sheet-item__icon" aria-hidden="true">
                  {resolvedTheme === "dark"
                    ? <Sun size={18} strokeWidth={1.8} />
                    : <Moon size={18} strokeWidth={1.8} />}
                </span>
                <span>{resolvedTheme === "dark" ? "نهاري" : "ليلي"}</span>
              </button>
            </div>
          </div>

          {MORE_GROUPS.map((group) => (
            <div key={group.id} className="bottom-sheet__section">
              <p className="bottom-sheet__section-label">{group.title}</p>
              <div className="bottom-sheet__grid">
                {group.items.map(({ href, label, Icon }) => {
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
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
