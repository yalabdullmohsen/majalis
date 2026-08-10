/**
 * provider-registry.ts
 * يختار أفضل مزوّد متاح فعليًا وقت التشغيل (القسم 13: العمل عند ضعف
 * الإنترنت). الأولوية مبنية على **التكلفة والكمون** لا الدقة النظرية
 * وحدها: جهازي أصلي (تطبيق iOS/Android، مجاني وبلا اتصال) ← متصفح (Web
 * Speech API — Chrome/Edge، مجاني وكمون شبه فوري عبر نتائج جزئية حيّة)
 * ← خادمي (Groq whisper-large-v3 عبر /api/recitation-transcribe،
 * بث شرائح ~400ms + VAD — يُختار **فقط** حين تفشل الخيارتان المجانيتان،
 * وهو تحديدًا سبب وجوده أصلاً: Safari لا يدعم Web Speech API) ← لا شيء
 * (حالة "غير متاح" صادقة، لا Mock خارج الاختبارات).
 *
 * استثناء: عند `preferTajweed=true` يُفضَّل المزوّد الخادمي إن كان متاحًا
 * لأنه الوحيد الذي يوفّر طوابع زمنية للكلمات (ملاحظات مدّ قابلة للقياس).
 */
import type { QuranASRProvider } from "./asr-provider";
import { OnDeviceQuranASRProvider } from "./providers/on-device-provider";
import { ServerQuranASRProvider } from "./providers/server-provider";
import { WebSpeechQuranASRProvider } from "./providers/web-speech-provider";

export type ProviderSelection = { provider: QuranASRProvider; reason: string } | { provider: null; reason: string };

export type SelectProviderOptions = {
  /** يطلب مزوّدًا يدعم ملاحظات تجويد زمنية (الخادم حاليًا). */
  preferTajweed?: boolean;
};

export async function selectBestProvider(
  isOnline: boolean,
  options: SelectProviderOptions = {},
): Promise<ProviderSelection> {
  const onDevice = new OnDeviceQuranASRProvider();
  const webSpeech = new WebSpeechQuranASRProvider();
  const server = new ServerQuranASRProvider();

  if (options.preferTajweed && isOnline) {
    const serverOk = await server.isAvailable();
    if (serverOk) {
      return {
        provider: server,
        reason: "مستوى إتقان التجويد — استخدام المزوّد الخادمي لطوابع زمنية قابلة للقياس (مدة المد)",
      };
    }
  }

  const onDeviceOk = await onDevice.isAvailable();
  if (onDeviceOk) {
    return {
      provider: onDevice,
      reason: isOnline
        ? "استخدام محرك التطبيق الأصلي (حفظ فقط، مجاني)"
        : "غير متصل — استخدام محرك التطبيق الأصلي (حفظ فقط، دقة محدودة دون اتصال)",
    };
  }

  const webSpeechOk = await webSpeech.isAvailable();
  if (webSpeechOk) {
    return { provider: webSpeech, reason: "استخدام التعرّف الصوتي في المتصفح (حفظ فقط، مجاني، كمون شبه فوري)" };
  }

  if (isOnline) {
    const serverOk = await server.isAvailable();
    if (serverOk) {
      return {
        provider: server,
        reason: "متصفحك لا يدعم Web Speech API (على الأرجح Safari) — استخدام المزوّد الخادمي كبديل (بث شرائح ~400ms + VAD)",
      };
    }
  }

  return {
    provider: null,
    reason: "لا يتوفر محرك تعرّف صوتي على هذا المتصفح/الجهاز — جرّب Chrome، أو تطبيق الجوال",
  };
}
