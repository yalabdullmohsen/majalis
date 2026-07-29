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

export interface MajlisSpeechRecognitionPlugin {
  available(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<{ speechRecognition: "granted" | "denied" | "prompt" }>;
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
        return raw.start(options);
      },
      async stop() {
        await raw.stop();
        if (isIOS) {
          try {
            const { deactivateNativeAudioSession } = await import("@/lib/native-playback-audio");
            await deactivateNativeAudioSession();
          } catch (err) {
            console.warn("[speech-recognition] deactivate session:", err);
          }
        }
      },
    };
  }
  return cached;
}
