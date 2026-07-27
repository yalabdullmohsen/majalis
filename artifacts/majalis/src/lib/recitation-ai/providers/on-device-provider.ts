/**
 * on-device-provider.ts
 * يُغلّف الجسر الأصلي (SFSpeech / Android SpeechRecognizer) كـQuranASRProvider.
 * يمرّر ثقة كل كلمة من segments / EXTRA_CONFIDENCE_SCORES عند توفرها.
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

    const startPromise = plugin.start({ language: config.language, partialResults: true, popup: false, maxResults: 1 });
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

  async endSession(session: ASRSession): Promise<FinalResult> {
    const plugin = getSpeechRecognitionPlugin();
    this.lastEmittedWordCount.delete(session.id);
    const pending = this.pendingStart.get(session.id);
    this.pendingStart.delete(session.id);
    if (!plugin) return { fullText: "", words: [] };

    await plugin.stop();
    const result = pending ? await pending : { matches: [] as string[] };
    const fullText = result.matches?.[0] ?? "";
    return { fullText, words: fullText.split(/\s+/).filter(Boolean) };
  }
}
