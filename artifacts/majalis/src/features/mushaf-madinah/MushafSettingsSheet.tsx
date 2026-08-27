import { Check } from "lucide-react";
import { createPortal } from "react-dom";

export type MushafThemeChoice = "auto" | "paper" | "sepia" | "night" | "oled";
/** 0 = كشف · 1 = إخفاء جزئي · 2 = إخفاء كامل (اختبار حفظ) */
export type MushafHideLevel = 0 | 1 | 2;

type Props = {
  open: boolean;
  theme: MushafThemeChoice;
  onTheme: (theme: MushafThemeChoice) => void;
  hideLevel: MushafHideLevel;
  onHideLevel: (level: MushafHideLevel) => void;
  onClose: () => void;
};

/** إعدادات الصفحة — لوحة سفلية خفيفة بلا إعادة تحميل المصحف. */
export function MushafSettingsSheet({
  open,
  theme,
  onTheme,
  hideLevel,
  onHideLevel,
  onClose,
}: Props) {
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
              ["oled", "أسود OLED"],
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
        <section className="mm-settings-sheet__card">
          <h3>اختبار الحفظ</h3>
          <p className="mm-settings-sheet__hint">
            أخفِ كلمات الآية أو الآية كاملة، ثم انقر للكشف أثناء المراجعة.
          </p>
          {(
            [
              [0, "عرض الكل"],
              [1, "إخفاء جزئي"],
              [2, "إخفاء كامل"],
            ] as const
          ).map(([level, label]) => (
            <button
              key={level}
              type="button"
              className={`mm-settings-sheet__row${hideLevel === level ? " is-active" : ""}`}
              onClick={() => onHideLevel(level)}
            >
              <span>{label}</span>
              {hideLevel === level ? <Check size={18} aria-hidden="true" /> : null}
            </button>
          ))}
        </section>
      </div>
    </div>,
    document.body,
  );
}
