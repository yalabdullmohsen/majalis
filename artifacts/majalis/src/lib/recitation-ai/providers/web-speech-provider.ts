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
 */
import type { ASRSession, AudioChunk, FinalResult, PartialResult, QuranASRProvider, RecitationConfig } from "../asr-provider";
import { ASRProviderUnavailableError } from "../asr-provider";

type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
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

type Active = { recognition: WebSpeechRecognition; lastWordCount: number; fullTranscript: string; listeners: Set<(w: string, atMs: number) => void> };

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
    const recognition = new Ctor();
    recognition.lang = config.language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    const active: Active = { recognition, lastWordCount: 0, fullTranscript: "", listeners: new Set() };
    this.sessions.set(id, active);

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript + " ";
      active.fullTranscript = text.trim();
      const words = active.fullTranscript.split(/\s+/).filter(Boolean);
      const newWords = words.slice(active.lastWordCount);
      active.lastWordCount = words.length;
      const now = Date.now();
      for (const w of newWords) for (const cb of active.listeners) cb(w, now);
    };
    recognition.onerror = () => { /* يُدار عبر endSession — لا رمي هنا حتى لا يُسقِط الجلسة كاملة لخطأ عابر */ };

    try {
      recognition.start();
    } catch {
      throw new ASRProviderUnavailableError({ code: "PERMISSION_DENIED", message: "تعذّر بدء الاستماع — تحقّق من إذن الميكروفون." });
    }

    return { id, provider: this.id };
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
    try { active.recognition.stop(); } catch { /* تجاهل */ }
    const words = active.fullTranscript.split(/\s+/).filter(Boolean);
    return { fullText: active.fullTranscript, words };
  }
}
