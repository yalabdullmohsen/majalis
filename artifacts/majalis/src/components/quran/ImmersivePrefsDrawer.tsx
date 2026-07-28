/**
 * Gesture-triggered prefs drawer (Master Prompt §3 Silent Personalization):
 * font scale, dark/light paper, resume last page — no chrome clutter.
 */
import { createPortal } from "react-dom";
import { Moon, Sun, Type, X, Bookmark } from "lucide-react";
import {
  QURAN_FONT_MAX_PX,
  QURAN_FONT_MIN_PX,
  QURAN_FONT_STEP_PX,
} from "@/lib/quran-font-size";
import { IMMERSIVE_PAPER_BG } from "@/lib/quran-immersive";

export type ImmersivePrefsDrawerProps = {
  open: boolean;
  onClose: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  /** Quick resume — last page number if known. */
  lastPage?: number | null;
  onResumeLastPage?: () => void;
  paperBg?: string;
};

export function ImmersivePrefsDrawer({
  open,
  onClose,
  fontSize,
  onFontSizeChange,
  isDarkMode,
  onToggleDarkMode,
  lastPage,
  onResumeLastPage,
  paperBg = IMMERSIVE_PAPER_BG,
}: ImmersivePrefsDrawerProps) {
  if (!open) return null;

  const dec = () =>
    onFontSizeChange(Math.max(QURAN_FONT_MIN_PX, fontSize - QURAN_FONT_STEP_PX));
  const inc = () =>
    onFontSizeChange(Math.min(QURAN_FONT_MAX_PX, fontSize + QURAN_FONT_STEP_PX));

  const drawer = (
    <div className="immersive-prefs-overlay" role="presentation" onClick={onClose}>
      <aside
        className="immersive-prefs-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="إعدادات القراءة"
        style={{ backgroundColor: paperBg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="immersive-prefs-drawer__head">
          <h2 className="immersive-prefs-drawer__title">تخصيص القراءة</h2>
          <button
            type="button"
            className="immersive-prefs-drawer__close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="immersive-prefs-drawer__section">
          <p className="immersive-prefs-drawer__label">
            <Type size={16} aria-hidden="true" /> حجم الخط
          </p>
          <div className="immersive-prefs-drawer__font-row">
            <button type="button" onClick={dec} aria-label="تصغير الخط">
              −
            </button>
            <span>{fontSize}</span>
            <button type="button" onClick={inc} aria-label="تكبير الخط">
              +
            </button>
          </div>
          <input
            type="range"
            min={QURAN_FONT_MIN_PX}
            max={QURAN_FONT_MAX_PX}
            step={QURAN_FONT_STEP_PX}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            aria-label="شريط حجم الخط"
          />
        </div>

        <div className="immersive-prefs-drawer__section">
          <button
            type="button"
            className="immersive-prefs-drawer__row"
            onClick={onToggleDarkMode}
          >
            {isDarkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            <span>{isDarkMode ? "وضع نهاري" : "وضع ليلي"}</span>
          </button>
        </div>

        {lastPage != null && lastPage > 0 && onResumeLastPage ? (
          <div className="immersive-prefs-drawer__section">
            <button
              type="button"
              className="immersive-prefs-drawer__row"
              onClick={() => {
                onResumeLastPage();
                onClose();
              }}
            >
              <Bookmark size={18} aria-hidden="true" />
              <span>استئناف الصفحة {lastPage}</span>
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );

  if (typeof document === "undefined") return drawer;
  return createPortal(drawer, document.body);
}

export default ImmersivePrefsDrawer;
