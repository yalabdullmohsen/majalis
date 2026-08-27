import { Check } from "lucide-react";
import { createPortal } from "react-dom";

export type MushafThemeChoice = "auto" | "paper" | "sepia" | "night";

type Props = {
  open: boolean;
  theme: MushafThemeChoice;
  onTheme: (theme: MushafThemeChoice) => void;
  onClose: () => void;
};

/** إعدادات الصفحة — لوحة سفلية خفيفة بلا إعادة تحميل المصحف. */
export function MushafSettingsSheet({ open, theme, onTheme, onClose }: Props) {
  if (!open) return null;
  return createPortal(
    <div className="mm-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="mm-settings-title">
      <button type="button" className="mm-settings-sheet__scrim" aria-label="إغلاق الإعدادات" onClick={onClose} />
      <div className="mm-settings-sheet__panel">
        <header className="mm-settings-sheet__head">
          <h2 id="mm-settings-title">إعدادات الصفحة</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            إغلاق
          </button>
        </header>
        <section className="mm-settings-sheet__card">
          <h3>نوع المصحف</h3>
          <p className="mm-settings-sheet__row is-active">
            <span>المصحف</span>
            <Check size={18} aria-hidden="true" />
          </p>
        </section>
        <section className="mm-settings-sheet__card">
          <h3>اتجاه التمرير</h3>
          <p className="mm-settings-sheet__row is-active">
            <span>صفحة</span>
            <Check size={18} aria-hidden="true" />
          </p>
        </section>
        <section className="mm-settings-sheet__card">
          <h3>المظهر</h3>
          {(
            [
              ["auto", "تلقائي"],
              ["paper", "ورق"],
              ["sepia", "بيج دافئ"],
              ["night", "داكن"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`mm-settings-sheet__row${theme === id ? " is-active" : ""}`}
              onClick={() => onTheme(id)}
            >
              <span>{label}</span>
              {theme === id ? <Check size={18} aria-hidden="true" /> : null}
            </button>
          ))}
        </section>
      </div>
    </div>,
    document.body,
  );
}
