/**
 * Flutter `AIRecitationWidget` — speech_to_text (ar_SA) vs target verse,
 * accuracy % via progress bar. Reuses `useRecitationTest` (Web Speech / native).
 */
import { useState } from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
import {
  grantRecitationConsent,
  hasRecitationConsent,
  useRecitationTest,
} from "@/hooks/useRecitationTest";
import "@/styles/majlisilm-shell.css";

export type AIRecitationWidgetProps = {
  /** Target Quranic verse (Flutter comparison target). */
  targetVerse: string;
  label?: string;
  className?: string;
};

export function AIRecitationWidget({
  targetVerse,
  label = "اختبار التلاوة بالذكاء",
  className,
}: AIRecitationWidgetProps) {
  const [consented, setConsented] = useState(hasRecitationConsent);
  const { state, transcript, result, start, stop, reset } =
    useRecitationTest(targetVerse);

  if (!targetVerse.trim()) {
    return (
      <div className={`ai-recitation${className ? ` ${className}` : ""}`} dir="rtl">
        <p className="ai-recitation__hint">حدّد آية للبدء في اختبار التلاوة.</p>
      </div>
    );
  }

  if (!consented) {
    return (
      <div className={`ai-recitation ai-recitation--consent${className ? ` ${className}` : ""}`} dir="rtl">
        <h3 className="ai-recitation__title">{label}</h3>
        <p className="ai-recitation__hint">
          يستمع التطبيق لصوتك عبر التعرف الصوتي للجهاز (locale: ar_SA) ويقارن
          النص بالآية محليًا. لا يُرفع الصوت إلى خوادم المجلس.
        </p>
        <p className="ai-recitation__target" dir="rtl">
          {targetVerse}
        </p>
        <button
          type="button"
          className="ai-recitation__btn"
          onClick={() => {
            grantRecitationConsent();
            setConsented(true);
          }}
        >
          أوافق وأبدأ
        </button>
      </div>
    );
  }

  const accuracy = result?.matchPercent ?? 0;

  return (
    <div className={`ai-recitation${className ? ` ${className}` : ""}`} dir="rtl">
      <h3 className="ai-recitation__title">{label}</h3>
      <p className="ai-recitation__target">{targetVerse}</p>

      {state === "idle" || state === "unsupported" || state === "denied" || state === "error" ? (
        <button type="button" className="ai-recitation__btn" onClick={() => void start()}>
          <Mic size={16} aria-hidden="true" /> ابدأ الاستماع
        </button>
      ) : null}

      {state === "requesting-permission" ? (
        <p className="ai-recitation__hint">جارٍ طلب إذن الميكروفون…</p>
      ) : null}

      {state === "listening" ? (
        <div className="ai-recitation__live">
          <button type="button" className="ai-recitation__btn ai-recitation__btn--active" onClick={() => void stop()}>
            <Square size={14} aria-hidden="true" /> إيقاف الاستماع
          </button>
          {transcript ? <p className="ai-recitation__transcript">{transcript}</p> : null}
        </div>
      ) : null}

      {state === "processing" ? <p className="ai-recitation__hint">جارٍ حساب نسبة التطابق…</p> : null}

      {state === "done" && result ? (
        <div className="ai-recitation__result">
          <p className="ai-recitation__score">نسبة التطابق: {accuracy}٪</p>
          <div
            className="ai-recitation__bar"
            role="progressbar"
            aria-valuenow={accuracy}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="دقة التلاوة"
          >
            <span style={{ width: `${accuracy}%` }} />
          </div>
          {transcript ? <p className="ai-recitation__transcript">{transcript}</p> : null}
          <button type="button" className="ai-recitation__btn ai-recitation__btn--ghost" onClick={reset}>
            <RotateCcw size={14} aria-hidden="true" /> إعادة المحاولة
          </button>
        </div>
      ) : null}

      {state === "unsupported" ? (
        <p className="ai-recitation__hint" role="alert">
          التعرف الصوتي غير مدعوم في هذا المتصفح.
        </p>
      ) : null}
      {state === "denied" ? (
        <p className="ai-recitation__hint" role="alert">
          تم رفض إذن الميكروفون.
        </p>
      ) : null}
    </div>
  );
}

export default AIRecitationWidget;
