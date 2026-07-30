/**
 * واجهة JS للتعرف الصوتي الأصلي — iOS عبر إطار Speech من آبل
 * (ios/App/App/MajlisSpeechRecognitionPlugin.swift)، وأندرويد عبر
 * android.speech.SpeechRecognizer
 * (android/app/src/main/java/com/majlisilm/app/MajlisSpeechRecognitionPlugin.kt).
 *
 * مسار iOS السريع (2026-07-30):
 * - prepare() يسخّن AVAudioSession + المحرك عند فتح الصفحة
 * - start() يعيد استخدام الجلسة الدافئة ولا يعيد تفعيلها بالكامل
 * - أحداث latency / audioLevel / listeningState للواجهة والقياس
 */
import { registerPlugin } from "@capacitor/core";
import { isAndroid, isIOS, isNative } from "@/lib/capacitor-utils";

export interface SpeechRecognitionStartOptions {
  language?: string;
  partialResults?: boolean;
  maxResults?: number;
  popup?: boolean;
  /** iOS: تفضيل on-device دون فرضه إن لم يُدعم */
  preferOnDevice?: boolean;
}

export type SpeechPartialPayload = {
  matches: string[];
  isFinal?: boolean;
  /** كلمات المقطع الحالي إن وفّرها المحرك الأصلي */
  words?: string[];
  /** ثقة 0–100 لكل كلمة في words (نفس الترتيب) */
  confidences?: number[];
};

export type SpeechPermissionStatus = "granted" | "denied" | "prompt" | "restricted";

export type SpeechPermissionsResult = {
  /** مُجمَّع: granted فقط إن مُنح الكلام والميكروفون معًا */
  speechRecognition: SpeechPermissionStatus;
  speech?: SpeechPermissionStatus;
  microphone?: SpeechPermissionStatus;
};

export type SpeechLatencyEvent = {
  event: string;
  t?: number;
  ms?: number;
  msFromButton?: number;
  msFromTap?: number;
  msFromFirstBuffer?: number;
  cold?: boolean;
  sessionPrepared?: boolean;
};

export type SpeechAudioLevelEvent = { level: number };
export type SpeechListeningStateEvent = { state: "listening" | "idle" | "no_audio" | string };

/** رموز رفض مُصنَّفة من MajlisSpeechRecognitionPlugin (iOS) */
export type SpeechRecognitionErrorCode =
  | "RECOGNIZER_UNAVAILABLE"
  | "SPEECH_DENIED"
  | "SPEECH_NOT_DETERMINED"
  | "MICROPHONE_DENIED"
  | "MICROPHONE_NOT_DETERMINED"
  | "AUDIO_SESSION_FAILED"
  | "AUDIO_FORMAT_INVALID"
  | "ENGINE_START_FAILED"
  | "NO_SPEECH_DETECTED"
  | "NO_AUDIO_BUFFER"
  | "MEDIA_SERVICES_RESET"
  | "RECOGNITION_FAILED"
  | "NETWORK"
  | "SESSION_SUPERSEDED"
  | "UNKNOWN";

export class SpeechRecognitionError extends Error {
  readonly code: SpeechRecognitionErrorCode;

  constructor(code: SpeechRecognitionErrorCode, message: string) {
    super(message);
    this.name = "SpeechRecognitionError";
    this.code = code;
  }
}

export function classifySpeechPluginError(err: unknown): SpeechRecognitionError {
  if (err instanceof SpeechRecognitionError) return err;
  const e = err as { code?: string; message?: string; errorMessage?: string } | null;
  const rawCode = typeof e?.code === "string" ? e.code : "UNKNOWN";
  const message =
    (typeof e?.message === "string" && e.message) ||
    (typeof e?.errorMessage === "string" && e.errorMessage) ||
    (err instanceof Error ? err.message : "فشل التعرّف الصوتي");
  const known: SpeechRecognitionErrorCode[] = [
    "RECOGNIZER_UNAVAILABLE",
    "SPEECH_DENIED",
    "SPEECH_NOT_DETERMINED",
    "MICROPHONE_DENIED",
    "MICROPHONE_NOT_DETERMINED",
    "AUDIO_SESSION_FAILED",
    "AUDIO_FORMAT_INVALID",
    "ENGINE_START_FAILED",
    "NO_SPEECH_DETECTED",
    "NO_AUDIO_BUFFER",
    "MEDIA_SERVICES_RESET",
    "RECOGNITION_FAILED",
    "NETWORK",
    "SESSION_SUPERSEDED",
  ];
  const code = (known as string[]).includes(rawCode)
    ? (rawCode as SpeechRecognitionErrorCode)
    : "UNKNOWN";
  return new SpeechRecognitionError(code, message);
}

type RawSpeechPlugin = {
  available(options?: { language?: string }): Promise<{ available: boolean; onDevice?: boolean }>;
  requestPermissions(): Promise<SpeechPermissionsResult>;
  prepare?(options?: { language?: string }): Promise<{ ok: boolean; prepared?: boolean; prepareMs?: number; cold?: boolean }>;
  start(options?: SpeechRecognitionStartOptions): Promise<{ matches?: string[] }>;
  stop(): Promise<{ ok?: boolean } | void>;
  teardown?(): Promise<{ ok: boolean }>;
  addListener(
    eventName: "partialResults" | "latency" | "audioLevel" | "listeningState" | "audioSessionError" | "audioInterruption" | "audioRouteChange",
    listener: (data: Record<string, unknown>) => void,
  ): Promise<{ remove: () => void }>;
};

export interface MajlisSpeechRecognitionPlugin {
  available(options?: { language?: string }): Promise<{ available: boolean; onDevice?: boolean }>;
  requestPermissions(): Promise<SpeechPermissionsResult>;
  /** تسخين الجلسة والمحرك — يُستدعى عند فتح صفحة التسميع (iOS). */
  prepare(options?: { language?: string }): Promise<{ ok: boolean; prepared?: boolean; prepareMs?: number; cold?: boolean }>;
  start(options?: SpeechRecognitionStartOptions): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
  /** تحرير الجلسة الدافئة عند مغادرة الصفحة. */
  teardown(): Promise<void>;
  addListener(
    eventName: "partialResults",
    listener: (data: SpeechPartialPayload) => void,
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: "latency",
    listener: (data: SpeechLatencyEvent) => void,
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: "audioLevel",
    listener: (data: SpeechAudioLevelEvent) => void,
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: "listeningState",
    listener: (data: SpeechListeningStateEvent) => void,
  ): Promise<{ remove: () => void }>;
}

let cached: MajlisSpeechRecognitionPlugin | null = null;
let preparedLanguage: string | null = null;

/** يوقف تلاوة القرآن قبل التسميع لتفادي تعارض AVAudioSession. */
async function stopQuranPlaybackForRecitation(): Promise<void> {
  try {
    const { getAudioEngine } = await import("@/core/audio/AudioEngine");
    getAudioEngine().stop();
  } catch {
    /* غير متاح */
  }
  try {
    const { getMajlisAudioService } = await import("@/lib/majlis-audio-service");
    await getMajlisAudioService().stop();
  } catch {
    /* غير متاح */
  }
}

/** null على الويب أو خارج التطبيق الأصلي — مدعوم على iOS وأندرويد فقط. */
export function getSpeechRecognitionPlugin(): MajlisSpeechRecognitionPlugin | null {
  if (!isNative || !(isIOS || isAndroid)) return null;
  if (!cached) {
    const raw = registerPlugin<RawSpeechPlugin>("MajlisSpeechRecognition");
    cached = {
      available: (options) => raw.available(options),
      requestPermissions: () => raw.requestPermissions(),
      async prepare(options) {
        if (!isIOS || typeof raw.prepare !== "function") {
          return { ok: true, prepared: false };
        }
        const lang = options?.language ?? "ar-SA";
        try {
          await stopQuranPlaybackForRecitation();
          // مسار موحّد: Speech plugin يتولّى الفئة — نُبلّغ playback layer فقط
          const { ensureNativeRecordingAudioSession } = await import("@/lib/native-playback-audio");
          await ensureNativeRecordingAudioSession();
        } catch (err) {
          console.warn("[speech-recognition] prepare session:", err);
        }
        try {
          const res = await raw.prepare({ language: lang });
          preparedLanguage = lang;
          return res;
        } catch (err) {
          throw classifySpeechPluginError(err);
        }
      },
      addListener(eventName, listener) {
        return raw.addListener(eventName, listener as (data: Record<string, unknown>) => void);
      },
      async start(options) {
        await stopQuranPlaybackForRecitation();
        if (isIOS) {
          // إن لم يُجهَّز مسبقًا — جهّز بسرعة قبل start (أول تشغيل بعد cold)
          const lang = options?.language ?? "ar-SA";
          if (preparedLanguage !== lang && typeof raw.prepare === "function") {
            try {
              await this.prepare({ language: lang });
            } catch (prepErr) {
              console.warn("[speech-recognition] inline prepare:", prepErr);
            }
          } else {
            try {
              const { ensureNativeRecordingAudioSession } = await import("@/lib/native-playback-audio");
              await ensureNativeRecordingAudioSession();
            } catch (sessionErr) {
              console.warn("[speech-recognition] recording session:", sessionErr);
            }
          }
        }
        try {
          return await raw.start({
            ...options,
            partialResults: options?.partialResults ?? true,
            preferOnDevice: options?.preferOnDevice ?? true,
          });
        } catch (err) {
          throw classifySpeechPluginError(err);
        }
      },
      async stop() {
        try {
          await raw.stop();
        } catch (err) {
          throw classifySpeechPluginError(err);
        }
        // لا نُعطّل الجلسة هنا — نبقيها دافئة للتشغيل التالي؛ teardown عند مغادرة الصفحة
      },
      async teardown() {
        preparedLanguage = null;
        try {
          if (typeof raw.teardown === "function") {
            await raw.teardown();
          }
        } catch (err) {
          console.warn("[speech-recognition] teardown:", err);
        } finally {
          if (isIOS) {
            try {
              const { deactivateNativeAudioSession } = await import("@/lib/native-playback-audio");
              await deactivateNativeAudioSession();
            } catch (deactivateErr) {
              console.warn("[speech-recognition] deactivate session:", deactivateErr);
            }
          }
        }
      },
    };
  }
  return cached;
}

/** للاختبارات — إعادة ضبط الكاش. */
export function __resetSpeechRecognitionPluginCacheForTests(): void {
  cached = null;
  preparedLanguage = null;
}
