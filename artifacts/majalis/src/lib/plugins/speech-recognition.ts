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
  if (!cached) cached = registerPlugin<MajlisSpeechRecognitionPlugin>("MajlisSpeechRecognition");
  return cached;
}
