/**
 * server-provider.ts
 * مزوّد خادمي: getUserMedia + MediaRecorder بنافذة متداخلة (~3.5ث كل ~1.8ث)
 * لتقليل فقدان الكلمات على حدود المقاطع، مع إزالة تكرار البادئة عبر
 * تطبيع قرآني. يُرسل إلى /api/recitation-transcribe (Groq whisper-large-v3).
 *
 * لا صوت يُخزَّن — المقطع يُعالَج ويُهمَل.
 */
import type {
  ASRSession,
  AudioChunk,
  FinalResult,
  PartialResult,
  QuranASRProvider,
  RecitationConfig,
  TimedWordResult,
} from "../asr-provider";
import { ASRProviderUnavailableError } from "../asr-provider";
import { isNative } from "../../capacitor-utils";
import { SITE_URL } from "../../site-config";
import { normalizeQuranWord } from "../quran-normalize";

const ENDPOINT = isNative ? `${SITE_URL}/api/recitation-transcribe` : "/api/recitation-transcribe";
/** مدة كل دفعة timeslice من المُسجِّل المستمر */
const SLICE_MS = 1800;
/** أقصى عدد شرائح نُبقيها في النافذة المتداخلة (~3.6ث) */
const WINDOW_SLICES = 2;
/** ثقة تقديرية لكلمات Whisper (لا ثقة حقيقية لكل كلمة) — تحت عتبة needs_repeat
 * كي لا نجزِم بخطأ عند التباس عام؛ فوق unclear حتى لا نُعلِّق كل كلمة. */
const WHISPER_ESTIMATED_CONFIDENCE = 72;

type ApiTimedWord = { word?: string; start?: number | null; end?: number | null };

type Active = {
  stream: MediaStream;
  recorder: MediaRecorder | null;
  mimeType: string;
  words: string[];
  timedWords: TimedWordResult[];
  /** إزاحة زمنية تقريبية لبداية النافذة الحالية (ث) — لدمج طوابع Whisper النسبية. */
  windowOffsetSec: number;
  lastEmittedNorms: string[];
  listeners: Set<(word: string, atMs: number, confidence?: number) => void>;
  levelListeners: Set<(level01: number) => void>;
  stopped: boolean;
  pendingSegments: Promise<void>[];
  interrupted: boolean;
  sliceChunks: Blob[];
  analyser: AnalyserNode | null;
  audioCtx: AudioContext | null;
  levelTimer: ReturnType<typeof setInterval> | null;
  sessionStartedAt: number;
};

function pickSupportedMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  for (const c of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
    } catch { /* next */ }
  }
  return "audio/webm";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** أزل بادئة النافذة المتداخلة إن طابقت ذيل آخر ما أُصدِر. */
export function dedupeOverlappingWords(previousNorms: string[], nextRaw: string[]): { fresh: string[]; nextNormsTail: string[] } {
  const nextNorms = nextRaw.map((w) => normalizeQuranWord(w)).filter(Boolean);
  if (nextNorms.length === 0) return { fresh: [], nextNormsTail: previousNorms };
  let skip = 0;
  const maxK = Math.min(previousNorms.length, nextNorms.length);
  for (let k = maxK; k > 0; k--) {
    let ok = true;
    for (let i = 0; i < k; i++) {
      if (previousNorms[previousNorms.length - k + i] !== nextNorms[i]) { ok = false; break; }
    }
    if (ok) { skip = k; break; }
  }
  const fresh = nextRaw.filter((_, i) => normalizeQuranWord(nextRaw[i])).slice(skip);
  const merged = [...previousNorms, ...nextNorms.slice(skip)].slice(-12);
  return { fresh, nextNormsTail: merged };
}

export class ServerQuranASRProvider implements QuranASRProvider {
  readonly id = "server";
  readonly supportsStreaming = true;
  /** ملاحظات تجويد زمنية من طوابع Whisper — ليس تحليلًا فونيميًا. */
  readonly supportsTajweed = true;
  readonly worksOffline = false;
  readonly capturesAudioInternally = true;

  private sessions = new Map<string, Active>();

  async isAvailable(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
    if (typeof MediaRecorder === "undefined") return false;
    try {
      const res = await fetch(ENDPOINT, { method: "GET", signal: AbortSignal.timeout(5000) });
      if (!res.ok) return false;
      const data = await res.json();
      return data?.configured === true;
    } catch {
      return false;
    }
  }

  async startSession(_config: RecitationConfig): Promise<ASRSession> {
    if (!(await this.isAvailable())) {
      throw new ASRProviderUnavailableError({
        code: "NOT_CONFIGURED",
        message: "مزوّد التعرّف الصوتي الخادمي غير مُهيَّأ بعد (GROQ_API_KEY مفقود على الخادم).",
      });
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
    } catch {
      throw new ASRProviderUnavailableError({ code: "PERMISSION_DENIED", message: "لم يُمنح إذن الميكروفون." });
    }

    const id = `server-${Date.now()}`;
    let analyser: AnalyserNode | null = null;
    let audioCtx: AudioContext | null = null;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AC();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
    } catch {
      /* مؤشر المستوى اختياري — الجلسة تعمل بدونه */
    }

    const active: Active = {
      stream,
      recorder: null,
      mimeType: pickSupportedMimeType(),
      words: [],
      timedWords: [],
      windowOffsetSec: 0,
      lastEmittedNorms: [],
      listeners: new Set(),
      levelListeners: new Set(),
      stopped: false,
      pendingSegments: [],
      interrupted: false,
      sliceChunks: [],
      analyser,
      audioCtx,
      levelTimer: null,
      sessionStartedAt: Date.now(),
    };
    this.sessions.set(id, active);

    for (const track of active.stream.getAudioTracks()) {
      track.onmute = () => { active.interrupted = true; };
      track.onunmute = () => { active.interrupted = false; };
      track.onended = () => { active.stopped = true; };
    }

    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      active.levelTimer = setInterval(() => {
        if (!active.analyser || active.stopped) return;
        active.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(1, rms * 4);
        for (const cb of active.levelListeners) cb(level);
      }, 100);
    }

    this.startContinuousRecorder(id, active);
    return { id, provider: this.id };
  }

  /** تسجيل مستمر بـ timeslice + نافذة شرائح متداخلة تُرسل دوريًا. */
  private startContinuousRecorder(sessionId: string, active: Active) {
    if (active.stopped) return;
    const recorder = new MediaRecorder(active.stream, { mimeType: active.mimeType });
    active.recorder = recorder;

    recorder.ondataavailable = (e) => {
      if (active.stopped || active.interrupted) return;
      if (e.data.size > 0) {
        active.sliceChunks.push(e.data);
        if (active.sliceChunks.length > WINDOW_SLICES) active.sliceChunks.shift();
        if (active.sliceChunks.length >= 1) {
          const blob = new Blob(active.sliceChunks, { type: active.mimeType });
          if (blob.size > 200) {
            const p = this.sendSegment(active, blob).catch(() => {});
            active.pendingSegments.push(p);
          }
        }
      }
    };

    recorder.onstop = () => {
      if (!active.stopped && !active.interrupted) {
        // إعادة تشغيل بعد توقف غير متوقع
        try { this.startContinuousRecorder(sessionId, active); } catch { /* ignore */ }
      }
    };

    try {
      recorder.start(SLICE_MS);
    } catch {
      // بعض المتصفحات ترفض timeslice — نسقط لحلقة مقاطع منفصلة
      this.fallbackSegmentLoop(sessionId, active);
    }
  }

  private fallbackSegmentLoop(sessionId: string, active: Active) {
    if (active.stopped) return;
    if (active.interrupted) {
      setTimeout(() => this.fallbackSegmentLoop(sessionId, active), 500);
      return;
    }
    const recorder = new MediaRecorder(active.stream, { mimeType: active.mimeType });
    active.recorder = recorder;
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: active.mimeType });
      if (blob.size > 200 && !active.interrupted) {
        active.pendingSegments.push(this.sendSegment(active, blob).catch(() => {}));
      }
      if (!active.stopped) setTimeout(() => this.fallbackSegmentLoop(sessionId, active), 0);
    };
    recorder.start();
    setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, SLICE_MS * WINDOW_SLICES);
  }

  private async sendSegment(active: Active, blob: Blob): Promise<void> {
    const audioBase64 = await blobToBase64(blob);
    const windowStartedAt = Date.now();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, mimeType: active.mimeType }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const text = typeof data?.text === "string" ? data.text : "";
    const apiWords: ApiTimedWord[] = Array.isArray(data?.words) ? data.words : [];
    const wordsFromApi = apiWords
      .map((w) => (typeof w?.word === "string" ? w.word.trim() : ""))
      .filter(Boolean);
    const words = wordsFromApi.length > 0 ? wordsFromApi : text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const { fresh, nextNormsTail } = dedupeOverlappingWords(active.lastEmittedNorms, words);
    active.lastEmittedNorms = nextNormsTail;
    if (fresh.length === 0) return;

    const skip = words.length - fresh.length;
    const baseOffsetSec = Math.max(0, (windowStartedAt - active.sessionStartedAt) / 1000 - (SLICE_MS * WINDOW_SLICES) / 1000);
    active.windowOffsetSec = baseOffsetSec;

    active.words.push(...fresh);
    const now = Date.now();
    for (let i = 0; i < fresh.length; i++) {
      const w = fresh[i];
      const meta = apiWords[skip + i];
      const hasTs =
        typeof meta?.start === "number" &&
        typeof meta?.end === "number" &&
        Number.isFinite(meta.start) &&
        Number.isFinite(meta.end);
      const startSec = hasTs ? baseOffsetSec + (meta!.start as number) : null;
      const endSec = hasTs ? baseOffsetSec + (meta!.end as number) : null;
      active.timedWords.push({ word: w, startSec, endSec });
      for (const cb of active.listeners) cb(w, now, WHISPER_ESTIMATED_CONFIDENCE);
    }
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

  /** مؤشر مستوى الصوت الحي (0–1) لموجة الواجهة. */
  onAudioLevel(session: ASRSession, callback: (level01: number) => void): () => void {
    const active = this.sessions.get(session.id);
    if (!active) return () => {};
    active.levelListeners.add(callback);
    return () => active.levelListeners.delete(callback);
  }

  async endSession(session: ASRSession): Promise<FinalResult> {
    const active = this.sessions.get(session.id);
    this.sessions.delete(session.id);
    if (!active) return { fullText: "", words: [] };

    active.stopped = true;
    if (active.levelTimer) clearInterval(active.levelTimer);
    if (active.recorder && active.recorder.state !== "inactive") {
      try { active.recorder.stop(); } catch { /* ignore */ }
    }
    for (const track of active.stream.getTracks()) track.stop();
    try { await active.audioCtx?.close(); } catch { /* ignore */ }

    await Promise.all(active.pendingSegments).catch(() => {});
    return {
      fullText: active.words.join(" "),
      words: active.words,
      timedWords: active.timedWords,
    };
  }
}
