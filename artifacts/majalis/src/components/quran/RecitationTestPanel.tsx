/**
 * اختبار التلاوة — يستمع لصوت المستخدم عبر التعرف الصوتي الأصلي للمنصة
 * ويقارن ما تعرّف عليه بنص المرجع.
 */
import { useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";
import { useRecitationTest, hasRecitationConsent, grantRecitationConsent } from "@/hooks/useRecitationTest";
import { MicPermissionHelp } from "@/components/MicPermissionHelp";
import { isAndroid, isIOS, isNative } from "@/lib/capacitor-utils";

export function RecitationTestPanel({ referenceText, referenceLabel }: { referenceText: string; referenceLabel: string }) {
  const [consented, setConsented] = useState(hasRecitationConsent);
  const { state, transcript, result, start, stop, reset, audioLevel, errorMessage, statusLabel } =
    useRecitationTest(referenceText);

  if (!consented) {
    return (
      <div className="rtp-consent" role="note">
        <p className="rtp-consent__text">
          سيطلب التطبيق إذن الميكروفون لاختبار تلاوتك لـ{referenceLabel}. يُحوَّل
          صوتك إلى نص عبر خدمة التعرف الصوتي في جهازك (قد تُعالَج خارجيًا
          بحسب سياسة نظام التشغيل — Apple أو جوجل)، ثم تُقارَن النتيجة
          بالنص على جهازك مباشرة.{" "}
          <strong>لا يُسجَّل صوتك ولا يُرسَل أو يُخزَّن على خوادمنا مطلقًا.</strong>
        </p>
        <button
          type="button"
          className="rtp-consent__btn"
          onClick={() => { grantRecitationConsent(); setConsented(true); }}
        >
          أوافق، ابدأ الاختبار
        </button>
      </div>
    );
  }

  return (
    <div className="rtp-panel">
      {(state === "idle" || state === "ready") && (
        <button type="button" className="rtp-mic-btn" onClick={() => void start()}>
          <Mic size={16} aria-hidden="true" /> اختبر تلاوتك لـ{referenceLabel}
        </button>
      )}

      {state === "warming" && <p className="rtp-status" role="status">{statusLabel}</p>}
      {state === "requesting-permission" && <p className="rtp-status" role="status">{statusLabel}</p>}

      {state === "listening" && (
        <div className="rtp-listening">
          <button type="button" className="rtp-mic-btn rtp-mic-btn--active" onClick={() => void stop()}>
            <Square size={14} aria-hidden="true" /> استمع الآن… اضغط للإيقاف
          </button>
          <span
            className="rtp-audio-level"
            role="meter"
            aria-label="مستوى الصوت"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(audioLevel * 100)}
          >
            <span className="rtp-audio-level__fill" style={{ transform: `scaleX(${Math.max(0.05, audioLevel)})` }} />
          </span>
          {transcript ? (
            <p className="rtp-transcript" dir="rtl">{transcript}</p>
          ) : (
            <p className="rtp-status">استمع الآن — تظهر النتائج فور التعرّف</p>
          )}
        </div>
      )}

      {state === "processing" && <p className="rtp-status">جارٍ المقارنة…</p>}

      {state === "done" && result && (
        <div className="rtp-result">
          <p className="rtp-result__score">نسبة التطابق: {result.matchPercent}٪</p>
          <p className="rtp-result__words" dir="rtl">
            {result.words.map((w, i) => (
              <span key={i} className={`rtp-word${w.matched ? " rtp-word--ok" : " rtp-word--miss"}`}>
                {w.text}{" "}
              </span>
            ))}
          </p>
          <button type="button" className="rtp-retry-btn" onClick={reset}>
            <RotateCcw size={13} aria-hidden="true" /> إعادة المحاولة
          </button>
        </div>
      )}

      {state === "unsupported" && (
        <p className="rtp-status rtp-status--warn">اختبار التلاوة غير مدعوم على هذا الجهاز أو المتصفح حاليًا.</p>
      )}
      {state === "denied" && (
        <MicPermissionHelp
          inline
          isNative={isNative}
          isIOS={isIOS}
          isAndroid={isAndroid}
          onRetry={() => {
            reset();
            void start();
          }}
          title={errorMessage || "يحتاج التطبيق إذن الميكروفون للاستماع لتلاوتك"}
        />
      )}
      {(state === "error" || state === "no_audio") && (
        <div className="rtp-status rtp-status--warn" role="alert">
          <p>{errorMessage || (state === "no_audio" ? "لم يصل صوت من الميكروفون." : "حدث خطأ أثناء الاستماع.")}</p>
          <button type="button" className="rtp-retry-btn" onClick={() => { reset(); void start(); }}>
            <RotateCcw size={13} aria-hidden="true" /> إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
}
