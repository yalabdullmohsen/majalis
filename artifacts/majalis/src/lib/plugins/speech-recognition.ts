/**
 * واجهة JS للتعرف الصوتي الأصلي (iOS فقط حاليًا، عبر إطار Speech من آبل).
 * التنفيذ الفعلي في ios/App/App/MajlisSpeechRecognitionPlugin.swift — بلا أي
 * حزمة npm خارجية (الحزم المجتمعية المتاحة تعتمد CocoaPods فقط، وهذا المشروع
 * يستخدم Swift Package Manager حصرًا؛ راجع CapApp-SPM)، بنفس نمط
 * prayer-live-activity.ts الأصلي.
 */
import { registerPlugin } from "@capacitor/core";
import { isIOS, isNative } from "@/lib/capacitor-utils";

export interface SpeechRecognitionStartOptions {
  language?: string;
  partialResults?: boolean;
  maxResults?: number;
  popup?: boolean;
}

export interface MajlisSpeechRecognitionPlugin {
  available(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<{ speechRecognition: "granted" | "denied" | "prompt" }>;
  start(options?: SpeechRecognitionStartOptions): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
  addListener(
    eventName: "partialResults",
    listener: (data: { matches: string[] }) => void,
  ): Promise<{ remove: () => void }>;
}

let cached: MajlisSpeechRecognitionPlugin | null = null;

/** null على الويب أو أندرويد أو خارج التطبيق الأصلي — لا دعم حاليًا إلا على iOS. */
export function getSpeechRecognitionPlugin(): MajlisSpeechRecognitionPlugin | null {
  if (!isNative || !isIOS) return null;
  if (!cached) cached = registerPlugin<MajlisSpeechRecognitionPlugin>("MajlisSpeechRecognition");
  return cached;
}
