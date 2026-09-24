import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { QuranSheetShell } from "./quran-sheet";
import { MushafDisplayModeControl } from "@/features/mushaf-reader/MushafDisplayModeControl";
import {
  MUSHAF_APPEARANCE_CHANGE_EVENT,
  loadMushafAppearanceMode,
  type MushafAppearanceMode,
} from "@/lib/mushaf-v2/appearance-prefs";
import { QuranSettingsRepository } from "@/lib/mushaf-v2/QuranSettingsRepository";

/** @deprecated استُبدل بـ SYSTEM/LIGHT/DARK — يُبقى للتوافق مع المستدعين القدامى */
export type MushafThemeChoice = "auto" | "paper" | "sepia" | "night" | "oled";
/** 0 = كشف · 1 = إخفاء جزئي · 2 = إخفاء كامل (اختبار حفظ) */
export type MushafHideLevel = 0 | 1 | 2;

type Props = {
  open: boolean;
  /** لم يعد يُستخدم للعرض — يُتجاهل لصالح Store المصحف */
  theme?: MushafThemeChoice;
  onTheme?: (theme: MushafThemeChoice) => void;
  hideLevel: MushafHideLevel;
  onHideLevel: (level: MushafHideLevel) => void;
  ayahMarks: boolean;
  onAyahMarks: (on: boolean) => void;
  onClose: () => void;
};

function choiceFromMode(mode: MushafAppearanceMode): MushafThemeChoice {
  if (mode === "DARK") return "night";
  if (mode === "LIGHT") return "paper";
  return "auto";
}

/** إعدادات المصحف — وضع العرض SYSTEM/LIGHT/DARK + أدوات الصفحة. */
export function MushafSettingsSheet({
  open,
  onTheme,
  hideLevel,
  onHideLevel,
  ayahMarks,
  onAyahMarks,
  onClose,
}: Props) {
  const [displayMode, setDisplayMode] = useState<MushafAppearanceMode>(() =>
    loadMushafAppearanceMode(),
  );

  useEffect(() => {
    if (!open) return;
    setDisplayMode(loadMushafAppearanceMode());
  }, [open]);

  useEffect(() => {
    const onChange = () => setDisplayMode(loadMushafAppearanceMode());
    window.addEventListener(MUSHAF_APPEARANCE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(MUSHAF_APPEARANCE_CHANGE_EVENT, onChange);
  }, []);

  const setMode = (mode: MushafAppearanceMode) => {
    QuranSettingsRepository.setAppearanceMode(mode);
    QuranSettingsRepository.applyAppearance(mode);
    setDisplayMode(mode);
    onTheme?.(choiceFromMode(mode));
  };

  return (
    <QuranSheetShell
      open={open}
      ariaLabel="إعدادات المصحف"
      title="إعدادات المصحف"
      titleId="mm-settings-title"
      onClose={onClose}
      snap="half"
      className="mm-settings-sheet"
      panelClassName="mm-settings-sheet__panel"
      zIndex={10000}
    >
      <div className="quran-sheet__body mm-settings-sheet__body">
        <section className="mm-settings-sheet__card quran-card">
          <MushafDisplayModeControl value={displayMode} onChange={setMode} />
        </section>
        <section className="mm-settings-sheet__card quran-card">
          <h3>نوع المصحف</h3>
          <p className="mm-settings-sheet__row quran-row is-active">
            <span>المصحف</span>
            <Check size={18} aria-hidden="true" />
          </p>
        </section>
        <section className="mm-settings-sheet__card quran-card">
          <h3>اتجاه التمرير</h3>
          <p className="mm-settings-sheet__row quran-row is-active">
            <span>صفحة</span>
            <Check size={18} aria-hidden="true" />
          </p>
        </section>
        <section className="mm-settings-sheet__card quran-card">
          <h3>علامات الآيات</h3>
          <p className="mm-settings-sheet__hint">
            تلوين هادئ لفاصلة الآية فقط (أربع درجات) — لا يغيّر نص القرآن. لا توجد بيانات وقف خارجية مخترعة.
          </p>
          <button
            type="button"
            className={`mm-settings-sheet__row quran-row${ayahMarks ? " is-active" : ""}`}
            onClick={() => onAyahMarks(!ayahMarks)}
            aria-pressed={ayahMarks}
          >
            <span>{ayahMarks ? "مفعّلة" : "متوقفة"}</span>
            {ayahMarks ? <Check size={18} aria-hidden="true" /> : null}
          </button>
        </section>
        <section className="mm-settings-sheet__card quran-card">
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
              className={`mm-settings-sheet__row quran-row${hideLevel === level ? " is-active" : ""}`}
              onClick={() => onHideLevel(level)}
            >
              <span>{label}</span>
              {hideLevel === level ? <Check size={18} aria-hidden="true" /> : null}
            </button>
          ))}
        </section>
      </div>
    </QuranSheetShell>
  );
}

export { MushafSettingsSheet as QuranSettingsSheet };
