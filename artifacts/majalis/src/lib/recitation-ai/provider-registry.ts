/**
 * provider-registry.ts
 * يختار أفضل مزوّد متاح فعليًا وقت التشغيل (القسم 13: العمل عند ضعف
 * الإنترنت). الأولوية:
 *   1) جهازي أصلي (Capacitor) — مجاني ومحلي
 *   2) WebSocket ASR إن ضُبط VITE_RECITATION_WS_URL (Deepgram/بوابة خاصة)
 *   3) مزوّد الخادم Groq whisper (ذكاء اصطناعي حقيقي — Safari/Chrome/PWA)
 *   4) Web Speech API كاحتياط أخير فقط (دقة ضعيفة مع النص القرآني)
 *
 * استثناء: عند `preferTajweed=true` يُفضَّل WebSocket ثم الخادمي إن وُفّرا
 * لطوابع زمنية قابلة للقياس.
 */
import type { QuranASRProvider } from "./asr-provider";
import { OnDeviceQuranASRProvider } from "./providers/on-device-provider";
import { ServerQuranASRProvider } from "./providers/server-provider";
import { WebSocketQuranASRProvider } from "./providers/websocket-provider";
import { WebSpeechQuranASRProvider } from "./providers/web-speech-provider";

export type ProviderSelection = { provider: QuranASRProvider; reason: string } | { provider: null; reason: string };

export type SelectProviderOptions = {
  /** يطلب مزوّدًا يدعم ملاحظات تجويد زمنية (الخادم / WebSocket). */
  preferTajweed?: boolean;
};

export async function selectBestProvider(
  isOnline: boolean,
  options: SelectProviderOptions = {},
): Promise<ProviderSelection> {
  const onDevice = new OnDeviceQuranASRProvider();
  const webSocket = new WebSocketQuranASRProvider();
  const webSpeech = new WebSpeechQuranASRProvider();
  const server = new ServerQuranASRProvider();

  if (options.preferTajweed && isOnline) {
    if (await webSocket.isAvailable()) {
      return {
        provider: webSocket,
        reason: "مستوى إتقان التجويد — بث WebSocket فوري مع طوابع زمنية عند توفّرها",
      };
    }
    if (await server.isAvailable()) {
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

  if (isOnline && (await webSocket.isAvailable())) {
    return {
      provider: webSocket,
      reason: "بث صوتي فوري عبر WebSocket (شرائح ~250ms + VAD) إلى بوابة ASR مُهيَّأة",
    };
  }

  // الذكاء الاصطناعي الخادمي قبل Web Speech — مطابقة أفضل للنص القرآني.
  if (isOnline && (await server.isAvailable())) {
    return {
      provider: server,
      reason: "تسميع بالذكاء الاصطناعي عبر المزوّد الخادمي (شرائح قصيرة + مطابقة لحظية)",
    };
  }

  const webSpeechOk = await webSpeech.isAvailable();
  if (webSpeechOk) {
    return {
      provider: webSpeech,
      reason: "احتياط: التعرّف الصوتي في المتصفح (دقة محدودة مع النص القرآني)",
    };
  }

  return {
    provider: null,
    reason: "لا يتوفر محرك تعرّف صوتي على هذا المتصفح/الجهاز — جرّب Chrome، أو تطبيق الجوال، أو تأكد من الاتصال",
  };
}
