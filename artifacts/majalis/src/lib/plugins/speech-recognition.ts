/**
 * واجهة JS للتعرف الصوتي الأصلي — iOS عبر إطار Speech من آبل
 * (ios/App/App/MajlisSpeechRecognitionPlugin.swift)، وأندرويد عبر
 * android.speech.SpeechRecognizer
 * (android/app/src/main/java/com/majlisilm/app/MajlisSpeechRecognitionPlugin.kt).
 */
import { registerPlugin } from "@capacitor/core";
import { isAndroid, isIOS, isNative } from "@/lib/capacitor-utils";

export interface SpeechRecognitionStartOptions {
  language?: string;
  partialResults?: boolean;
  maxResults?: number;
  popup?: boolean;
}

export type SpeechPartialPayload = {
  matches: string[];
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

export interface MajlisSpeechRecognitionPlugin {
  available(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<SpeechPermissionsResult>;
  start(options?: SpeechRecognitionStartOptions): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
  addListener(
    eventName: "partialResults",
    listener: (data: SpeechPartialPayload) => void,
  ): Promise<{ remove: () => void }>;
}

let cached: MajlisSpeechRecognitionPlugin | null = null;

/** null على الويب أو خارج التطبيق الأصلي — مدعوم على iOS وأندرويد فقط. */
export function getSpeechRecognitionPlugin(): MajlisSpeechRecognitionPlugin | null {
  if (!isNative || !(isIOS || isAndroid)) return null;
  if (!cached) {
    const raw = registerPlugin<MajlisSpeechRecognitionPlugin>("MajlisSpeechRecognition");
    cached = {
      available: () => raw.available(),
      requestPermissions: () => raw.requestPermissions(),
      addListener: (eventName, listener) => raw.addListener(eventName, listener),
      async start(options) {
        if (isIOS) {
          const { ensureNativeRecordingAudioSession } = await import("@/lib/native-playback-audio");
          await ensureNativeRecordingAudioSession();
        }
        try {
          return await raw.start(options);
        } catch (err) {
          throw classifySpeechPluginError(err);
        }
      },
      async stop() {
        try {
          await raw.stop();
        } catch (err) {
          throw classifySpeechPluginError(err);
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
