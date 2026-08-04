import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { seoNavLabel } from "@/lib/seo-nav-labels";
import {
  BookMarked, BookOpen, Brain, CalendarDays, MapPin, Moon, Scale, ScrollText,
  Settings, Sun, X,
} from "lucide-react";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { filterNavItems, isComingSoonPath } from "@/lib/nav-visibility";
import { isNavHrefActive } from "@/lib/nav-active";
import "@/styles/components/more-bottom-sheet.css";

type SheetItem = { href: string; label: string; Icon: typeof BookOpen };

/** قائمة «المزيد» المختصرة — عناصر ثانوية فقط (الشريط السفلي يحمل الرئيسية/القرآن/الصلاة/حسابي). */
const SHEET_SECTIONS_RAW: { group: string; items: SheetItem[] }[] = [
  { group: "أقسام", items: [
    { href: "/quran-knowledge", label: seoNavLabel("/quran-knowledge", "القرآن وعلومه"), Icon: BookMarked },
    { href: "/hadith", label: seoNavLabel("/hadith", "الحديث والسنة"), Icon: ScrollText },
    { href: "/fiqh", label: seoNavLabel("/fiqh", "الفقه والأحكام"), Icon: Scale },
    { href: "/memorization", label: seoNavLabel("/memorization", "الحفظ والمراجعة"), Icon: Brain },
    { href: "/occasions-lessons", label: seoNavLabel("/occasions-lessons", "المناسبات والدروس"), Icon: CalendarDays },
    { href: "/islamic-directory", label: seoNavLabel("/islamic-directory", "الدليل الإسلامي"), Icon: MapPin },
    { href: "/settings", label: seoNavLabel("/settings", "الإعدادات"), Icon: Settings },
  ]},
];

const SHEET_SECTIONS = SHEET_SECTIONS_RAW.map((section) => ({
  ...section,
  items: filterNavItems(section.items),
})).filter((section) => section.items.length > 0);

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
        aria-label="قائمة المزيد"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__head">
          <span>المزيد</span>
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
            <span aria-hidden="true">{resolvedTheme === "dark" ? "الوضع الحالي: ليلي" : "الوضع الحالي: نهاري"}</span>
          </button>
          {SHEET_SECTIONS.map((section) => (
            <div key={section.group} className="bottom-sheet__section">
              <p className="bottom-sheet__section-label">{section.group}</p>
              <div className="bottom-sheet__grid">
                {section.items.map(({ href, label, Icon }) => {
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
                      <span>
                        {label}
                        {soon ? <span className="nav-soon-badge">قريبًا</span> : null}
                      </span>
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
