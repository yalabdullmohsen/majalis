import { useCallback, useEffect, useRef, useState } from "react";
import { isAndroid, isIOS, isNative } from "@/lib/capacitor-utils";
import {
  classifySpeechPluginError,
  getSpeechRecognitionPlugin,
} from "@/lib/plugins/speech-recognition";
import { diffRecitation, type RecitationDiffResult } from "@/lib/recitation-diff";
import { createMicLatencyTracker } from "@/lib/recitation-mic-latency";

export type RecitationTestState =
  | "idle"
  | "warming"
  | "ready"
  | "requesting-permission"
  | "listening"
  | "processing"
  | "done"
  | "unsupported"
  | "denied"
  | "error"
  | "no_audio";

const CONSENT_KEY = "recitation-test-consent-v1";

export function hasRecitationConsent(): boolean {
  try { return localStorage.getItem(CONSENT_KEY) === "1"; } catch { return false; }
}

export function grantRecitationConsent(): void {
  try { localStorage.setItem(CONSENT_KEY, "1"); } catch { /* تجاهل */ }
}

export function recitationStatusLabel(state: RecitationTestState): string {
  switch (state) {
    case "warming":
      return "جارٍ تهيئة الميكروفون…";
    case "ready":
      return "جاهز — اضغط للبدء";
    case "requesting-permission":
      return "جارٍ طلب إذن الميكروفون…";
    case "listening":
      return "استمع الآن";
    case "processing":
      return "جارٍ المقارنة…";
    case "no_audio":
      return "لم يصل صوت من الميكروفون";
    case "denied":
      return "إذن الميكروفون أو التعرّف مرفوض";
    case "error":
      return "تعذّر التسميع — أعد المحاولة";
    case "unsupported":
      return "التعرّف الصوتي غير متاح على هذا الجهاز";
    default:
      return "";
  }
}

/**
 * اختبار التلاوة: يستمع لصوت المستخدم عبر التعرف الصوتي الأصلي.
 * يسخّن الجلسة عند التركيب (iOS) لتقليل كمون أول ضغط.
 */
export function useRecitationTest(canonicalText: string) {
  const [state, setState] = useState<RecitationTestState>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<RecitationDiffResult | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const webRecognitionRef = useRef<{ stop: () => void } | null>(null);
  const transcriptRef = useRef("");
  const startingRef = useRef(false);
  const latencyRef = useRef(createMicLatencyTracker());
  const unsubsRef = useRef<Array<() => void>>([]);

  const clearUnsubs = () => {
    for (const u of unsubsRef.current) {
      try { u(); } catch { /* ignore */ }
    }
    unsubsRef.current = [];
  };

  // Prewarm عند التركيب على iOS الأصلي
  useEffect(() => {
    if (!(isNative && isIOS)) return;
    let cancelled = false;
    const plugin = getSpeechRecognitionPlugin();
    if (!plugin) return;

    (async () => {
      setState((s) => (s === "idle" ? "warming" : s));
      try {
        const avail = await plugin.available({ language: "ar-SA" });
        if (cancelled) return;
        if (!avail.available) {
          setState("unsupported");
          return;
        }
        // لا تطلب أذونات بصمت إن لم تُمنح بعد — فقط حضّر إن كانت ممنوحة
        const perm = await plugin.requestPermissions();
        if (cancelled) return;
        if (perm.speechRecognition === "granted") {
          await plugin.prepare({ language: "ar-SA" });
          if (!cancelled) setState("ready");
        } else {
          if (!cancelled) setState("idle");
        }
      } catch {
        if (!cancelled) setState("idle");
      }
    })();

    return () => {
      cancelled = true;
      clearUnsubs();
      void plugin.teardown().catch(() => undefined);
    };
  }, []);

  const finish = useCallback((finalText: string) => {
    transcriptRef.current = finalText;
    setTranscript(finalText);
    setState("processing");
    setResult(diffRecitation(canonicalText, finalText));
    setState("done");
    startingRef.current = false;
  }, [canonicalText]);

  const stop = useCallback(async () => {
    // استجابة فورية للواجهة
    setState((s) => (s === "listening" || s === "warming" ? "processing" : s));
    setAudioLevel(0);
    if (isNative && (isIOS || isAndroid)) {
      try {
        await getSpeechRecognitionPlugin()?.stop();
      } catch { /* تجاهل */ }
    } else {
      webRecognitionRef.current?.stop();
    }
    startingRef.current = false;
  }, []);

  const reset = useCallback(() => {
    clearUnsubs();
    setState(isNative && isIOS ? "ready" : "idle");
    setTranscript("");
    setResult(null);
    setErrorMessage(null);
    setAudioLevel(0);
    transcriptRef.current = "";
    startingRef.current = false;
  }, []);

  const start = useCallback(async () => {
    if (startingRef.current) return; // منع جلسات مزدوجة
    startingRef.current = true;
    setResult(null);
    setTranscript("");
    setErrorMessage(null);
    setAudioLevel(0);
    transcriptRef.current = "";
    clearUnsubs();
    latencyRef.current.markButton();
    setState("warming");

    if (isNative && (isIOS || isAndroid)) {
      const plugin = getSpeechRecognitionPlugin();
      if (!plugin) { setState("unsupported"); startingRef.current = false; return; }
      try {
        const avail = await plugin.available({ language: "ar-SA" });
        if (!avail.available) { setState("unsupported"); startingRef.current = false; return; }

        setState("requesting-permission");
        const perm = await plugin.requestPermissions();
        if (perm.speechRecognition === "denied" || perm.speechRecognition === "restricted") {
          setState("denied");
          setErrorMessage(
            perm.microphone === "denied"
              ? "إذن الميكروفون مرفوض. فعّله من إعدادات الجهاز."
              : "إذن التعرّف على الكلام مرفوض. فعّله من إعدادات الجهاز.",
          );
          startingRef.current = false;
          return;
        }
        if (perm.speechRecognition !== "granted") {
          setState("error");
          setErrorMessage("لم يكتمل منح الأذونات. أعد المحاولة.");
          startingRef.current = false;
          return;
        }

        await plugin.prepare({ language: "ar-SA" });
        setState("listening");

        const partialHandle = await plugin.addListener("partialResults", (data) => {
          const text = data.matches?.[0] || "";
          transcriptRef.current = text;
          setTranscript(text);
        });
        unsubsRef.current.push(() => partialHandle.remove());

        const levelHandle = await plugin.addListener("audioLevel", (data) => {
          setAudioLevel(typeof data.level === "number" ? data.level : 0);
        });
        unsubsRef.current.push(() => levelHandle.remove());

        const latencyHandle = await plugin.addListener("latency", (data) => {
          latencyRef.current.ingestNative(data);
        });
        unsubsRef.current.push(() => latencyHandle.remove());

        const stateHandle = await plugin.addListener("listeningState", (data) => {
          if (data.state === "no_audio") {
            setState("no_audio");
            setErrorMessage("لم يصل أي صوت من الميكروفون خلال ثانية. تحقّق من الإذن أو سماعة Bluetooth.");
            startingRef.current = false;
          }
        });
        unsubsRef.current.push(() => stateHandle.remove());

        try {
          const res = await plugin.start({
            language: "ar-SA",
            partialResults: true,
            popup: false,
            maxResults: 1,
            preferOnDevice: true,
          });
          const text = res.matches?.[0] || transcriptRef.current;
          if (!text.trim()) {
            setTranscript("");
            setState("error");
            setErrorMessage("لم يُكتشف كلام واضح. حاول مجددًا بصوت أوضح.");
            startingRef.current = false;
            return;
          }
          finish(text);
        } finally {
          clearUnsubs();
          setAudioLevel(0);
        }
      } catch (err) {
        const classified = classifySpeechPluginError(err);
        console.error("[useRecitationTest]", classified.code, classified.message);
        setErrorMessage(classified.message);
        if (classified.code === "NO_AUDIO_BUFFER") {
          setState("no_audio");
        } else if (
          classified.code === "SPEECH_DENIED" ||
          classified.code === "MICROPHONE_DENIED" ||
          classified.code === "SPEECH_NOT_DETERMINED" ||
          classified.code === "MICROPHONE_NOT_DETERMINED"
        ) {
          setState("denied");
        } else {
          setState("error");
        }
        startingRef.current = false;
      }
      return;
    }

    if (isNative) { setState("unsupported"); startingRef.current = false; return; }

    type SpeechRecognitionCtor = new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      continuous: boolean;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: ((event?: { error?: string }) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { setState("unsupported"); startingRef.current = false; return; }

    try {
      const recognition = new SR();
      recognition.lang = "ar-SA";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;
      webRecognitionRef.current = { stop: () => recognition.stop() };

      recognition.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
        transcriptRef.current = text;
        setTranscript(text);
      };
      recognition.onerror = (e) => {
        startingRef.current = false;
        if (e?.error === "not-allowed") {
          setState("denied");
          setErrorMessage("إذن الميكروفون مرفوض.");
        } else if (e?.error === "no-speech") {
          setState("error");
          setErrorMessage("لم يُكتشف كلام واضح.");
        } else {
          setState("error");
          setErrorMessage("تعذّر التعرّف الصوتي.");
        }
      };
      recognition.onend = () => finish(transcriptRef.current);

      setState("listening");
      recognition.start();
    } catch {
      setState("error");
      setErrorMessage("تعذّر بدء التعرّف الصوتي.");
      startingRef.current = false;
    }
  }, [finish]);

  return {
    state,
    transcript,
    result,
    audioLevel,
    errorMessage,
    statusLabel: recitationStatusLabel(state),
    start,
    stop,
    reset,
    latencySummary: () => latencyRef.current.summarize(),
  };
}
