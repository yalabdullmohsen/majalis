import { useCallback, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { RotateCcw } from "lucide-react";
import { RecitationSetup } from "@/components/recitation/RecitationSetup";
import type { RecitationSetupConfig } from "@/lib/recitation-ai/recitation-setup-types";
import {
  LiveRecitation,
  referenceWordsToLiveRecitation,
  type LiveRecitationSessionResult,
} from "@/components/recitation/LiveRecitation";
import { CircularProgress } from "@/components/recitation/CircularProgress";
import { loadReferenceWordsForSetup } from "@/lib/recitation-ai/load-setup-words";
import type { LiveRecitationWord } from "@/components/recitation/LiveRecitation";
import "@/styles/recitation-ai.css";

type ModulePhase = "setup" | "loading" | "session" | "report";

/**
 * مسار التلاوة المبسّط: إعدادات → تلاوة حية → تقرير الجلسة.
 * للجلسات المتقدمة (مزوّدو ASR، أوضاع الحفظ، تقرير مفصّل) استخدم
 * `/quran/recitation-test-ai?advanced=1`.
 */
export function RecitationModule() {
  const search = useSearch();
  const initialSurah = useMemo(() => {
    const surahParam = Number(new URLSearchParams(search).get("surah"));
    return surahParam >= 1 && surahParam <= 114 ? surahParam : 1;
  }, [search]);

  const [phase, setPhase] = useState<ModulePhase>("setup");
  const [config, setConfig] = useState<RecitationSetupConfig | null>(null);
  const [words, setWords] = useState<LiveRecitationWord[]>([]);
  const [result, setResult] = useState<LiveRecitationSessionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStart = useCallback(async (nextConfig: RecitationSetupConfig) => {
    setConfig(nextConfig);
    setErrorMsg(null);
    setPhase("loading");
    try {
      const refWords = await loadReferenceWordsForSetup(nextConfig);
      setWords(referenceWordsToLiveRecitation(refWords));
      setPhase("session");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "تعذّر تحميل نطاق التلاوة.");
      setPhase("setup");
    }
  }, []);

  const handleSessionEnd = useCallback((sessionResult: LiveRecitationSessionResult) => {
    setResult(sessionResult);
    setPhase("report");
  }, []);

  const handleRestart = useCallback(() => {
    setResult(null);
    setWords([]);
    setConfig(null);
    setPhase("setup");
  }, []);

  if (phase === "loading") {
    return (
      <div className="rai-module" dir="rtl">
        <p className="rai-module__status" role="status">
          جارٍ تحميل نطاق التلاوة…
        </p>
      </div>
    );
  }

  if (phase === "session" && config) {
    return (
      <div className="rai-module" dir="rtl">
        <LiveRecitation
          words={words}
          matchingStrict={config.matchingStrict}
          onSessionEnd={handleSessionEnd}
        />
      </div>
    );
  }

  if (phase === "report" && result) {
    return (
      <div className="rai-module rai-report" dir="rtl">
        <h2 className="rai-module__title">تقرير الجلسة</h2>
        <div className="rai-report__ring-wrap">
          <CircularProgress percentage={result.accuracyPct} label="نسبة الإتقان" />
        </div>
        <p className="rai-module__summary">
          أتممت {result.correct} من {result.total} كلمة بنجاح.
        </p>
        <button type="button" className="rai-start-btn" onClick={handleRestart}>
          <RotateCcw size={16} aria-hidden="true" /> جلسة جديدة
        </button>
      </div>
    );
  }

  return (
    <div className="rai-module" dir="rtl">
      {errorMsg && (
        <p className="rai-module__error" role="alert">
          {errorMsg}
        </p>
      )}
      <RecitationSetup onStartRecitation={(cfg) => void handleStart(cfg)} initialSurah={initialSurah} />
    </div>
  );
}

export default RecitationModule;
