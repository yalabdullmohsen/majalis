/**
 * web-speech-provider.ts
 * مزوّد يستخدم Web Speech API القياسي في المتصفح (Chrome/Edge عبر
 * `webkitSpeechRecognition` — Safari وFirefox لا يدعمانها إطلاقًا، تُكتشَف
 * الحالة بأمان عبر isAvailable()) — **حقيقي يعمل فعليًا**، ليس Stub.
 *
 * بنفس نمط الاستماع المستخدَم أصلاً في src/hooks/useRecitationTest.ts
 * (الميزة السابقة "اختبر تلاوتك") لكن بوضع `continuous=true` هنا لأن
 * جلسة تسميع كاملة (سورة، عدة آيات) تحتاج استماعًا مستمرًا لا مقطعًا
 * واحدًا فقط.
 *
 * هذا هو المزوّد الوحيد الذي يعمل فعليًا لزوار الموقع عبر متصفح سطح
 * المكتب/جوال خارج تطبيق iOS/Android الأصلي — بدونه، الميزة معطَّلة
 * فعليًا لأغلب زوار majlisilm.com (موقع ويب، لا تطبيق مُثبَّت).
 *
 * الصوت يُعالَج بالكامل عبر محرك التعرّف الصوتي المدمج في نظام التشغيل/
 * المتصفح (قد يُرسِله Chrome لخوادم Google للمعالجة إن لم يتوفر تعرّف
 * كامل على الجهاز — نفس السياسة المُفصَح عنها لمسار iOS الأصلي) — لا
 * إرسال لأي جزء منه لخوادم مجالس نفسها إطلاقًا.
 *
 * ⚠️ إصلاحان جوهريان (2026-07-18) لمشكلة "تعرّف ضعيف جدًا" المُبلَّغة:
 * 1. **كان الكود القديم يُغذّي نصوصًا مؤقتة غير مستقرة (interim results)
 *    لمحرك المحاذاة كأنها كلمات مؤكَّدة** — Chrome يُصدر onresult مرارًا
 *    أثناء "تنقيح" تخمينه لنفس المقطع قبل أن يستقر (مثال: "الحمد" ←
 *    "الحمد لل" ← "الحمد لله")، وكل تنقيح كان يُحتسَب كإضافة كلمات جديدة
 *    فعليًا فيولّد أخطاء وهمية كثيرة تبدو كأن "التعرّف ضعيف" بينما المشكلة
 *    في استهلاك النتيجة الخام لا في دقة Google نفسها. الإصلاح: لا تُغذَّى
 *    للمحرك إلا الكلمات من نتائج **مؤكَّدة (isFinal=true)** فقط.
 * 2. **Chrome يُوقف الاستماع المستمر (continuous) صامتًا** بعد مهلة داخلية
 *    غير موثَّقة رسميًا (عادة حول 60 ثانية أو عند صمت قصير) — بلا إعادة
 *    تشغيل تلقائية، تستمر تلاوة المستخدم بلا أي استماع فعلي بعد ذلك (يبدو
 *    "توقف عن الفهم" تمامًا). الإصلاح: `onend` يُعيد تشغيل `recognition`
 *    تلقائيًا ما دامت الجلسة لم تُنهَ عمدًا عبر endSession().
 */
import type { ASRSession, AudioChunk, FinalResult, PartialResult, QuranASRProvider, RecitationConfig } from "../asr-provider";
import { ASRProviderUnavailableError } from "../asr-provider";

type WebSpeechResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<WebSpeechResult>; resultIndex: number }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type WebSpeechRecognitionCtor = new () => WebSpeechRecognition;

function getCtor(): WebSpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: WebSpeechRecognitionCtor; webkitSpeechRecognition?: WebSpeechRecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

type Active = {
  recognition: WebSpeechRecognition;
  language: string;
  processedFinalCount: number; // عدد نتائج event.results[] المؤكَّدة (isFinal) التي عُولجت فعلًا
  finalWords: string[];
  intentionallyStopped: boolean;
  restartCount: number;
  listeners: Set<(w: string, atMs: number) => void>;
};

const MAX_AUTO_RESTARTS = 50; // سقف أمان يمنع حلقة إعادة تشغيل لا نهائية عند عطل دائم (مثال: سحب إذن الميكروفون)

export class WebSpeechQuranASRProvider implements QuranASRProvider {
  readonly id = "web-speech";
  readonly supportsStreaming = true;
  readonly supportsTajweed = false;
  readonly worksOffline = false;
  readonly capturesAudioInternally = true;

  private sessions = new Map<string, Active>();

  async isAvailable(): Promise<boolean> {
    return getCtor() !== null;
  }

  async startSession(config: RecitationConfig): Promise<ASRSession> {
    const Ctor = getCtor();
    if (!Ctor) {
      throw new ASRProviderUnavailableError({
        code: "UNAVAILABLE",
        message: "التعرّف الصوتي غير مدعوم في هذا المتصفح (جرّب Chrome، أو استخدم تطبيق الجوال).",
      });
    }

    const id = `web-speech-${Date.now()}`;
    const active: Active = {
      recognition: null as unknown as WebSpeechRecognition,
      language: config.language,
      processedFinalCount: 0,
      finalWords: [],
      intentionallyStopped: false,
      restartCount: 0,
      listeners: new Set(),
    };
    this.sessions.set(id, active);
    active.recognition = this.createRecognition(Ctor, active);

    try {
      active.recognition.start();
    } catch {
      this.sessions.delete(id);
      throw new ASRProviderUnavailableError({ code: "PERMISSION_DENIED", message: "تعذّر بدء الاستماع — تحقّق من إذن الميكروفون." });
    }

    return { id, provider: this.id };
  }

  private createRecognition(Ctor: WebSpeechRecognitionCtor, active: Active): WebSpeechRecognition {
    const recognition = new Ctor();
    recognition.lang = active.language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // نعالج فقط النتائج المؤكَّدة (isFinal) الجديدة — النتيجة الأخيرة
      // غالبًا مؤقتة (interim) وتتغيّر لاحقًا، فلا تُحتسَب أبدًا هنا.
      for (let i = active.processedFinalCount; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const transcript = result[0]?.transcript ?? "";
        const words = transcript.trim().split(/\s+/).filter(Boolean);
        active.finalWords.push(...words);
        active.processedFinalCount = i + 1;
        const now = Date.now();
        for (const w of words) for (const cb of active.listeners) cb(w, now);
      }
    };

    recognition.onerror = (event) => {
      // "no-speech" شائع جدًا (صمت قصير) وليس عطلاً حقيقيًا — يُدار عبر
      // onend + إعادة التشغيل التلقائية أدناه، لا داعٍ لفعل شيء هنا.
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.warn(`recitation-ai web-speech: ${event.error}`);
    };

    recognition.onend = () => {
      if (active.intentionallyStopped) return;
      if (active.restartCount >= MAX_AUTO_RESTARTS) return;
      // Chrome يُنهي الاستماع المستمر صامتًا دوريًا — إعادة تشغيل فورية
      // ضرورية وإلا يستمر المستخدم بالتلاوة دون أي استماع فعلي.
      active.restartCount += 1;
      try {
        recognition.start();
      } catch {
        // تعذّر إعادة التشغيل (مثال: الجلسة أُنهيت بين onend ومحاولة إعادة
        // التشغيل) — يُترَك بصمت، endSession سيُعيد ما تجمَّع فعلًا.
      }
    };

    return recognition;
  }

  async transcribeChunk(_session: ASRSession, _chunk: AudioChunk): Promise<PartialResult | null> {
    return null; // capturesAudioInternally=true
  }

  onPartialWord(session: ASRSession, callback: (word: string, atMs: number) => void): () => void {
    const active = this.sessions.get(session.id);
    if (!active) return () => {};
    active.listeners.add(callback);
    return () => active.listeners.delete(callback);
  }

  async endSession(session: ASRSession): Promise<FinalResult> {
    const active = this.sessions.get(session.id);
    this.sessions.delete(session.id);
    if (!active) return { fullText: "", words: [] };
    active.intentionallyStopped = true;
    try { active.recognition.stop(); } catch { /* تجاهل */ }
    return { fullText: active.finalWords.join(" "), words: active.finalWords };
  }
}
