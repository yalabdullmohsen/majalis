import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function isWebSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type UseSpeechRecognitionOptions = {
  language?: string;
  /** يُستدعى عند انتهاء الجلسة (مثلاً لإيقاف الواجهة أو حفظ النص النهائي). */
  onEnd?: () => void;
  /** يُستدعى عند كل تحديث للنص اللحظي. */
  onResult?: (transcript: string) => void;
};

/**
 * خطاف خفيف للتعرّف الصوتي عبر Web Speech API (مجاني، محلي في المتصفح).
 * للجلسات الكاملة مع محاذاة آيات المصحف استخدم مسار `web-speech-provider`
 * عبر `RecitationTestView` — هذا الخطاف للوحات البسيطة واختبارات التلاوة.
 */
export function useSpeechRecognition(
  isListening: boolean,
  { language = "ar-SA", onEnd, onResult }: UseSpeechRecognitionOptions = {},
) {
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => isWebSpeechRecognitionSupported());
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const onEndRef = useRef(onEnd);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onEndRef.current = onEnd;
    onResultRef.current = onResult;
  }, [onEnd, onResult]);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let current = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += `${event.results[i][0].transcript} `;
      }
      const next = current.trim();
      setTranscript(next);
      onResultRef.current?.(next);
    };

    recognition.onerror = (event) => {
      setError(event.error);
    };

    recognition.onend = () => {
      onEndRef.current?.();
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* تجاهل */
      }
      recognitionRef.current = null;
    };
  }, [language]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      setError(null);
      try {
        recognition.start();
      } catch {
        /* start() قد يُرمي إن كانت الجلسة نشطة */
      }
    } else {
      try {
        recognition.stop();
      } catch {
        /* تجاهل */
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return { transcript, setTranscript, resetTranscript, isSupported, error };
}
