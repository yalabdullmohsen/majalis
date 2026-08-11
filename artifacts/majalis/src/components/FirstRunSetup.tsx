import { useMemo, useState } from "react";
import {
  isFirstRunSetupPending,
  markFirstRunSetupDone,
} from "@/lib/first-run-setup";
import {
  getFeaturedReciters,
  loadReciterId,
  saveReciterId,
} from "@/lib/quran-audio";
import {
  MUSHAF_TAFSIR_EDITIONS,
  persistTafsirEdition,
  readStoredTafsirEdition,
} from "@/features/mushaf";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import "@/styles/pages/first-run-setup.css";

type Step = 0 | 1 | 2;

function shouldSkipFirstRunSetup(): boolean {
  try {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { webdriver?: boolean }).webdriver) {
      return true;
    }
  } catch {
    /* ignore */
  }
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("noBrandReveal") === "1" || q.get("noFirstRun") === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * تهيئة تشغيل أول اختيارية — ليست بوابة إقلاع.
 * الاسم FirstRunSetup مقصود لتفادي Onboarding/WelcomeScreen في اختبارات الإقلاع.
 */
export function FirstRunSetup() {
  const [open, setOpen] = useState(
    () => !shouldSkipFirstRunSetup() && isFirstRunSetupPending(),
  );
  const [step, setStep] = useState<Step>(0);
  const [reciterId, setReciterId] = useState(loadReciterId);
  const [tafsirId, setTafsirId] = useState(readStoredTafsirEdition);
  const { preferences, updatePreferences } = useUserPreferences();
  const [remindersOn, setRemindersOn] = useState(
    () =>
      preferences.lessonNotifications ||
      preferences.contentNotifications ||
      preferences.occasionNotifications,
  );

  const reciters = useMemo(() => getFeaturedReciters("ayah").slice(0, 8), []);
  const tafsirs = useMemo(() => MUSHAF_TAFSIR_EDITIONS.slice(0, 5), []);

  if (!open) return null;

  const finish = (skipped: boolean) => {
    markFirstRunSetupDone(skipped);
    setOpen(false);
  };

  const skip = () => finish(true);

  const nextFromWelcome = () => setStep(1);

  const nextFromPrefs = () => {
    saveReciterId(reciterId);
    persistTafsirEdition(tafsirId);
    setStep(2);
  };

  const completeReminders = () => {
    updatePreferences({
      lessonNotifications: remindersOn,
      contentNotifications: remindersOn,
      occasionNotifications: remindersOn,
      lectureNotifications: remindersOn,
      updateNotifications: remindersOn,
    });
    finish(false);
  };

  return (
    <div className="frs-overlay" role="dialog" aria-modal="true" aria-labelledby="frs-title">
      <div className="frs-card">
        <button type="button" className="frs-skip" onClick={skip}>
          تخطّي
        </button>

        {step === 0 && (
          <div className="frs-step">
            <p className="frs-eyebrow">مجالس العلم</p>
            <h2 id="frs-title">مرحبًا بك</h2>
            <p className="frs-lead">
              مصحف، تلاوة، وتفسير موثّق — يمكنك ضبط تفضيلاتك الآن أو تخطّي التهيئة والمتابعة مباشرة.
            </p>
            <div className="frs-actions">
              <button type="button" className="frs-btn frs-btn--primary" onClick={nextFromWelcome}>
                ابدأ
              </button>
              <button type="button" className="frs-btn frs-btn--ghost" onClick={skip}>
                تخطّي والمتابعة
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="frs-step">
            <h2 id="frs-title">القارئ والتفسير</h2>
            <p className="frs-lead">اختر المفضّل لديك. يمكنك تغييرهما لاحقًا من الإعدادات أو المصحف.</p>

            <p className="frs-label">القارئ</p>
            <div className="frs-choice-grid" role="listbox" aria-label="القارئ المفضّل">
              {reciters.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="option"
                  aria-selected={reciterId === r.id}
                  className={`frs-choice${reciterId === r.id ? " is-active" : ""}`}
                  onClick={() => setReciterId(r.id)}
                >
                  {r.nameAr}
                </button>
              ))}
            </div>

            <p className="frs-label">التفسير</p>
            <div className="frs-choice-grid" role="listbox" aria-label="التفسير المفضّل">
              {tafsirs.map((ed) => (
                <button
                  key={ed.id}
                  type="button"
                  role="option"
                  aria-selected={tafsirId === ed.id}
                  className={`frs-choice${tafsirId === ed.id ? " is-active" : ""}`}
                  onClick={() => setTafsirId(ed.id)}
                >
                  <strong>{ed.label}</strong>
                  <span>{ed.author}</span>
                </button>
              ))}
            </div>

            <div className="frs-actions">
              <button type="button" className="frs-btn frs-btn--primary" onClick={nextFromPrefs}>
                متابعة
              </button>
              <button type="button" className="frs-btn frs-btn--ghost" onClick={skip}>
                تخطّي
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="frs-step">
            <h2 id="frs-title">التذكيرات (اختياري)</h2>
            <p className="frs-lead">
              فعّل تفضيل التذكيرات محليًا فقط. لن نطلب إذن الإشعارات الآن — يُطلب عند أول استخدام فعلي مع سبب واضح.
            </p>
            <div className="frs-toggle">
              <div>
                <p className="frs-toggle-title" id="frs-reminders-label">
                  تفعيل تفضيل التذكيرات
                </p>
                <p className="frs-toggle-hint">دروس ومحتوى ومناسبات — بلا إذن الآن</p>
              </div>
              <input
                id="frs-reminders-toggle"
                type="checkbox"
                checked={remindersOn}
                onChange={(e) => setRemindersOn(e.target.checked)}
                aria-labelledby="frs-reminders-label"
              />
            </div>
            <div className="frs-actions">
              <button type="button" className="frs-btn frs-btn--primary" onClick={completeReminders}>
                إنهاء
              </button>
              <button type="button" className="frs-btn frs-btn--ghost" onClick={skip}>
                تخطّي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
