/**
 * قراءة عربية عبر Web Speech API — بلا خدمة خارجية.
 * يوقف أي نطق سابق قبل البدء.
 */

export type SpeechReadAloudState = "idle" | "speaking" | "unsupported";

function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[✦★☆•●○◆◇]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSpeechReadAloudSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

export function stopSpeechReadAloud(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export function speakArabicText(
  text: string,
  options?: { rate?: number; onEnd?: () => void; onError?: () => void },
): SpeechReadAloudState {
  if (!isSpeechReadAloudSupported()) return "unsupported";
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return "idle";

  stopSpeechReadAloud();
  const utter = new SpeechSynthesisUtterance(cleaned);
  utter.lang = "ar";
  utter.rate = options?.rate ?? 0.92;
  utter.onend = () => options?.onEnd?.();
  utter.onerror = () => options?.onError?.();

  try {
    window.speechSynthesis.speak(utter);
    return "speaking";
  } catch {
    options?.onError?.();
    return "unsupported";
  }
}
