/**
 * provider-registry.ts
 * يختار أفضل مزوّد متاح فعليًا وقت التشغيل (القسم 13: العمل عند ضعف
 * الإنترنت). الأولوية: خادمي (أدق، يدعم التجويد) إن كان متصلاً ومُهيَّأ
 * ← جهازي أصلي (تطبيق iOS/Android عبر Capacitor، حفظ فقط) ← متصفح
 * (Web Speech API — Chrome/Edge، حفظ فقط) ← لا شيء (تُعرض حالة "غير
 * متاح" صادقة، لا Mock أبدًا خارج الاختبارات — MockQuranASRProvider
 * غير مُدرَج هنا عمدًا).
 *
 * ⚠️ مهم: معظم زوار majlisilm.com يصلون عبر متصفح ويب (Chrome على
 * سطح المكتب أو الجوال) لا التطبيق الأصلي المُثبَّت — بدون
 * WebSpeechQuranASRProvider، الميزة لا تعمل فعليًا لأغلب الزوار.
 * Safari (سطح مكتب وiOS) لا يدعم Web Speech API إطلاقًا — سيظهر لهم
 * الرسالة الصادقة "غير متاح" ما لم يستخدموا تطبيق الجوال الأصلي.
 */
import type { QuranASRProvider } from "./asr-provider";
import { OnDeviceQuranASRProvider } from "./providers/on-device-provider";
import { ServerQuranASRProvider } from "./providers/server-provider";
import { WebSpeechQuranASRProvider } from "./providers/web-speech-provider";

export type ProviderSelection = { provider: QuranASRProvider; reason: string } | { provider: null; reason: string };

export async function selectBestProvider(isOnline: boolean): Promise<ProviderSelection> {
  const server = new ServerQuranASRProvider();
  const onDevice = new OnDeviceQuranASRProvider();
  const webSpeech = new WebSpeechQuranASRProvider();

  if (isOnline) {
    const serverOk = await server.isAvailable();
    if (serverOk) return { provider: server, reason: "متصل — المزوّد الخادمي (أعلى دقة، يدعم التجويد)" };
  }

  const onDeviceOk = await onDevice.isAvailable();
  if (onDeviceOk) {
    return {
      provider: onDevice,
      reason: isOnline
        ? "المزوّد الخادمي غير مُهيَّأ — استخدام محرك التطبيق الأصلي (حفظ فقط)"
        : "غير متصل — استخدام محرك التطبيق الأصلي (حفظ فقط، دقة محدودة دون اتصال)",
    };
  }

  const webSpeechOk = await webSpeech.isAvailable();
  if (webSpeechOk) {
    return { provider: webSpeech, reason: "استخدام التعرّف الصوتي في المتصفح (حفظ فقط)" };
  }

  return {
    provider: null,
    reason: "لا يتوفر محرك تعرّف صوتي على هذا المتصفح/الجهاز — جرّب Chrome، أو تطبيق الجوال",
  };
}
