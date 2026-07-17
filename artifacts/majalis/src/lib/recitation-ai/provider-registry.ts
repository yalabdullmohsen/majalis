/**
 * provider-registry.ts
 * يختار أفضل مزوّد متاح فعليًا وقت التشغيل (القسم 13: العمل عند ضعف
 * الإنترنت). الأولوية: خادمي (أدق، يدعم التجويد) إن كان متصلاً ومُهيَّأ
 * ← جهازي (حفظ فقط، بلا إنترنت) ← لا شيء (تُعرض حالة "غير متاح" صادقة،
 * لا Mock أبدًا خارج الاختبارات — MockQuranASRProvider غير مُدرَج هنا عمدًا).
 */
import type { QuranASRProvider } from "./asr-provider";
import { OnDeviceQuranASRProvider } from "./providers/on-device-provider";
import { ServerQuranASRProvider } from "./providers/server-provider";

export type ProviderSelection = { provider: QuranASRProvider; reason: string } | { provider: null; reason: string };

export async function selectBestProvider(isOnline: boolean): Promise<ProviderSelection> {
  const server = new ServerQuranASRProvider();
  const onDevice = new OnDeviceQuranASRProvider();

  if (isOnline) {
    const serverOk = await server.isAvailable();
    if (serverOk) return { provider: server, reason: "متصل — المزوّد الخادمي (أعلى دقة، يدعم التجويد)" };
  }

  const onDeviceOk = await onDevice.isAvailable();
  if (onDeviceOk) {
    return {
      provider: onDevice,
      reason: isOnline
        ? "المزوّد الخادمي غير مُهيَّأ — استخدام المحرك الجهازي (حفظ فقط)"
        : "غير متصل — استخدام المحرك الجهازي (حفظ فقط، دقة محدودة دون اتصال)",
    };
  }

  return { provider: null, reason: "لا يتوفر أي مزوّد تعرّف صوتي على هذا الجهاز/المتصفح" };
}
