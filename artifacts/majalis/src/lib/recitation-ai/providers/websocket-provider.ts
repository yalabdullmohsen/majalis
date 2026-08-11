/**
 * websocket-provider.ts — بث صوتي منخفض الكمون عبر WebSocket
 *
 * يلتقط الميكروفون (AudioContext + MediaRecorder)، يقطّع شرائح ~250ms،
 * يمرّر عبر Energy VAD لتجنّب إرسال الصمت، ويبث المقاطع لبوابة ASR
 * طويلة العمر (Deepgram proxy أو نقطة مخصّصة).
 *
 * البروتوكول المدعوم من الخادم (أيّهما):
 * 1) رسائل JSON مخصّصة:
 *    ← { type:"audio", mimeType, data:base64 } أو إطارات binary
 *    → { type:"transcript"|"partial"|"final", text?, words?:string[], is_final? }
 * 2) استجابة شبيهة بـ Deepgram Live:
 *    → { channel:{ alternatives:[{ transcript, words:[{word,start,end,confidence}] }] }, is_final }
 *
 * لا يُفعَّل إلا عند ضبط VITE_RECITATION_WS_URL — وإلا يبقى مسار Web Speech / Groq.
 */
import type {
  ASRSession,
  AsrPipelineStatus,
  AudioChunk,
  FinalResult,
  PartialResult,
  QuranASRProvider,
  RecitationConfig,
  TimedWordResult,
} from "../asr-provider";
import { ASRProviderUnavailableError } from "../asr-provider";
import { getWaveformSampleIntervalMs } from "@/lib/render-fps-throttle";
import { normalizeQuranWord } from "../quran-normalize";
import {
  AUDIO_BITS_PER_SECOND,
  MIN_BLOB_BYTES,
  SLICE_MS,
  blobToBase64,
  getRecitationWsToken,
  getRecitationWsUrl,
  pickSupportedMimeType,
} from "../streaming-audio";
import { EnergyVad, rmsToLevel01 } from "../vad";
import { dedupeOverlappingWords } from "./server-provider";

type Active = {
  stream: MediaStream;
  recorder: MediaRecorder | null;
  mimeType: string;
  ws: WebSocket | null;
  words: string[];
  timedWords: TimedWordResult[];
  lastEmittedNorms: string[];
  listeners: Set<(word: string, atMs: number, confidence?: number) => void>;
  levelListeners: Set<(level01: number) => void>;
  statusListeners: Set<(status: AsrPipelineStatus) => void>;
  stopped: boolean;
  analyser: AnalyserNode | null;
  audioCtx: AudioContext | null;
  levelCancel: (() => void) | null;
  sessionStartedAt: number;
  vad: EnergyVad;
  speaking: boolean;
  lastStatus: AsrPipelineStatus;
  sendBinary: boolean;
  reconnectAttempts: number;
};

function parseIncomingMessage(raw: string): {
  words: string[];
  isFinal: boolean;
  timed?: TimedWordResult[];
  confidences?: number[];
} | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  // بروتوكول مخصّص
  if (obj.type === "transcript" || obj.type === "partial" || obj.type === "final" || obj.type === "result") {
    const text = typeof obj.text === "string" ? obj.text : "";
    const wordsArr = Array.isArray(obj.words)
      ? (obj.words as unknown[]).map((w) => (typeof w === "string" ? w : (w as { word?: string })?.word || "")).filter(Boolean)
      : text.split(/\s+/).filter(Boolean);
    const isFinal = obj.type === "final" || obj.is_final === true || obj.isFinal === true;
    return { words: wordsArr as string[], isFinal };
  }

  // Deepgram-like
  const channel = obj.channel as { alternatives?: Array<{ transcript?: string; words?: Array<{ word?: string; start?: number; end?: number; confidence?: number }> }> } | undefined;
  const alt = channel?.alternatives?.[0];
  if (alt) {
    const dgWords = Array.isArray(alt.words) ? alt.words : [];
    const words =
      dgWords.length > 0
        ? dgWords.map((w) => (typeof w.word === "string" ? w.word.trim() : "")).filter(Boolean)
        : (alt.transcript || "").split(/\s+/).filter(Boolean);
    const timed: TimedWordResult[] = dgWords
      .filter((w) => typeof w.word === "string" && w.word.trim())
      .map((w) => ({
        word: w.word!.trim(),
        startSec: typeof w.start === "number" ? w.start : null,
        endSec: typeof w.end === "number" ? w.end : null,
      }));
    const confidences = dgWords.map((w) =>
      typeof w.confidence === "number" ? Math.round(w.confidence * 100) : 70,
    );
    return {
      words,
      isFinal: obj.is_final === true || obj.speech_final === true,
      timed: timed.length ? timed : undefined,
      confidences,
    };
  }

  if (typeof obj.transcript === "string") {
    return {
      words: obj.transcript.split(/\s+/).filter(Boolean),
      isFinal: obj.is_final === true,
    };
  }

  return null;
}

export class WebSocketQuranASRProvider implements QuranASRProvider {
  readonly id = "websocket";
  readonly supportsStreaming = true;
  readonly supportsTajweed = true;
  readonly worksOffline = false;
  readonly capturesAudioInternally = true;

  private sessions = new Map<string, Active>();

  async isAvailable(): Promise<boolean> {
    if (!getRecitationWsUrl()) return false;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
    if (typeof MediaRecorder === "undefined") return false;
    if (typeof WebSocket === "undefined") return false;
    return true;
  }

  async startSession(_config: RecitationConfig): Promise<ASRSession> {
    const wsUrl = getRecitationWsUrl();
    if (!wsUrl) {
      throw new ASRProviderUnavailableError({
        code: "NOT_CONFIGURED",
        message: "بوابة التسميع الفورية غير مُهيَّأة (VITE_RECITATION_WS_URL).",
      });
    }

    const { ensureMicPermission } = await import("@/lib/mic-permission");
    const mic = await ensureMicPermission();
    if (!mic.ok) {
      throw new ASRProviderUnavailableError({
        code: "PERMISSION_DENIED",
        message: mic.message || "لم يُمنح إذن الميكروفون.",
      });
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch {
      throw new ASRProviderUnavailableError({ code: "PERMISSION_DENIED", message: "لم يُمنح إذن الميكروفون." });
    }

    const id = `ws-${Date.now()}`;
    let analyser: AnalyserNode | null = null;
    let audioCtx: AudioContext | null = null;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AC();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
    } catch {
      /* مؤشر المستوى اختياري */
    }

    const active: Active = {
      stream,
      recorder: null,
      mimeType: pickSupportedMimeType(),
      ws: null,
      words: [],
      timedWords: [],
      lastEmittedNorms: [],
      listeners: new Set(),
      levelListeners: new Set(),
      statusListeners: new Set(),
      stopped: false,
      analyser,
      audioCtx,
      levelCancel: null,
      sessionStartedAt: Date.now(),
      vad: new EnergyVad({ speechThreshold: 0.018, startFrames: 2, endFrames: 5 }),
      speaking: false,
      lastStatus: "listening",
      sendBinary: true,
      reconnectAttempts: 0,
    };
    this.sessions.set(id, active);

    try {
      await this.connectWs(active, wsUrl);
    } catch {
      this.cleanupMedia(active);
      this.sessions.delete(id);
      throw new ASRProviderUnavailableError({
        code: "NETWORK",
        message: "تعذّر الاتصال ببوابة التعرّف الصوتي الفورية.",
      });
    }

    this.emitStatus(active, "listening");

    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      const sampleMs = Math.min(40, getWaveformSampleIntervalMs(40));
      void import("@/lib/visibility-raf").then(({ startVisibilityAwareInterval }) => {
        if (active.stopped) return;
        const handle = startVisibilityAwareInterval(() => {
          if (!active.analyser || active.stopped) return;
          active.analyser.getByteTimeDomainData(data);
          const vad = active.vad.tickFromTimeDomain(data);
          active.speaking = vad.speaking;
          const level = rmsToLevel01(vad.rms);
          for (const cb of active.levelListeners) cb(level);
          if (vad.speechStarted) this.emitStatus(active, "speech");
          if (vad.speechEnded) this.emitStatus(active, "listening");
          else if (vad.speaking && active.lastStatus === "listening") this.emitStatus(active, "speech");
        }, sampleMs);
        active.levelCancel = () => handle.cancel();
      });
    }

    this.startRecorder(active);
    return { id, provider: this.id };
  }

  private emitStatus(active: Active, status: AsrPipelineStatus) {
    if (active.lastStatus === status) return;
    active.lastStatus = status;
    for (const cb of active.statusListeners) cb(status);
  }

  private connectWs(active: Active, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = getRecitationWsToken();
      const sock = new WebSocket(url);
      sock.binaryType = "arraybuffer";
      const timer = setTimeout(() => {
        try { sock.close(); } catch { /* ignore */ }
        reject(new Error("ws timeout"));
      }, 8000);

      sock.onopen = () => {
        clearTimeout(timer);
        active.ws = sock;
        active.reconnectAttempts = 0;
        // تهيئة اختيارية — البوابة قد تتجاهلها
        try {
          sock.send(
            JSON.stringify({
              type: "start",
              mimeType: active.mimeType,
              language: "ar",
              sampleRateHint: 16000,
              ...(token ? { token } : {}),
            }),
          );
        } catch {
          /* ignore */
        }
        resolve();
      };

      sock.onerror = () => {
        clearTimeout(timer);
        reject(new Error("ws error"));
      };

      sock.onmessage = (ev) => {
        if (typeof ev.data !== "string") return;
        const parsed = parseIncomingMessage(ev.data);
        if (!parsed || parsed.words.length === 0) return;
        this.emitStatus(active, "matching");
        this.ingestWords(active, parsed.words, parsed.timed, parsed.confidences);
        if (!active.speaking) this.emitStatus(active, "listening");
        else this.emitStatus(active, "speech");
      };

      sock.onclose = () => {
        active.ws = null;
        if (active.stopped) return;
        if (active.reconnectAttempts >= 3) {
          this.emitStatus(active, "reconnecting");
          return;
        }
        active.reconnectAttempts += 1;
        this.emitStatus(active, "reconnecting");
        const nextUrl = getRecitationWsUrl();
        if (!nextUrl) return;
        setTimeout(() => {
          if (active.stopped) return;
          void this.connectWs(active, nextUrl).catch(() => {});
        }, 400 * active.reconnectAttempts);
      };
    });
  }

  private ingestWords(
    active: Active,
    words: string[],
    timed?: TimedWordResult[],
    confidences?: number[],
  ) {
    const { fresh, nextNormsTail } = dedupeOverlappingWords(active.lastEmittedNorms, words);
    active.lastEmittedNorms = nextNormsTail;
    if (fresh.length === 0) return;
    const skip = words.length - fresh.length;
    active.words.push(...fresh);
    const now = Date.now();
    for (let i = 0; i < fresh.length; i++) {
      const w = fresh[i]!;
      const meta = timed?.[skip + i];
      active.timedWords.push(meta ?? { word: w, startSec: null, endSec: null });
      const conf = confidences?.[skip + i] ?? 78;
      for (const cb of active.listeners) cb(w, now, conf);
    }
  }

  private startRecorder(active: Active) {
    if (active.stopped) return;
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(active.stream, {
        mimeType: active.mimeType,
        audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
      });
    } catch {
      recorder = new MediaRecorder(active.stream, { mimeType: active.mimeType });
    }
    active.recorder = recorder;

    recorder.ondataavailable = (e) => {
      if (active.stopped || e.data.size < MIN_BLOB_BYTES) return;
      // أثناء الكلام فقط — VAD يمنع إرسال صمت يجمّد الطابور
      if (!active.speaking && active.lastStatus !== "speech") return;
      void this.sendChunk(active, e.data);
    };

    recorder.onstop = () => {
      if (!active.stopped) {
        try { this.startRecorder(active); } catch { /* ignore */ }
      }
    };

    try {
      recorder.start(SLICE_MS);
    } catch {
      // fallback: مقاطع يدوية
      recorder.start();
      setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, SLICE_MS);
    }
  }

  private async sendChunk(active: Active, blob: Blob) {
    const ws = active.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      if (active.sendBinary) {
        const buf = await blob.arrayBuffer();
        ws.send(buf);
      } else {
        const data = await blobToBase64(blob);
        ws.send(JSON.stringify({ type: "audio", mimeType: active.mimeType, data }));
      }
    } catch {
      // إن فشل binary جرّب JSON في المرة التالية
      active.sendBinary = false;
      try {
        const data = await blobToBase64(blob);
        ws.send(JSON.stringify({ type: "audio", mimeType: active.mimeType, data }));
      } catch {
        /* ignore */
      }
    }
  }

  private cleanupMedia(active: Active) {
    active.stopped = true;
    try { active.levelCancel?.(); } catch { /* ignore */ }
    if (active.recorder && active.recorder.state !== "inactive") {
      try { active.recorder.stop(); } catch { /* ignore */ }
    }
    for (const track of active.stream.getTracks()) track.stop();
    try { void active.audioCtx?.close(); } catch { /* ignore */ }
    if (active.ws && active.ws.readyState === WebSocket.OPEN) {
      try { active.ws.send(JSON.stringify({ type: "stop" })); } catch { /* ignore */ }
      try { active.ws.close(); } catch { /* ignore */ }
    }
    active.ws = null;
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

  onAudioLevel(session: ASRSession, callback: (level01: number) => void): () => void {
    const active = this.sessions.get(session.id);
    if (!active) return () => {};
    active.levelListeners.add(callback);
    return () => active.levelListeners.delete(callback);
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
    this.cleanupMedia(active);
    return {
      fullText: active.words.join(" "),
      words: active.words,
      timedWords: active.timedWords,
    };
  }
}

/** تصدير للاختبارات — التطبيع قبل المطابقة يتم عبر normalizeQuranWord في المحرك. */
export function normalizeStreamedWord(word: string): string {
  return normalizeQuranWord(word);
}
