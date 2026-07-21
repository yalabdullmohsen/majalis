/**
 * provider-registry.ts
 * يختار أفضل مزوّد متاح فعليًا وقت التشغيل (القسم 13: العمل عند ضعف
 * الإنترنت). الأولوية مبنية على **التكلفة والكمون** لا الدقة النظرية
 * وحدها: جهازي أصلي (تطبيق iOS/Android، مجاني وبلا اتصال) ← متصفح (Web
 * Speech API — Chrome/Edge، مجاني وكمون شبه فوري عبر نتائج جزئية حيّة)
 * ← خادمي (Groq whisper-large-v3 عبر /api/recitation-transcribe،
 * مدفوع لكل استدعاء وكمون أعلى ~3 ثوانٍ لكل مقطع — يُختار **فقط** حين
 * تفشل الخيارتان المجانيتان، وهو تحديدًا سبب وجوده أصلاً: Safari
 * (سطح المكتب وiOS) لا يدعم Web Speech API إطلاقًا، فبدون هذا المزوّد
 * الخادمي تكون الميزة معطَّلة كليًا لزوار Safari عبر المتصفح لا التطبيق
 * المُثبَّت) ← لا شيء (تُعرض حالة "غير متاح" صادقة، لا Mock أبدًا خارج
 * الاختبارات — MockQuranASRProvider غير مُدرَج هنا عمدًا).
 */
import type { QuranASRProvider } from "./asr-provider";
import { OnDeviceQuranASRProvider } from "./providers/on-device-provider";
import { ServerQuranASRProvider } from "./providers/server-provider";
import { WebSpeechQuranASRProvider } from "./providers/web-speech-provider";

export type ProviderSelection = { provider: QuranASRProvider; reason: string } | { provider: null; reason: string };

export async function selectBestProvider(isOnline: boolean): Promise<ProviderSelection> {
  const onDevice = new OnDeviceQuranASRProvider();
  const webSpeech = new WebSpeechQuranASRProvider();
  const server = new ServerQuranASRProvider();

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
        reason: "متصفحك لا يدعم Web Speech API (على الأرجح Safari) — استخدام المزوّد الخادمي كبديل (كمون أعلى قليلًا، ~3 ثوانٍ لكل مقطع)",
      };
    }
  }

  return {
    provider: null,
    reason: "لا يتوفر محرك تعرّف صوتي على هذا المتصفح/الجهاز — جرّب Chrome، أو تطبيق الجوال",
  };
}
