/**
 * قراءة عربية عبر Web Speech API — بلا خدمة خارجية.
 * يوقف أي نطق سابق قبل البدء.
 * المسار المحسَّن: مقاطع متتابعة بفواصل (إيقاع) بدل utterance واحد خام.
 */

export type SpeechReadAloudState = "idle" | "speaking" | "unsupported";

let segmentTimer: ReturnType<typeof setTimeout> | null = null;
let segmentGeneration = 0;

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
  segmentGeneration += 1;
  if (segmentTimer) {
    clearTimeout(segmentTimer);
    segmentTimer = null;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/** مسار قديم — نص واحد. يُفضَّل speakArabicSegments بعد التجهيز. */
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

/**
 * تشغيل تدريجي: يبدأ أول مقطع فورًا، ثم الباقي بفواصل.
 * لا يمرّر نصًا خامًا — المقاطع يفترض أنها بعد Prep/Lexicon.
 */
export function speakArabicSegments(
  segments: string[],
  options?: {
    rate?: number;
    gapMs?: number;
    onEnd?: () => void;
    onError?: () => void;
  },
): SpeechReadAloudState {
  if (!isSpeechReadAloudSupported()) return "unsupported";
  const parts = segments.map(cleanTextForSpeech).filter(Boolean);
  if (!parts.length) return "idle";

  stopSpeechReadAloud();
  const gen = segmentGeneration;
  const rate = options?.rate ?? 0.92;
  const gapMs = Math.max(80, options?.gapMs ?? 280);
  let idx = 0;

  const speakNext = () => {
    if (gen !== segmentGeneration) return;
    if (idx >= parts.length) {
      options?.onEnd?.();
      return;
    }
    const utter = new SpeechSynthesisUtterance(parts[idx]!);
    utter.lang = "ar";
    utter.rate = rate;
    utter.onend = () => {
      if (gen !== segmentGeneration) return;
      idx += 1;
      if (idx >= parts.length) {
        options?.onEnd?.();
        return;
      }
      segmentTimer = setTimeout(speakNext, gapMs);
    };
    utter.onerror = () => {
      if (gen !== segmentGeneration) return;
      options?.onError?.();
    };
    try {
      window.speechSynthesis.speak(utter);
    } catch {
      options?.onError?.();
    }
  };

  speakNext();
  return "speaking";
}
