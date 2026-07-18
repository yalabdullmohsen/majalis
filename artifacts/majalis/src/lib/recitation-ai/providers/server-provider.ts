/**
 * server-provider.ts
 * مزوّد خادمي حقيقي: يلتقط الصوت داخليًا عبر getUserMedia + MediaRecorder
 * (يعمل على Safari/iOS أيضًا — خلافًا لـWebSpeechQuranASRProvider الذي
 * يعتمد على Web Speech API غير المتوفرة إطلاقًا هناك، وهذا هو السبب
 * الجذري الموثَّق لشكوى "لا يُلتقط الصوت أحيانًا" لمستخدمي آيفون عبر
 * المتصفح لا التطبيق المُثبَّت)، ويُرسِل مقاطع قصيرة (~3 ثوانٍ) إلى
 * /api/recitation-transcribe (وسيط خادمي يستدعي Groq whisper-large-v3 —
 * راجع تعليق ذلك الملف لتفاصيل قرار المعمارية وسبب تجنُّب نموذج ترتيل
 * عمدًا) ويُغذّي الكلمات الناتجة لمحرك المحاذاة عبر onPartialWord، بنفس
 * العقد المستخدَم من المزوّدين الآخرين تمامًا — RecitationTestPage.tsx
 * لا يحتاج أي تعديل ليستهلك هذا المزوّد.
 *
 * ⚠️ حدّ صادق موثَّق: كل مقطع (~3 ثوانٍ) ملف صوتي مستقل تمامًا (لا بث
 * حقيقي عبر WebSocket) — كلمة تقع بالضبط على حدود مقطعين قد تُفقَد أو
 * تتكرر جزئيًا. تحسين مستقبلي حقيقي: مزوّد بث حقيقي (WebSocket) بدل هذا
 * التقطيع الدوري، خارج نطاق هذه الجولة (يحتاج بنية خادم تدعم اتصالات
 * طويلة العمر، غير متوفرة في Vercel Serverless القائم).
 *
 * ⚠️ قرار تعمُّدي: **لا** يُستخدَم tarteel-ai/whisper-base-ar-quran رغم
 * كونه المرشَّح الذي حدَّده بحث سابق في هذه الجلسة — يتعارض مع قيد صريح
 * سابق في نفس الجلسة: "لا استخدام API/نموذج/بيانات أي منافس" (ترتيل
 * منافس مباشر). whisper-large-v3 نموذج عام محايد لا علاقة له بأي منافس،
 * ويعمل بدقة معقولة هنا تحديدًا لأن المطابقة تُجرى ضد نص متوقَّع معروف
 * مسبقًا (محاذاة نافذة منزلقة في VerseAlignmentEngine) لا تفريغًا حرًّا.
 *
 * لا صوت يُخزَّن — كل مقطع يُرسَل لـ/api/recitation-transcribe، يُعالَج
 * فورًا، ثم يُهمَل تمامًا (لا كتابة على القرص هناك، راجع ذلك الملف).
 */
import type { ASRSession, AudioChunk, FinalResult, PartialResult, QuranASRProvider, RecitationConfig } from "../asr-provider";
import { ASRProviderUnavailableError } from "../asr-provider";

const ENDPOINT = "/api/recitation-transcribe";
const SEGMENT_MS = 3000;

type Active = {
  stream: MediaStream;
  recorder: MediaRecorder | null;
  mimeType: string;
  words: string[];
  listeners: Set<(word: string, atMs: number, confidence?: number) => void>;
  stopped: boolean;
  segmentTimer: ReturnType<typeof setTimeout> | null;
  pendingSegments: Promise<void>[];
};

function pickSupportedMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  for (const c of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
    } catch { /* تجاهل — جرّب المرشَّح التالي */ }
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

export class ServerQuranASRProvider implements QuranASRProvider {
  readonly id = "server";
  readonly supportsStreaming = true;
  readonly supportsTajweed = false; // whisper-large-v3 عام — لا تحليل تجويد فونيمي متخصص
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
    // فحص التهيئة أولاً — قبل طلب إذن الميكروفون: لولا هذا، لو استُدعيت
    // startSession مباشرة بلا المرور عبر selectBestProvider (الذي يفحص
    // isAvailable() فعلاً)، كان المستخدم سيُطالَب بإذن ميكروفون غير مجدٍ
    // إطلاقًا (كل مقطع لاحقًا كان سيصطدم بـ503 صامتًا — يبدو الميكروفون
    // "يعمل" بينما لا شيء يصل فعليًا؛ بالضبط فئة الأعطال الصامتة الممنوعة).
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
    const active: Active = {
      stream,
      recorder: null,
      mimeType: pickSupportedMimeType(),
      words: [],
      listeners: new Set(),
      stopped: false,
      segmentTimer: null,
      pendingSegments: [],
    };
    this.sessions.set(id, active);
    this.recordNextSegment(id, active);

    return { id, provider: this.id };
  }

  /** يُسجِّل مقطعًا واحدًا (~3 ثوانٍ) بمُسجِّل مستقل تمامًا (ملف صالح قائم بذاته)، ثم يُرسله ويُعيد جدولة المقطع التالي فور انتهاء التسجيل (لا انتظار نتيجة الإرسال — لا فجوة استماع بسبب بطء الشبكة). */
  private recordNextSegment(sessionId: string, active: Active) {
    if (active.stopped) return;
    const recorder = new MediaRecorder(active.stream, { mimeType: active.mimeType });
    active.recorder = recorder;
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: active.mimeType });
      if (blob.size > 200) { // تجاهل مقاطع فارغة/ضجيج بالغ الصغر (صمت تام)
        const sendPromise = this.sendSegment(active, blob).catch(() => {});
        active.pendingSegments.push(sendPromise);
      }
      if (!active.stopped) this.recordNextSegment(sessionId, active);
    };

    recorder.start();
    active.segmentTimer = setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, SEGMENT_MS);
  }

  private async sendSegment(active: Active, blob: Blob): Promise<void> {
    const audioBase64 = await blobToBase64(blob);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, mimeType: active.mimeType }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const text = typeof data?.text === "string" ? data.text : "";
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    active.words.push(...words);
    const now = Date.now();
    // Groq لا يُبلِّغ ثقة تعرّف لكل كلمة — confidence=undefined (يُعطِّل
    // تصنيف "غير واضح" بأمان لهذا المزوّد، نفس سلوك on-device-provider.ts).
    for (const w of words) for (const cb of active.listeners) cb(w, now, undefined);
  }

  async transcribeChunk(_session: ASRSession, _chunk: AudioChunk): Promise<PartialResult | null> {
    return null; // capturesAudioInternally=true
  }

  onPartialWord(session: ASRSession, callback: (word: string, atMs: number, confidence?: number) => void): () => void {
    const active = this.sessions.get(session.id);
    if (!active) return () => {};
    active.listeners.add(callback);
    return () => active.listeners.delete(callback);
  }

  async endSession(session: ASRSession): Promise<FinalResult> {
    const active = this.sessions.get(session.id);
    this.sessions.delete(session.id);
    if (!active) return { fullText: "", words: [] };

    active.stopped = true;
    if (active.segmentTimer) clearTimeout(active.segmentTimer);
    if (active.recorder && active.recorder.state !== "inactive") active.recorder.stop();
    for (const track of active.stream.getTracks()) track.stop(); // يُطفئ مؤشر الميكروفون في المتصفح فورًا

    await Promise.all(active.pendingSegments).catch(() => {});
    return { fullText: active.words.join(" "), words: active.words };
  }
}
