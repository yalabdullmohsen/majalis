/**
 * mock-provider.ts
 * مزوّد وهمي **للاختبارات الآلية فقط** — لا يظهر للمستخدم أبدًا (غير
 * مُدرَج في أي شاشة إعداد أو منطق اختيار مزوّد تلقائي). يُعيد كلمات
 * مُعدَّة سلفًا عبر feedScriptedWord() بدل معالجة صوت فعلي — يُستخدَم
 * لاختبار طبقات الجلسة/الواجهة دون الحاجة لصوت حقيقي أو محاكاة معقّدة.
 */
import type { ASRSession, AudioChunk, FinalResult, PartialResult, QuranASRProvider, RecitationConfig } from "../asr-provider";

export class MockQuranASRProvider implements QuranASRProvider {
  readonly id = "mock";
  readonly supportsStreaming = true;
  readonly supportsTajweed = false;
  readonly worksOffline = true;
  readonly capturesAudioInternally = true;

  private listeners = new Map<string, Set<(word: string, atMs: number, confidence?: number) => void>>();
  private transcripts = new Map<string, string[]>();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async startSession(_config: RecitationConfig): Promise<ASRSession> {
    const id = `mock-${Math.random().toString(36).slice(2)}`;
    this.transcripts.set(id, []);
    return { id, provider: this.id };
  }

  async transcribeChunk(_session: ASRSession, _chunk: AudioChunk): Promise<PartialResult | null> {
    return null; // capturesAudioInternally=true — استخدم feedScriptedWord بدلاً
  }

  onPartialWord(session: ASRSession, callback: (word: string, atMs: number, confidence?: number) => void): () => void {
    if (!this.listeners.has(session.id)) this.listeners.set(session.id, new Set());
    this.listeners.get(session.id)!.add(callback);
    return () => this.listeners.get(session.id)?.delete(callback);
  }

  /** يُستخدَم من الاختبارات فقط لمحاكاة كلمة "مسموعة" واحدة — confidence اختياري (0-100) لاختبار تصنيف "غير واضح". */
  feedScriptedWord(session: ASRSession, word: string, atMs: number, confidence?: number): void {
    this.transcripts.get(session.id)?.push(word);
    for (const cb of this.listeners.get(session.id) ?? []) cb(word, atMs, confidence);
  }

  async endSession(session: ASRSession): Promise<FinalResult> {
    const words = this.transcripts.get(session.id) ?? [];
    this.transcripts.delete(session.id);
    this.listeners.delete(session.id);
    return { fullText: words.join(" "), words };
  }
}
