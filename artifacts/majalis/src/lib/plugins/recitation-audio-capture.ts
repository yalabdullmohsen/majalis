/**
 * واجهة JS لجسر التقاط الصوت الخام (ios/App/App/RecitationAudioCapturePlugin.swift)
 * — بنفس نمط src/lib/plugins/speech-recognition.ts بالضبط.
 *
 * ⚠️ لا مستهلك فعلي حاليًا: يُستخدَم فقط حين يتصل مزوّد ASR خادمي حقيقي
 * (src/lib/recitation-ai/providers/server-provider.ts، حاليًا NOT_CONFIGURED
 * دومًا). الجسر الأصلي (Swift) مكتوب وغير مُختبَر ببناء Xcode فعليًا هذه
 * الجلسة. لا يوجد جانب أندرويد مقابل بعد (يُضاف عند توصيل مزوّد خادمي فعليًا).
 */
import { registerPlugin } from "@capacitor/core";
import { isIOS, isNative } from "@/lib/capacitor-utils";

export interface RecitationAudioCapturePlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  startCapture(): Promise<void>;
  stopCapture(): Promise<void>;
  addListener(
    eventName: "audioChunk",
    listener: (data: { pcm16Base64: string; atMs: number }) => void,
  ): Promise<{ remove: () => void }>;
}

let cached: RecitationAudioCapturePlugin | null = null;

/** null على الويب أو أندرويد أو خارج التطبيق الأصلي — iOS فقط حاليًا. */
export function getRecitationAudioCapturePlugin(): RecitationAudioCapturePlugin | null {
  if (!isNative || !isIOS) return null;
  if (!cached) cached = registerPlugin<RecitationAudioCapturePlugin>("RecitationAudioCapture");
  return cached;
}
