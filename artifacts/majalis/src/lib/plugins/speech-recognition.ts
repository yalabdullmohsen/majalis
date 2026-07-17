/**
 * واجهة JS للتعرف الصوتي الأصلي — iOS عبر إطار Speech من آبل
 * (ios/App/App/MajlisSpeechRecognitionPlugin.swift)، وأندرويد عبر
 * android.speech.SpeechRecognizer
 * (android/app/src/main/java/com/majlisilm/app/MajlisSpeechRecognitionPlugin.kt)
 * — بلا أي حزمة npm خارجية (الحزم المجتمعية المتاحة تعتمد CocoaPods فقط على
 * iOS، وهذا المشروع يستخدم Swift Package Manager حصرًا؛ راجع CapApp-SPM)،
 * بنفس نمط prayer-live-activity.ts الأصلي. كلا الجانبين ينفّذان نفس الواجهة
 * أدناه بالضبط.
 *
 * تنبيه: جانب أندرويد كُتب بلا Android SDK متاح للبناء/الاختبار في بيئة
 * التطوير التي أُنشئ فيها — يحتاج تحققًا فعليًا (gradle build + جهاز/محاكي)
 * قبل الوثوق به إنتاجيًا، خلافًا لجانب iOS المُتحقَّق منه ببناء Xcode حقيقي.
 */
import { registerPlugin } from "@capacitor/core";
import { isAndroid, isIOS, isNative } from "@/lib/capacitor-utils";

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

/** null على الويب أو خارج التطبيق الأصلي — مدعوم على iOS وأندرويد فقط. */
export function getSpeechRecognitionPlugin(): MajlisSpeechRecognitionPlugin | null {
  if (!isNative || !(isIOS || isAndroid)) return null;
  if (!cached) cached = registerPlugin<MajlisSpeechRecognitionPlugin>("MajlisSpeechRecognition");
  return cached;
}
