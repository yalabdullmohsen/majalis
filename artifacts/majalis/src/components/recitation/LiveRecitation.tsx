import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { matchRecitationAdvanced } from "@/lib/recitation-ai/audio-matcher";
import type { ReferenceWord } from "@/lib/recitation-ai/types";
import { ensureMicPermission } from "@/lib/mic-permission";

export type LiveRecitationWord = {
  key: string;
  text: string;
};

type WordStatus = "pending" | "correct" | "incorrect";

export type LiveRecitationProps = {
  words: LiveRecitationWord[];
  matchingStrict?: boolean;
  className?: string;
  onSessionEnd?: (result: LiveRecitationSessionResult) => void;
};

export type LiveRecitationSessionResult = {
  correct: number;
  total: number;
  accuracyPct: number;
};

function buildSessionResult(
  wordsStatus: Array<LiveRecitationWord & { status: WordStatus }>,
): LiveRecitationSessionResult {
  const total = wordsStatus.length;
  const correct = wordsStatus.filter((w) => w.status === "correct").length;
  const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, accuracyPct };
}

export function referenceWordsToLiveRecitation(words: ReferenceWord[]): LiveRecitationWord[] {
  return words.map((w) => ({
    key: `${w.surah}:${w.ayah}:${w.wordIndex}`,
    text: w.raw,
  }));
}

/**
 * تلاوة حية مبسّطة: Web Speech API + إخفاء الكلمات القادمة + تلوين لحظي.
 * للجلسات الكاملة (تقرير، محاذاة متقدمة، مزوّدو ASR) استخدم RecitationTestView.
 */
export function LiveRecitation({ words, matchingStrict = false, className, onSessionEnd }: LiveRecitationProps) {
  const [isListening, setIsListening] = useState(false);
  const { transcript, isSupported, error, resetTranscript } = useSpeechRecognition(isListening);
  const [wordsStatus, setWordsStatus] = useState<Array<LiveRecitationWord & { status: WordStatus }>>(() =>
    words.map((w) => ({ ...w, status: "pending" as const })),
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const sessionEndedRef = useRef(false);

  useEffect(() => {
    setWordsStatus(words.map((w) => ({ ...w, status: "pending" as const })));
    setCurrentWordIndex(0);
    resetTranscript();
    setIsListening(false);
    sessionEndedRef.current = false;
  }, [words, resetTranscript]);

  useEffect(() => {
    activeWordRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [currentWordIndex]);

  useEffect(() => {
    if (!transcript || currentWordIndex >= words.length) return;

    const spokenWords = transcript.split(/\s+/).filter(Boolean);
    const latestSpokenWord = spokenWords[spokenWords.length - 1];
    if (!latestSpokenWord) return;

    const expectedWord = words[currentWordIndex]?.text;
    if (!expectedWord) return;

    if (matchRecitationAdvanced(expectedWord, latestSpokenWord, matchingStrict)) {
      setWordsStatus((prev) => {
        const next = [...prev];
        next[currentWordIndex] = { ...next[currentWordIndex]!, status: "correct" };
        return next;
      });
      setCurrentWordIndex((i) => i + 1);
    }
  }, [transcript, currentWordIndex, matchingStrict, words]);

  useEffect(() => {
    if (!onSessionEnd || sessionEndedRef.current || words.length === 0) return;
    if (currentWordIndex < words.length) return;
    sessionEndedRef.current = true;
    setIsListening(false);
    onSessionEnd(buildSessionResult(wordsStatus));
  }, [currentWordIndex, onSessionEnd, words.length, wordsStatus]);

  const finishSession = () => {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;
    setIsListening(false);
    onSessionEnd?.(buildSessionResult(wordsStatus));
  };

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const mic = await ensureMicPermission();
    if (!mic.ok) return;
    resetTranscript();
    setIsListening(true);
  };

  if (!isSupported) {
    return (
      <p className="live-rec__unsupported" role="status">
        التعرّف الصوتي غير مدعوم في هذا المتصفح (جرّب Chrome أو Safari).
      </p>
    );
  }

  return (
    <div className={["live-rec", className].filter(Boolean).join(" ")}>
      <div className="live-rec__toolbar">
        <button
          type="button"
          className={`live-rec__mic ${isListening ? "live-rec__mic--stop" : "live-rec__mic--start"}`}
          onClick={() => void toggleListening()}
        >
          {isListening ? "إيقاف التسجيل" : "بدء التلاوة"}
        </button>
        {onSessionEnd && (
          <button type="button" className="live-rec__end" onClick={finishSession}>
            إنهاء الجلسة
          </button>
        )}
        {isListening && (
          <div className="live-rec__listening" role="status" aria-live="polite">
            <span className="live-rec__pulse" aria-hidden="true" />
            <span>جاري الاستماع…</span>
          </div>
        )}
        {error && !isListening && (
          <p className="live-rec__error" role="alert">
            تعذّر التعرّف الصوتي ({error})
          </p>
        )}
      </div>

      <div className="live-rec__words imr-page" dir="rtl">
        {wordsStatus.map((word, index) => {
          const isActive = index === currentWordIndex;
          const stateClass =
            word.status === "correct"
              ? "imr-word--revealed"
              : word.status === "incorrect"
                ? "imr-word--error"
                : isActive
                  ? "imr-word--cursor"
                  : "imr-word--hidden";

          return (
            <span
              key={word.key}
              ref={isActive ? activeWordRef : undefined}
              className={`imr-word live-rec__word ${stateClass}`}
            >
              {word.text}
              {index < wordsStatus.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}
