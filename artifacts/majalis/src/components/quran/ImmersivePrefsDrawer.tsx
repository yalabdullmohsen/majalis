/**
 * Gesture-triggered prefs drawer (Master Prompt §3 Silent Personalization):
 * font scale, dark/light paper, resume last page — no chrome clutter.
 */
import { createPortal } from "react-dom";
import { Type, X, Bookmark } from "lucide-react";
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
  title?: string;
  fontMin?: number;
  fontMax?: number;
  fontStep?: number;
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
  title = "تخصيص القراءة",
  fontMin = QURAN_FONT_MIN_PX,
  fontMax = QURAN_FONT_MAX_PX,
  fontStep = QURAN_FONT_STEP_PX,
}: ImmersivePrefsDrawerProps) {
  if (!open) return null;

  const dec = () => onFontSizeChange(Math.max(fontMin, fontSize - fontStep));
  const inc = () => onFontSizeChange(Math.min(fontMax, fontSize + fontStep));

  const drawer = (
    <div className="immersive-prefs-overlay" role="presentation" onClick={onClose}>
      <aside
        className="immersive-prefs-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ backgroundColor: paperBg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="immersive-prefs-drawer__head">
          <h2 className="immersive-prefs-drawer__title">{title}</h2>
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
            <span>{Math.round(fontSize)}</span>
            <button type="button" onClick={inc} aria-label="تكبير الخط">
              +
            </button>
          </div>
          <input
            type="range"
            min={fontMin}
            max={fontMax}
            step={fontStep}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            aria-label="شريط حجم الخط"
            className="immersive-prefs-drawer__slider"
          />
        </div>

        <div className="immersive-prefs-drawer__section">
          <label className="immersive-prefs-drawer__switch">
            <span>الوضع الليلي</span>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={(e) => onToggleDarkMode()}
              aria-label="الوضع الليلي"
            />
          </label>
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
