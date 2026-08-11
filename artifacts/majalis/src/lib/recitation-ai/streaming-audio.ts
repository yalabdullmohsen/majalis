/**
 * ثوابت بث الصوت للتسميع — مشتركة بين مسار REST (Groq) ومسار WebSocket.
 * الهدف: شرائح 200–300ms مع VAD على الجهاز لتقليل الكمون دون تجميد الواجهة.
 */

/** مدة كل دفعة MediaRecorder (هدف Tarteel-like: 200–300ms) */
export const SLICE_MS = 250;

/** عدد الشرائح في النافذة المتداخلة (~0.75ث سياق) */
export const WINDOW_SLICES = 3;

/** معدل بت منخفض يكفي للعربية مع opus/webm */
export const AUDIO_BITS_PER_SECOND = 24_000;

export const MIN_BLOB_BYTES = 80;

export function pickSupportedMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  for (const c of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* next */
    }
  }
  return "audio/webm";
}

export function blobToBase64(blob: Blob): Promise<string> {
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

/** عنوان بوابة ASR عبر WebSocket (خدمة طويلة العمر — ليست Vercel Function). */
export function getRecitationWsUrl(): string | null {
  try {
    const raw =
      typeof import.meta !== "undefined"
        ? String((import.meta.env as { VITE_RECITATION_WS_URL?: string }).VITE_RECITATION_WS_URL || "").trim()
        : "";
    if (!raw) return null;
    if (!/^wss?:\/\//i.test(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

/** رمز اختياري يُرسَل في أول رسالة JSON بعد الاتصال (بوابة خاصة / Deepgram proxy). */
export function getRecitationWsToken(): string | null {
  try {
    const raw =
      typeof import.meta !== "undefined"
        ? String((import.meta.env as { VITE_RECITATION_WS_TOKEN?: string }).VITE_RECITATION_WS_TOKEN || "").trim()
        : "";
    return raw || null;
  } catch {
    return null;
  }
}
