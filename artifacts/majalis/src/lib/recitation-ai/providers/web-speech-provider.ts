/**
 * web-speech-provider.ts — بث حي عبر Web Speech API (Chrome/Edge).
 *
 * - النتائج المؤكَّدة (isFinal) تُغذّى للمحرك بثقة كاملة.
 * - الكلمات المكتملة من interim (كل ما عدا آخر كلمة قيد التنقيح)
 *   تُصدَر فورًا بثقة منخفضة لتفعيل التمييز الحي بلا أخطاء وهمية صلبة.
 * - عند وصول النهائي تُتخطى الكلمات التي أُصدرت كـ interim لنفس النص.
 */
import type {
  ASRSession,
  AsrPipelineStatus,
  AudioChunk,
  FinalResult,
  PartialResult,
  QuranASRProvider,
  RecitationConfig,
} from "../asr-provider";
import { ASRProviderUnavailableError } from "../asr-provider";
import { normalizeQuranWord } from "../quran-normalize";

type WebSpeechResult = ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean };
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

/** ثقة interim منخفضة — تُصنَّف غالباً غير واضح لا خطأ صلب */
const INTERIM_CONFIDENCE = 48;

type Active = {
  recognition: WebSpeechRecognition;
  language: string;
  processedFinalCount: number;
  finalWords: string[];
  /** كلمات interim مكتملة أُصدرت (مطبَّعة) — لمنع التكرار عند النهائي */
  emittedInterimNorms: string[];
  intentionallyStopped: boolean;
  restartCount: number;
  listeners: Set<(w: string, atMs: number, confidence?: number) => void>;
  statusListeners: Set<(s: AsrPipelineStatus) => void>;
  lastStatus: AsrPipelineStatus;
};

const MAX_AUTO_RESTARTS = 50;

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
      emittedInterimNorms: [],
      intentionallyStopped: false,
      restartCount: 0,
      listeners: new Set(),
      statusListeners: new Set(),
      lastStatus: "listening",
    };
    this.sessions.set(id, active);
    active.recognition = this.createRecognition(Ctor, active);

    try {
      active.recognition.start();
    } catch {
      this.sessions.delete(id);
      throw new ASRProviderUnavailableError({ code: "PERMISSION_DENIED", message: "تعذّر بدء الاستماع — تحقّق من إذن الميكروفون." });
    }

    this.emitStatus(active, "listening");
    return { id, provider: this.id };
  }

  private emitStatus(active: Active, status: AsrPipelineStatus) {
    if (active.lastStatus === status) return;
    active.lastStatus = status;
    for (const cb of active.statusListeners) cb(status);
  }

  private createRecognition(Ctor: WebSpeechRecognitionCtor, active: Active): WebSpeechRecognition {
    const recognition = new Ctor();
    recognition.lang = active.language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      this.emitStatus(active, "matching");
      const now = Date.now();

      // 1) interim: أصدر الكلمات المكتملة فقط (بدون الأخيرة قيد التنقيح)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || result.isFinal) continue;
        const transcript = result[0]?.transcript ?? "";
        const parts = transcript.trim().split(/\s+/).filter(Boolean);
        if (parts.length < 2) continue;
        const complete = parts.slice(0, -1);
        for (const w of complete) {
          const norm = normalizeQuranWord(w);
          if (!norm) continue;
          if (active.emittedInterimNorms.includes(norm) &&
              active.emittedInterimNorms[active.emittedInterimNorms.length - 1] === norm) {
            continue;
          }
          // تجنّب تكرار نفس الكلمة المتتالية من interim متذبذب
          if (active.emittedInterimNorms[active.emittedInterimNorms.length - 1] === norm) continue;
          active.emittedInterimNorms.push(norm);
          if (active.emittedInterimNorms.length > 24) active.emittedInterimNorms.shift();
          for (const cb of active.listeners) cb(w, now, INTERIM_CONFIDENCE);
        }
      }

      // 2) finals مؤكَّدة
      for (let i = active.processedFinalCount; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result?.isFinal) continue;
        const transcript = result[0]?.transcript ?? "";
        const rawConfidence = result[0]?.confidence;
        const confidencePct =
          typeof rawConfidence === "number" && Number.isFinite(rawConfidence) && rawConfidence > 0
            ? rawConfidence * 100
            : undefined;
        const words = transcript.trim().split(/\s+/).filter(Boolean);
        active.processedFinalCount = i + 1;
        for (const w of words) {
          const norm = normalizeQuranWord(w);
          // إن أُصدرت كـ interim بنفس التطبيع في الذيل — لا تُعاد (تجنّب ازدواج المحرك)
          const interimIdx = active.emittedInterimNorms.lastIndexOf(norm);
          if (interimIdx >= 0 && interimIdx >= active.emittedInterimNorms.length - 4) {
            active.finalWords.push(w);
            continue;
          }
          active.finalWords.push(w);
          for (const cb of active.listeners) cb(w, now, confidencePct);
        }
        active.emittedInterimNorms = [];
      }

      this.emitStatus(active, "speech");
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.warn(`recitation-ai web-speech: ${event.error}`);
      if (event.error === "network") this.emitStatus(active, "reconnecting");
    };

    recognition.onend = () => {
      if (active.intentionallyStopped) return;
      if (active.restartCount >= MAX_AUTO_RESTARTS) return;
      active.restartCount += 1;
      this.emitStatus(active, "listening");
      try {
        recognition.start();
      } catch {
        /* ignore */
      }
    };

    return recognition;
  }

  async transcribeChunk(_session: ASRSession, _chunk: AudioChunk): Promise<PartialResult | null> {
    return null;
  }

  onPartialWord(session: ASRSession, callback: (word: string, atMs: number, confidence?: number) => void): () => void {
    const active = this.sessions.get(session.id);
    if (!active) return () => {};
    active.listeners.add(callback);
    return () => active.listeners.delete(callback);
  }

  onPipelineStatus(session: ASRSession, callback: (status: AsrPipelineStatus) => void): () => void {
    const active = this.sessions.get(session.id);
    if (!active) return () => {};
    active.statusListeners.add(callback);
    callback(active.lastStatus);
    return () => active.statusListeners.delete(callback);
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
