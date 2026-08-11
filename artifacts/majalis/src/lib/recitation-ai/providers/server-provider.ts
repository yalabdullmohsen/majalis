/**
 * server-provider.ts — مسار بث منخفض الكمون (REST fallback)
 *
 * MediaRecorder timeslice قصير (250ms) + نافذة متداخلة + VAD على الجهاز:
 * - لا يُرسل صمتًا للخادم
 * - يُفرّغ المخزن فور انتهاء الكلام (speechEnded)
 * - طابور إعادة محاولة عند انقطاع الشبكة
 * - حد أقصى لطلبات متزامنة لتفادي تراكم الكمون
 *
 * الخادم: POST /api/recitation-transcribe → Groq whisper-large-v3
 * (Vercel لا يدعم WebSocket ASR طويل العمر — استخدم websocket-provider مع
 * VITE_RECITATION_WS_URL لبوابة طويلة العمر مثل Deepgram).
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
import { isNative } from "../../capacitor-utils";
import { SITE_URL } from "../../site-config";
import { normalizeQuranWord } from "../quran-normalize";
import { getWaveformSampleIntervalMs } from "@/lib/render-fps-throttle";
import {
  AUDIO_BITS_PER_SECOND,
  MIN_BLOB_BYTES,
  SLICE_MS,
  WINDOW_SLICES,
  blobToBase64,
  pickSupportedMimeType,
} from "../streaming-audio";
import { EnergyVad, rmsToLevel01 } from "../vad";

const ENDPOINT = isNative ? `${SITE_URL}/api/recitation-transcribe` : "/api/recitation-transcribe";

/** إعادة تصدير للعقود/الاختبارات */
export { SLICE_MS, WINDOW_SLICES };

/** أقصى طلبات Whisper متزامنة */
const MAX_IN_FLIGHT = 2;
/** أقصى مقاطع في طابور إعادة المحاولة */
const MAX_QUEUE = 8;
const WHISPER_ESTIMATED_CONFIDENCE = 72;

type ApiTimedWord = { word?: string; start?: number | null; end?: number | null };

type QueuedSegment = { blob: Blob; enqueuedAt: number; retries: number };

type Active = {
  stream: MediaStream;
  recorder: MediaRecorder | null;
  mimeType: string;
  words: string[];
  timedWords: TimedWordResult[];
  windowOffsetSec: number;
  lastEmittedNorms: string[];
  listeners: Set<(word: string, atMs: number, confidence?: number) => void>;
  levelListeners: Set<(level01: number) => void>;
  statusListeners: Set<(status: AsrPipelineStatus) => void>;
  stopped: boolean;
  pendingSegments: Promise<void>[];
  interrupted: boolean;
  sliceChunks: Blob[];
  analyser: AnalyserNode | null;
  audioCtx: AudioContext | null;
  levelCancel: (() => void) | null;
  sessionStartedAt: number;
  vad: EnergyVad;
  speaking: boolean;
  inFlight: number;
  queue: QueuedSegment[];
  lastStatus: AsrPipelineStatus;
};

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
  const merged = [...previousNorms, ...nextNorms.slice(skip)].slice(-16);
  return { fresh, nextNormsTail: merged };
}

export class ServerQuranASRProvider implements QuranASRProvider {
  readonly id = "server";
  readonly supportsStreaming = true;
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

    const id = `server-${Date.now()}`;
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
      void import("@/lib/error-report").then((m) =>
        m.reportRuntimeFault("audio_context", "AudioContext init failed (server ASR)"),
      );
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
      statusListeners: new Set(),
      stopped: false,
      pendingSegments: [],
      interrupted: false,
      sliceChunks: [],
      analyser,
      audioCtx,
      levelCancel: null,
      sessionStartedAt: Date.now(),
      vad: new EnergyVad({ speechThreshold: 0.018, startFrames: 2, endFrames: 6 }),
      speaking: false,
      inFlight: 0,
      queue: [],
      lastStatus: "listening",
    };
    this.sessions.set(id, active);
    this.emitStatus(active, "listening");

    for (const track of active.stream.getAudioTracks()) {
      track.onmute = () => { active.interrupted = true; };
      track.onunmute = () => { active.interrupted = false; };
      track.onended = () => { active.stopped = true; };
    }

    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      const sampleMs = Math.min(50, getWaveformSampleIntervalMs(50));
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
          if (vad.speechEnded) {
            // تفريغ فوري بعد انتهاء الكلام — لا انتظار المهلة الشبكية
            this.flushWindow(active, true);
            if (active.inFlight === 0) this.emitStatus(active, "listening");
          } else if (vad.speaking && active.lastStatus === "listening") {
            this.emitStatus(active, "speech");
          }
        }, sampleMs);
        active.levelCancel = () => handle.cancel();
      });
    }

    this.startContinuousRecorder(id, active);
    return { id, provider: this.id };
  }

  private emitStatus(active: Active, status: AsrPipelineStatus) {
    if (active.lastStatus === status) return;
    active.lastStatus = status;
    for (const cb of active.statusListeners) cb(status);
  }

  private startContinuousRecorder(sessionId: string, active: Active) {
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
      if (active.stopped || active.interrupted) return;
      if (e.data.size <= 0) return;
      active.sliceChunks.push(e.data);
      if (active.sliceChunks.length > WINDOW_SLICES) active.sliceChunks.shift();
      // أثناء الكلام فقط — تجنّب إرسال صمت (كمون فارغ)
      if (active.speaking || active.sliceChunks.length >= WINDOW_SLICES) {
        this.flushWindow(active, false);
      }
    };

    recorder.onstop = () => {
      if (!active.stopped && !active.interrupted) {
        try { this.startContinuousRecorder(sessionId, active); } catch { /* ignore */ }
      }
    };

    try {
      recorder.start(SLICE_MS);
    } catch {
      this.fallbackSegmentLoop(sessionId, active);
    }
  }

  private flushWindow(active: Active, force: boolean) {
    if (active.sliceChunks.length === 0) return;
    if (!force && !active.speaking && active.sliceChunks.length < WINDOW_SLICES) return;
    const blob = new Blob(active.sliceChunks, { type: active.mimeType });
    if (blob.size < MIN_BLOB_BYTES) return;
    this.enqueueSegment(active, blob);
  }

  private enqueueSegment(active: Active, blob: Blob) {
    if (active.queue.length >= MAX_QUEUE) active.queue.shift();
    active.queue.push({ blob, enqueuedAt: Date.now(), retries: 0 });
    if (active.inFlight >= MAX_IN_FLIGHT) {
      this.emitStatus(active, "queued");
      return;
    }
    void this.drainQueue(active);
  }

  private async drainQueue(active: Active): Promise<void> {
    while (!active.stopped && active.queue.length > 0 && active.inFlight < MAX_IN_FLIGHT) {
      const item = active.queue.shift()!;
      active.inFlight += 1;
      this.emitStatus(active, "matching");
      const p = this.sendSegment(active, item.blob)
        .catch(() => {
          if (item.retries < 2 && !active.stopped) {
            item.retries += 1;
            active.queue.unshift(item);
            this.emitStatus(active, "reconnecting");
          }
        })
        .finally(() => {
          active.inFlight -= 1;
          if (active.queue.length > 0) void this.drainQueue(active);
          else if (!active.speaking) this.emitStatus(active, "listening");
          else this.emitStatus(active, "speech");
        });
      active.pendingSegments.push(p);
    }
  }

  private fallbackSegmentLoop(sessionId: string, active: Active) {
    if (active.stopped) return;
    if (active.interrupted) {
      setTimeout(() => this.fallbackSegmentLoop(sessionId, active), 400);
      return;
    }
    const recorder = new MediaRecorder(active.stream, { mimeType: active.mimeType });
    active.recorder = recorder;
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: active.mimeType });
      if (blob.size > MIN_BLOB_BYTES && !active.interrupted && active.speaking) {
        this.enqueueSegment(active, blob);
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
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`transcribe ${res.status}`);
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
      const w = fresh[i]!;
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

    active.stopped = true;
    this.flushWindow(active, true);
    try {
      active.levelCancel?.();
    } catch {
      /* ignore */
    }
    active.levelCancel = null;
    if (active.recorder && active.recorder.state !== "inactive") {
      try { active.recorder.stop(); } catch { /* ignore */ }
    }
    for (const track of active.stream.getTracks()) track.stop();
    try { await active.audioCtx?.close(); } catch { /* ignore */ }

    // انتظر الطلبات الجارية ثم صفّر الطابور
    await Promise.all(active.pendingSegments).catch(() => {});
    active.queue.length = 0;
    return {
      fullText: active.words.join(" "),
      words: active.words,
      timedWords: active.timedWords,
    };
  }
}
