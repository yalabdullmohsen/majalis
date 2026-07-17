import { useCallback, useRef, useState } from "react";
import { isIOS, isNative } from "@/lib/capacitor-utils";
import { getSpeechRecognitionPlugin } from "@/lib/plugins/speech-recognition";
import { diffRecitation, type RecitationDiffResult } from "@/lib/recitation-diff";

export type RecitationTestState =
  | "idle" | "requesting-permission" | "listening" | "processing" | "done" | "unsupported" | "denied" | "error";

const CONSENT_KEY = "recitation-test-consent-v1";

export function hasRecitationConsent(): boolean {
  try { return localStorage.getItem(CONSENT_KEY) === "1"; } catch { return false; }
}

export function grantRecitationConsent(): void {
  try { localStorage.setItem(CONSENT_KEY, "1"); } catch { /* تجاهل */ }
}

/**
 * اختبار التلاوة: يستمع لصوت المستخدم عبر التعرف الصوتي الأصلي لتطبيق iOS
 * (SFSpeechRecognizer، عبر MajlisSpeechRecognitionPlugin.swift المحلي — لا
 * توجد حزمة أندرويد بعد) أو Web Speech API على متصفحات الويب التي تدعمها
 * (Chrome/Edge؛ Safari لا يدعمها إطلاقًا فتكون النتيجة "unsupported")، ثم
 * يقارن النص المتعرَّف عليه بالآية عبر diffRecitation.
 *
 * لا يُرسَل أي صوت أو نص إلى خوادم مجالس نفسها — المقارنة بالكامل على
 * الجهاز/المتصفح؛ التعرف الصوتي نفسه قد يعالجه Apple/Google خارجيًا حسب
 * سياسة نظام التشغيل (مُفصح عنه صراحة في واجهة الموافقة وسياسة الخصوصية).
 */
export function useRecitationTest(canonicalText: string) {
  const [state, setState] = useState<RecitationTestState>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<RecitationDiffResult | null>(null);
  const webRecognitionRef = useRef<{ stop: () => void } | null>(null);
  const transcriptRef = useRef("");

  const finish = useCallback((finalText: string) => {
    transcriptRef.current = finalText;
    setTranscript(finalText);
    setState("processing");
    setResult(diffRecitation(canonicalText, finalText));
    setState("done");
  }, [canonicalText]);

  const stop = useCallback(async () => {
    if (isNative && isIOS) {
      try {
        await getSpeechRecognitionPlugin()?.stop();
      } catch { /* تجاهل */ }
    } else {
      webRecognitionRef.current?.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setTranscript("");
    setResult(null);
    transcriptRef.current = "";
  }, []);

  const start = useCallback(async () => {
    setResult(null);
    setTranscript("");
    transcriptRef.current = "";
    setState("requesting-permission");

    if (isNative && isIOS) {
      const plugin = getSpeechRecognitionPlugin();
      if (!plugin) { setState("unsupported"); return; }
      try {
        const avail = await plugin.available();
        if (!avail.available) { setState("unsupported"); return; }

        const perm = await plugin.requestPermissions();
        if (perm.speechRecognition !== "granted") { setState("denied"); return; }

        setState("listening");
        const handle = await plugin.addListener("partialResults", (data) => {
          const text = data.matches?.[0] || "";
          transcriptRef.current = text;
          setTranscript(text);
        });

        try {
          const res = await plugin.start({ language: "ar-SA", partialResults: true, popup: false, maxResults: 1 });
          finish(res.matches?.[0] || transcriptRef.current);
        } finally {
          handle.remove();
        }
      } catch {
        setState("error");
      }
      return;
    }

    if (isNative) { setState("unsupported"); return; }

    // ويب: Web Speech API — غير مدعومة على Safari/Firefox، ندخل حالة unsupported بأمان
    type SpeechRecognitionCtor = new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { setState("unsupported"); return; }

    try {
      const recognition = new SR();
      recognition.lang = "ar-SA";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      webRecognitionRef.current = { stop: () => recognition.stop() };

      recognition.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
        transcriptRef.current = text;
        setTranscript(text);
      };
      recognition.onerror = () => setState("error");
      recognition.onend = () => finish(transcriptRef.current);

      setState("listening");
      recognition.start();
    } catch {
      setState("error");
    }
  }, [finish]);

  return { state, transcript, result, start, stop, reset };
}
