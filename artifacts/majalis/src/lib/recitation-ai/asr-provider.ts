/**
 * asr-provider.ts
 * واجهة QuranASRProvider القابلة للتبديل (القسم 5) — لا يُربَط أي جزء من
 * الواجهة أو محرك المحاذاة بمزود واحد. ثلاثة تنفيذات في providers/:
 *   - mock-provider.ts: للاختبارات الآلية فقط، لا يظهر للمستخدم أبدًا.
 *   - on-device-provider.ts: يُغلّف الجسر الأصلي القائم فعلاً
 *     (MajlisSpeechRecognitionPlugin.swift/.kt عبر
 *     src/lib/plugins/speech-recognition.ts) — يعمل بلا اتصال، مستوى
 *     "حفظ فقط" فقط (supportsTajweed=false).
 *   - server-provider.ts: **غير موصول فعليًا بأي نموذج حقيقي في هذه
 *     الجلسة** — واجهة صادقة تُعيد خطأ NOT_CONFIGURED بدل نتائج وهمية
 *     (القسم 14: "ممنوع تسليم تجربة شكلية"). راجع التقرير النهائي لسبب
 *     عدم التوصيل وما يلزم لتفعيله.
 *
 * ⚠️ ملاحظة معمارية: الوصف في القسم 5 يفترض نموذج "غذّ مقاطع PCM يدويًا"
 * (transcribeChunk) يناسب مزودًا خادميًا يستقبل صوتًا خامًا مُلتقَطًا
 * خارجيًا. لكن الجسر الأصلي القائم فعلاً لـ"حفظ فقط" (OnDeviceProvider)
 * يلتقط الصوت **داخليًا** عبر AVAudioEngine/SFSpeechRecognizer ولا يقبل
 * مقاطع مُغذَّاة يدويًا — فأُضيف حقل `capturesAudioInternally`: إن كان
 * true، يُستخدَم `onPartialWord` بدل `transcribeChunk` (الذي يُصبح no-op
 * موثَّق). هذا تكييف عملي واعٍ لواقع البنية القائمة، لا انحرافًا عشوائيًا
 * عن القسم 5.
 */
import type { PrecisionLevel } from "./types";

export type AudioChunk = { pcm16Mono16k: ArrayBuffer; atMs: number };

export type RecitationConfig = {
  language: string; // 'ar-SA'
  precisionLevel: PrecisionLevel;
};

export type ASRSession = {
  id: string;
  provider: string;
};

export type PartialResult = { text: string; isFinal: boolean; atMs: number };
export type FinalResult = { fullText: string; words: string[] };

export type ASRProviderError = { code: "NOT_CONFIGURED" | "UNAVAILABLE" | "PERMISSION_DENIED" | "NETWORK" | "UNKNOWN"; message: string };

export class ASRProviderUnavailableError extends Error {
  constructor(public readonly detail: ASRProviderError) {
    super(detail.message);
    this.name = "ASRProviderUnavailableError";
  }
}

export interface QuranASRProvider {
  readonly id: string;
  readonly supportsStreaming: boolean;
  readonly supportsTajweed: boolean;
  readonly worksOffline: boolean;
  /** true إن كان المزوّد يلتقط الصوت داخليًا (لا يقبل transcribeChunk يدويًا). */
  readonly capturesAudioInternally: boolean;

  isAvailable(): Promise<boolean>;
  startSession(config: RecitationConfig): Promise<ASRSession>;
  /** لا تأثير فعليًا إن كان capturesAudioInternally=true (موثَّق، لا خطأ صامت). */
  transcribeChunk(session: ASRSession, chunk: AudioChunk): Promise<PartialResult | null>;
  /** يُستدعى فقط حين capturesAudioInternally=true — كلمة واحدة مستقرة في كل مرة. */
  onPartialWord?(session: ASRSession, callback: (word: string, atMs: number) => void): () => void;
  endSession(session: ASRSession): Promise<FinalResult>;
}
