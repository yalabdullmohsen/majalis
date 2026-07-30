/**
 * on-device-provider.ts
 * يُغلّف الجسر الأصلي (SFSpeech / Android SpeechRecognizer) كـQuranASRProvider.
 * يمرّر ثقة كل كلمة من segments / EXTRA_CONFIDENCE_SCORES عند توفرها.
 * يدعم prepare/prewarm + audioLevel + قياسات كمون.
 */
import {
  classifySpeechPluginError,
  getSpeechRecognitionPlugin,
  type SpeechRecognitionErrorCode,
} from "@/lib/plugins/speech-recognition";
import type { ASRSession, AudioChunk, FinalResult, PartialResult, QuranASRProvider, RecitationConfig } from "../asr-provider";
import { ASRProviderUnavailableError, type ASRProviderError } from "../asr-provider";
import { createMicLatencyTracker } from "@/lib/recitation-mic-latency";

function mapSpeechCode(code: SpeechRecognitionErrorCode): ASRProviderError["code"] {
  switch (code) {
    case "SPEECH_DENIED":
    case "SPEECH_NOT_DETERMINED":
    case "MICROPHONE_DENIED":
    case "MICROPHONE_NOT_DETERMINED":
      return "PERMISSION_DENIED";
    case "NETWORK":
      return "NETWORK";
    case "NO_SPEECH_DETECTED":
    case "NO_AUDIO_BUFFER":
      return "NO_SPEECH";
    case "AUDIO_SESSION_FAILED":
    case "AUDIO_FORMAT_INVALID":
    case "ENGINE_START_FAILED":
    case "MEDIA_SERVICES_RESET":
      return "AUDIO_SESSION";
    case "RECOGNIZER_UNAVAILABLE":
    case "SESSION_SUPERSEDED":
      return "UNAVAILABLE";
    case "RECOGNITION_FAILED":
      return "RECOGNITION_FAILED";
    default:
      return "UNKNOWN";
  }
}

export class OnDeviceQuranASRProvider implements QuranASRProvider {
  readonly id = "on-device";
  readonly supportsStreaming = true;
  readonly supportsTajweed = false;
  readonly worksOffline = true;
  readonly capturesAudioInternally = true;

  private lastEmittedWordCount = new Map<string, number>();
  private pendingStart = new Map<string, Promise<{ matches?: string[] }>>();
  private activeSessionId: string | null = null;
  private prepared = false;
  private latency = createMicLatencyTracker();

  async isAvailable(): Promise<boolean> {
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) return false;
    try {
      const res = await plugin.available({ language: "ar-SA" });
      return res.available;
    } catch {
      return false;
    }
  }

  /** تسخين مسبق عند فتح صفحة التسميع. */
  async prepare(language = "ar-SA"): Promise<{ ok: boolean; prepareMs?: number }> {
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) return { ok: false };
    try {
      const perm = await plugin.requestPermissions();
      if (perm.speechRecognition !== "granted") {
        return { ok: false };
      }
      const res = await plugin.prepare({ language });
      this.prepared = !!res.ok;
      return { ok: !!res.ok, prepareMs: res.prepareMs };
    } catch {
      this.prepared = false;
      return { ok: false };
    }
  }

  async startSession(config: RecitationConfig): Promise<ASRSession> {
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) {
      throw new ASRProviderUnavailableError({ code: "UNAVAILABLE", message: "التعرّف الصوتي الأصلي غير متاح على هذه المنصة (ويب/غير مدعوم)." });
    }

    // منع أكثر من جلسة/مهمة في الوقت نفسه
    if (this.activeSessionId) {
      try {
        await plugin.stop();
      } catch {
        /* تجاهل */
      }
      this.pendingStart.delete(this.activeSessionId);
      this.lastEmittedWordCount.delete(this.activeSessionId);
      this.activeSessionId = null;
    }

    const perm = await plugin.requestPermissions();
    if (perm.speechRecognition !== "granted") {
      const detail =
        perm.microphone === "denied"
          ? "إذن الميكروفون مرفوض."
          : perm.speech === "denied" || perm.speech === "restricted"
            ? "إذن التعرّف على الكلام مرفوض."
            : "لم يُمنح إذن الميكروفون/التعرّف الصوتي.";
      throw new ASRProviderUnavailableError({ code: "PERMISSION_DENIED", message: detail });
    }

    if (!this.prepared) {
      await this.prepare(config.language);
    }

    const id = `on-device-${Date.now()}`;
    this.activeSessionId = id;
    this.lastEmittedWordCount.set(id, 0);
    this.latency.markButton();
    this.latency.record("button_press", { cold: !this.prepared });

    const startPromise = plugin
      .start({
        language: config.language,
        partialResults: true,
        popup: false,
        maxResults: 1,
        preferOnDevice: true,
      })
      .catch((err) => {
        const classified = classifySpeechPluginError(err);
        if (this.activeSessionId === id) this.activeSessionId = null;
        throw new ASRProviderUnavailableError({
          code: mapSpeechCode(classified.code),
          message: classified.message,
        });
      });
    this.pendingStart.set(id, startPromise);

    return { id, provider: this.id };
  }

  async transcribeChunk(_session: ASRSession, _chunk: AudioChunk): Promise<PartialResult | null> {
    return null;
  }

  onPartialWord(session: ASRSession, callback: (word: string, atMs: number, confidence?: number) => void): () => void {
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) return () => {};

    let removed = false;
    let handle: { remove: () => void } | null = null;

    plugin
      .addListener("partialResults", (data) => {
        if (removed) return;
        if (this.activeSessionId && this.activeSessionId !== session.id) return;
        const segmentWords = Array.isArray(data.words) && data.words.length > 0
          ? data.words
          : (data.matches?.[0] ?? "").split(/\s+/).filter(Boolean);
        const confidences = Array.isArray(data.confidences) ? data.confidences : [];
        const already = this.lastEmittedWordCount.get(session.id) ?? 0;
        const newWords = segmentWords.slice(already);
        this.lastEmittedWordCount.set(session.id, segmentWords.length);
        const now = Date.now();
        for (let i = 0; i < newWords.length; i++) {
          const absIdx = already + i;
          const confRaw = confidences[absIdx];
          const confidence = typeof confRaw === "number" && Number.isFinite(confRaw)
            ? Math.max(0, Math.min(100, confRaw))
            : undefined;
          callback(newWords[i], now, confidence);
        }
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

  onAudioLevel(_session: ASRSession, callback: (level01: number) => void): () => void {
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) return () => {};
    let removed = false;
    let handle: { remove: () => void } | null = null;
    plugin
      .addListener("audioLevel", (data) => {
        if (removed) return;
        const level = typeof data.level === "number" ? Math.max(0, Math.min(1, data.level)) : 0;
        callback(level);
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

  /** يستمع لأحداث الكمون الأصلية (اختياري للواجهة/التقرير). */
  onLatency(callback: (payload: { event: string; msFromButton?: number; cold?: boolean }) => void): () => void {
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) return () => {};
    let removed = false;
    let handle: { remove: () => void } | null = null;
    plugin
      .addListener("latency", (data) => {
        if (removed) return;
        this.latency.ingestNative(data);
        callback({
          event: data.event,
          msFromButton: data.msFromButton,
          cold: data.cold,
        });
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

  getLatencySummary() {
    return this.latency.summarize();
  }

  async endSession(session: ASRSession): Promise<FinalResult> {
    const plugin = getSpeechRecognitionPlugin();
    this.lastEmittedWordCount.delete(session.id);
    const pending = this.pendingStart.get(session.id);
    this.pendingStart.delete(session.id);
    if (this.activeSessionId === session.id) this.activeSessionId = null;
    if (!plugin) return { fullText: "", words: [] };

    try {
      await plugin.stop();
    } catch (err) {
      const classified = classifySpeechPluginError(err);
      if (!pending) {
        throw new ASRProviderUnavailableError({
          code: mapSpeechCode(classified.code),
          message: classified.message,
        });
      }
    }
    try {
      const result = pending ? await pending : { matches: [] as string[] };
      const fullText = (result.matches?.[0] ?? "").trim();
      if (!fullText) {
        throw new ASRProviderUnavailableError({
          code: "NO_SPEECH",
          message: "لم يُكتشف كلام واضح. تأكد من إذن الميكروفون وحاول مجددًا بصوت أوضح.",
        });
      }
      return { fullText, words: fullText.split(/\s+/).filter(Boolean) };
    } catch (err) {
      if (err instanceof ASRProviderUnavailableError) throw err;
      const classified = classifySpeechPluginError(err);
      throw new ASRProviderUnavailableError({
        code: mapSpeechCode(classified.code),
        message: classified.message,
      });
    }
  }

  async teardown(): Promise<void> {
    const plugin = getSpeechRecognitionPlugin();
    this.activeSessionId = null;
    this.pendingStart.clear();
    this.lastEmittedWordCount.clear();
    this.prepared = false;
    this.latency.reset();
    if (plugin) {
      try {
        await plugin.teardown();
      } catch {
        /* تجاهل */
      }
    }
  }
}
