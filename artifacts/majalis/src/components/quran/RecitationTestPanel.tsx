/**
 * اختبار التلاوة — يستمع لصوت المستخدم عبر التعرف الصوتي الأصلي للمنصة
 * ويقارن ما تعرّف عليه بنص المرجع (سورة كاملة الآن، لا آية واحدة محدَّدة
 * — راجع ExploreAyahPanel.tsx)، بلا أي رفع للصوت أو النص إلى خوادم مجالس
 * (راجع useRecitationTest.ts لتفاصيل المعالجة والخصوصية).
 *
 * ⚠️ نطاق النص المرجعي مفتوح لأي سورة كاملة الآن (كان مقصورًا على آية
 * واحدة فقط)، لكن حدًا تقنيًا صادقًا يبقى قائمًا: الاستماع عبر Web Speech
 * API/المكوّن الأصلي جلسة واحدة قد تتوقف تلقائيًا بعد سكتة قصيرة بين
 * الآيات على بعض المتصفحات رغم تفعيل continuous — للتسميع الكامل الموثوق
 * لسورة طويلة استُخدِم محرك "اختبار التسميع بالذكاء الاصطناعي" المخصص
 * (/quran/recitation-test-ai) المبني خصيصًا لجلسات طويلة متعددة الآيات؛
 * هذه لوحة "فحص سريع" مصاحبة، لا بديلًا عنه.
 */
import { useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";
import { useRecitationTest, hasRecitationConsent, grantRecitationConsent } from "@/hooks/useRecitationTest";

export function RecitationTestPanel({ referenceText, referenceLabel }: { referenceText: string; referenceLabel: string }) {
  const [consented, setConsented] = useState(hasRecitationConsent);
  const { state, transcript, result, start, stop, reset } = useRecitationTest(referenceText);

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
      {state === "idle" && (
        <button type="button" className="rtp-mic-btn" onClick={start}>
          <Mic size={16} aria-hidden="true" /> اختبر تلاوتك لـ{referenceLabel}
        </button>
      )}

      {state === "requesting-permission" && <p className="rtp-status">جارٍ طلب إذن الميكروفون…</p>}

      {state === "listening" && (
        <div className="rtp-listening">
          <button type="button" className="rtp-mic-btn rtp-mic-btn--active" onClick={stop}>
            <Square size={14} aria-hidden="true" /> استمع الآن… اضغط للإيقاف
          </button>
          {transcript && <p className="rtp-transcript" dir="rtl">{transcript}</p>}
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
        <p className="rtp-status rtp-status--warn">لم يُمنح إذن الميكروفون. فعّله من إعدادات الجهاز لاستخدام هذه الميزة.</p>
      )}
      {state === "error" && (
        <p className="rtp-status rtp-status--warn">حدث خطأ أثناء الاستماع. حاول مجددًا.</p>
      )}
    </div>
  );
}
