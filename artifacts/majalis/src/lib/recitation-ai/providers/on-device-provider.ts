/**
 * on-device-provider.ts
 * يُغلّف الجسر الأصلي **القائم فعلاً** لـ"اختبر تلاوتك"
 * (ios/App/App/MajlisSpeechRecognitionPlugin.swift +
 * android/.../MajlisSpeechRecognitionPlugin.kt عبر
 * src/lib/plugins/speech-recognition.ts) كتنفيذ حقيقي لـQuranASRProvider
 * — هذا ليس Stub: يستدعي فعليًا SFSpeechRecognizer (iOS) أو
 * android.speech.SpeechRecognizer (أندرويد)، المُتحقَّق منهما ببناء
 * Xcode حقيقي (iOS) سابقًا هذه الجلسة (أندرويد بلا SDK للتحقق، موثَّق).
 *
 * القيود الصادقة لهذا المزوّد (تُحدِّد سلوك الواجهة، لا تُخفى):
 *   - `supportsTajweed = false` دومًا: SFSpeechRecognizer/SpeechRecognizer
 *     يُخرجان نصًا فقط، لا تحليلاً فونيميًا — لا قدرة تجويد أصلاً.
 *   - `capturesAudioInternally = true`: الصوت يُلتقَط ويُعالَج داخل
 *     الجسر الأصلي مباشرة (لا وصول لمقاطع PCM من جافاسكربت) — طبقة
 *     AudioCaptureService في المواصفة غير قابلة للتطبيق فعليًا على هذا
 *     المسار تحديدًا؛ `transcribeChunk` غير فعّالة هنا (موثَّق في asr-provider.ts).
 *   - النتائج نهائية فقط عند اكتمال الجملة (الجسر الحالي لا يُصدر كل
 *     كلمة منفردة فور استقرارها، بل يُصدر التفريغ الجزئي الكامل المتراكم
 *     في كل partialResults event) — onPartialWord هنا يُحوّل هذا لتدفّق
 *     "الفرق الجديد فقط" (الكلمات المُضافة منذ آخر تحديث) ليتوافق مع عقد
 *     "كلمة واحدة في كل مرة" المطلوب من VerseAlignmentEngine.feedWord.
 */
import { getSpeechRecognitionPlugin } from "@/lib/plugins/speech-recognition";
import type { ASRSession, AudioChunk, FinalResult, PartialResult, QuranASRProvider, RecitationConfig } from "../asr-provider";
import { ASRProviderUnavailableError } from "../asr-provider";

export class OnDeviceQuranASRProvider implements QuranASRProvider {
  readonly id = "on-device";
  readonly supportsStreaming = true;
  readonly supportsTajweed = false;
  readonly worksOffline = true;
  readonly capturesAudioInternally = true;

  private lastEmittedWordCount = new Map<string, number>();
  private pendingStart = new Map<string, Promise<{ matches?: string[] }>>();

  async isAvailable(): Promise<boolean> {
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) return false;
    try {
      const res = await plugin.available();
      return res.available;
    } catch {
      return false;
    }
  }

  async startSession(config: RecitationConfig): Promise<ASRSession> {
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) {
      throw new ASRProviderUnavailableError({ code: "UNAVAILABLE", message: "التعرّف الصوتي الأصلي غير متاح على هذه المنصة (ويب/غير مدعوم)." });
    }
    const perm = await plugin.requestPermissions();
    if (perm.speechRecognition !== "granted") {
      throw new ASRProviderUnavailableError({ code: "PERMISSION_DENIED", message: "لم يُمنح إذن الميكروفون/التعرّف الصوتي." });
    }
    const id = `on-device-${Date.now()}`;
    this.lastEmittedWordCount.set(id, 0);

    // start() لا يُحسَم (resolve) إلا عند stop() أو انتهاء التعرّف طبيعيًا
    // (راجع MajlisSpeechRecognitionPlugin.swift: finishPendingCall) — نُخزّن
    // الوعد هنا لتنتظره endSession() لاحقًا بدل استدعاء stop() وتوقّع
    // نتيجة منه مباشرة (stop() تُعيد void فقط، تُحسم فقط الوعد المعلَّق).
    const startPromise = plugin.start({ language: config.language, partialResults: true, popup: false, maxResults: 1 });
    this.pendingStart.set(id, startPromise);

    return { id, provider: this.id };
  }

  async transcribeChunk(_session: ASRSession, _chunk: AudioChunk): Promise<PartialResult | null> {
    return null; // capturesAudioInternally=true — راجع تعليق الملف أعلاه
  }

  // ⚠️ ثغرة معروفة غير مُعالَجة: الجسر الأصلي الحالي
  // (MajlisSpeechRecognitionPlugin.swift/.kt) يُصدر {matches: [string]}
  // فقط — بلا أي حقل ثقة (confidence) على الإطلاق، خلافًا لـWeb Speech
  // API. لذا `callback` هنا يُستدعى دومًا بـconfidence=undefined، فتصنيف
  // "غير واضح" (VerseAlignmentEngine) يبقى معطَّلاً بأمان لمستخدمي تطبيق
  // iOS/Android (يستمر السلوك بالجزم بالخطأ كما كان قبل هذه الميزة، لا
  // كسر ولا تراجع). إصلاح فعلي يتطلب تعديل الجسر الأصلي نفسه
  // (SFSpeechRecognizer على iOS يُوفّر confidence لكل segment فعليًا عبر
  // transcription.segments[].confidence؛ Android SpeechRecognizer يُوفّره
  // عبر EXTRA_CONFIDENCE_SCORES) — يحتاج بناء Xcode/cap sync للتحقق، وهو
  // مُقيَّد حاليًا في هذه الجلسة (راجع القيد القائم أعلى الجلسة).
  onPartialWord(session: ASRSession, callback: (word: string, atMs: number, confidence?: number) => void): () => void {
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) return () => {};

    let removed = false;
    let handle: { remove: () => void } | null = null;

    plugin
      .addListener("partialResults", (data) => {
        if (removed) return;
        const text = data.matches?.[0] ?? "";
        const words = text.split(/\s+/).filter(Boolean);
        const already = this.lastEmittedWordCount.get(session.id) ?? 0;
        const newWords = words.slice(already);
        this.lastEmittedWordCount.set(session.id, words.length);
        const now = Date.now();
        for (const w of newWords) callback(w, now, undefined);
      })
      .then((h) => {
        if (removed) h.remove();
        else handle = h;
      });

    return () => {
      removed = true;
      handle?.remove();
    };
  }

  async endSession(session: ASRSession): Promise<FinalResult> {
    const plugin = getSpeechRecognitionPlugin();
    this.lastEmittedWordCount.delete(session.id);
    const pending = this.pendingStart.get(session.id);
    this.pendingStart.delete(session.id);
    if (!plugin) return { fullText: "", words: [] };

    await plugin.stop(); // يُحسم وعد start() المعلَّق أعلاه
    const result = pending ? await pending : { matches: [] as string[] };
    const fullText = result.matches?.[0] ?? "";
    return { fullText, words: fullText.split(/\s+/).filter(Boolean) };
  }
}
