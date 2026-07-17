import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import { Pause, Square, ChevronLeft } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { useAuth } from "@/components/AuthProvider";
import { fetchSurahDetail, getSurahList } from "@/lib/quran-api";
import { buildReferenceWords } from "@/lib/recitation-ai/quran-reference-words";
import { VerseAlignmentEngine } from "@/lib/recitation-ai/verse-alignment-engine";
import { postProcessAlignmentEvents } from "@/lib/recitation-ai/error-detector";
import { overallSessionConfidence } from "@/lib/recitation-ai/confidence-scorer";
import { selectBestProvider } from "@/lib/recitation-ai/provider-registry";
import type { QuranASRProvider, ASRSession } from "@/lib/recitation-ai/asr-provider";
import { checkTajweedAvailability } from "@/lib/recitation-ai/precision-level";
import { saveRecitationSession } from "@/lib/recitation-ai/recitation-session-service";
import { addRecitationReviewItem } from "@/lib/recitation-ai/recitation-review-service";
import { InteractiveMushafReveal, type WordRevealInfo } from "@/components/quran/InteractiveMushafReveal";
import type { AlertLevel, AlignmentEvent, PrecisionLevel, RecitationMode, ReferenceWord } from "@/lib/recitation-ai/types";
import "@/styles/recitation-ai.css";

type Phase = "setup" | "loading" | "session" | "report" | "error";

const MODE_LABELS: Record<RecitationMode, { label: string; hint: string }> = {
  full_hide: { label: "التسميع الكامل", hint: "النص مخفٍ تمامًا" },
  assisted: { label: "التسميع بالمساعدة", hint: "تلميح متدرج عند التوقف" },
  word_follow: { label: "المتابعة كلمة بكلمة", hint: "الصفحة ظاهرة، تُظلَّل الكلمات الصحيحة" },
  interactive_mushaf: { label: "المصحف التفاعلي", hint: "الكلمات مموَّهة وتنكشف بتلاوتك" },
  teacher_test: { label: "اختبار المعلّم", hint: "يبدأ من موضع عشوائي" },
};

const ALERT_LABELS: Record<AlertLevel, string> = { gentle: "لطيف", medium: "متوسط", immediate: "فوري" };

function RecitationTestPageInner() {
  const search = useSearch();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("setup");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // إعداد
  const [surahNumber, setSurahNumber] = useState(1);
  const [mode, setMode] = useState<RecitationMode>("interactive_mushaf");
  const [precisionLevel, setPrecisionLevel] = useState<PrecisionLevel>("hifz");
  const [alertLevel, setAlertLevel] = useState<AlertLevel>("gentle");
  const [revealGranularity, setRevealGranularity] = useState<"word" | "ayah">("word");
  const [tajweedAvailable, setTajweedAvailable] = useState<{ available: boolean; reason?: string } | null>(null);

  // جلسة
  const [referenceWords, setReferenceWords] = useState<ReferenceWord[]>([]);
  const [wordStates, setWordStates] = useState<Map<string, "hidden" | "revealed" | "error">>(new Map());
  const [cursorIdx, setCursorIdx] = useState(0);
  const [liveEvents, setLiveEvents] = useState<AlignmentEvent[]>([]);
  const [justCompletedAyah, setJustCompletedAyah] = useState<number | null>(null);
  const [listening, setListening] = useState(false);

  const engineRef = useRef<VerseAlignmentEngine | null>(null);
  const providerRef = useRef<QuranASRProvider | null>(null);
  const asrSessionRef = useRef<ASRSession | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const sessionStartRef = useRef<number>(0);

  useEffect(() => {
    applyPageSeo({
      path: "/quran/recitation-test-ai",
      title: "اختبار التسميع بالذكاء الاصطناعي | المجلس العلمي",
      description: "سمّع من حفظك واستمع التطبيق لتلاوتك لحظيًا، مع كشف تدريجي للمصحف وتقرير تفصيلي.",
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const surahParam = Number(params.get("surah"));
    if (surahParam >= 1 && surahParam <= 114) {
      // مدخل "سمّع هذه السورة" من قارئ المصحف — القسم 1
      setSurahNumber(surahParam);
      setMode("interactive_mushaf");
    }
  }, [search]);

  const surahs = useMemo(() => getSurahList(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const provider = (await selectBestProvider(navigator.onLine)).provider;
      if (cancelled) return;
      if (provider) {
        const result = await checkTajweedAvailability(provider);
        if (!cancelled) setTajweedAvailable(result);
      } else {
        setTajweedAvailable({ available: false, reason: "لا يتوفر محرك تعرّف صوتي بعد" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const startSession = useCallback(async () => {
    setPhase("loading");
    setErrorMsg(null);
    try {
      const detail = await fetchSurahDetail(surahNumber);
      const words = buildReferenceWords(surahNumber, detail.ayahs);
      setReferenceWords(words);
      setWordStates(new Map(words.map((w) => [`${w.surah}:${w.ayah}:${w.wordIndex}`, "hidden" as const])));
      setCursorIdx(0);
      setLiveEvents([]);
      setJustCompletedAyah(null);

      const selection = await selectBestProvider(navigator.onLine);
      if (!selection.provider) {
        setErrorMsg("لا يتوفر محرك تعرّف صوتي على هذا الجهاز/المتصفح حاليًا. جرّب من تطبيق الجوال، أو تحقّق من إذن الميكروفون.");
        setPhase("error");
        return;
      }
      providerRef.current = selection.provider;

      const engine = new VerseAlignmentEngine({ referenceWords: words, alertLevel });
      engineRef.current = engine;

      const asrSession = await selection.provider.startSession({ language: "ar-SA", precisionLevel });
      asrSessionRef.current = asrSession;
      sessionStartRef.current = Date.now();

      if (selection.provider.onPartialWord) {
        unsubRef.current = selection.provider.onPartialWord(asrSession, (word, atMs) => {
          // خارج دورة render — ErrorBoundary لا يلتقط أخطاء المستدعيات
          // غير المتزامنة، فأي خطأ هنا (مثلًا في المحرك) قد يُبقي الجلسة
          // عالقة صامتًا بدل الانهيار. نلتقطه يدويًا وننهي الجلسة بصدق
          // بدل تعليقها أو إسقاط الصفحة (القسم 12) — بلا الاعتماد على
          // إغلاق finishSession (يُعرَّف لاحقًا في الملف، لتفادي أي
          // مرجع قديم/معلَّق).
          try {
            const events = engine.feedWord(word, atMs);
            applyEvents(events);
          } catch (err) {
            console.error("recitation-ai: feedWord failed", err);
            setErrorMsg("حدث خلل أثناء تحليل التلاوة. أُنهيت الجلسة تلقائيًا لحمايتك — جرّب مجددًا.");
            setListening(false);
            unsubRef.current?.();
            unsubRef.current = null;
            void selection.provider.endSession(asrSession).catch(() => {});
            setPhase("error");
          }
        });
      }

      setListening(true);
      setPhase("session");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "تعذّر بدء الجلسة");
      setPhase("error");
    }
  }, [surahNumber, alertLevel, precisionLevel]);

  const applyEvents = useCallback((events: AlignmentEvent[]) => {
    if (events.length === 0) return;
    setLiveEvents((prev) => [...prev, ...events]);
    setWordStates((prev) => {
      const next = new Map(prev);
      for (const e of events) {
        if (e.kind === "correct") {
          next.set(`${e.ref.surah}:${e.ref.ayah}:${e.ref.wordIndex}`, "revealed");
        } else if (e.kind === "error" && e.ref) {
          next.set(`${e.ref.surah}:${e.ref.ayah}:${e.ref.wordIndex}`, "error");
        } else if (e.kind === "ayah_complete") {
          setJustCompletedAyah(e.ayah);
          setTimeout(() => setJustCompletedAyah(null), 900);
        }
      }
      return next;
    });
    if (engineRef.current) setCursorIdx(engineRef.current.progress.cursor);
  }, []);

  const finishSession = useCallback(async () => {
    setListening(false);
    unsubRef.current?.();
    unsubRef.current = null;

    const engine = engineRef.current;
    const provider = providerRef.current;
    const asrSession = asrSessionRef.current;
    if (engine) applyEvents(engine.finalize());
    if (provider && asrSession) {
      try { await provider.endSession(asrSession); } catch { /* تجاهل */ }
    }

    setLiveEvents((finalEvents) => {
      const processed = postProcessAlignmentEvents(finalEvents);
      void persistSession(processed);
      return processed;
    });

    setPhase("report");
  }, [applyEvents]);

  const persistSession = useCallback(
    async (events: AlignmentEvent[]) => {
      if (!user?.id) return;
      const correct = events.filter((e) => e.kind === "correct").length;
      const errors = events.filter((e) => e.kind === "error");
      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      const confidences = events.filter((e) => e.kind !== "ayah_complete").map((e) => (e as { confidence: number }).confidence);

      await saveRecitationSession(
        user.id,
        {
          range: { rangeType: "surah", surahNumber },
          mode,
          precisionLevel,
          providerId: providerRef.current?.id ?? "unknown",
          alertLevel,
          durationSeconds,
          versesCount: new Set(referenceWords.map((w) => w.ayah)).size,
          wordsTotal: referenceWords.length,
          wordsCorrect: correct,
          hintsUsed: 0,
          confidencePct: overallSessionConfidence(confidences),
        },
        events,
      );

      // إضافة الآيات كثيرة الأخطاء لخطة المراجعة تلقائيًا (القسم 10)
      const errorAyahs = new Set(errors.map((e) => (e.kind === "error" ? e.ref?.ayah : null)).filter(Boolean) as number[]);
      for (const ayah of errorAyahs) {
        await addRecitationReviewItem(user.id, surahNumber, ayah, ayah);
      }
    },
    [user?.id, surahNumber, mode, precisionLevel, alertLevel, referenceWords],
  );

  useEffect(() => {
    return () => { unsubRef.current?.(); };
  }, []);

  const revealWords: WordRevealInfo[] = useMemo(
    () => referenceWords.map((w) => ({ word: w, state: wordStates.get(`${w.surah}:${w.ayah}:${w.wordIndex}`) ?? "hidden" })),
    [referenceWords, wordStates],
  );

  const correctCount = liveEvents.filter((e) => e.kind === "correct").length;
  const errorEvents = liveEvents.filter((e): e is Extract<AlignmentEvent, { kind: "error" }> => e.kind === "error");

  if (phase === "setup" || phase === "loading" || phase === "error") {
    return (
      <div className="rai-page">
        <div className="rai-header">
          <h1 className="rai-header__title">
            اختبار التسميع بالذكاء الاصطناعي
            <span className="rai-experimental-badge">نسخة تجريبية</span>
          </h1>
          <p className="rai-header__sub">سمّع من حفظك، واستمع لتلاوتك لحظيًا، والمصحف يكشف الآية فور نطقها</p>
          <p className="rai-header__sub" style={{ fontSize: ".78rem", opacity: .85 }}>
            تحليل الحفظ الأساسي (كلمة صحيحة/خاطئة/ناقصة/زائدة) يعمل فعليًا. التحليل الصوتي الكامل
            (خصوصًا تفاصيل التجويد الدقيقة) لا يزال قيد التطوير.
          </p>
        </div>

        {errorMsg && <p className="rai-tajweed-disabled-note" style={{ maxWidth: 720, margin: "0 auto 1rem" }}>{errorMsg}</p>}

        <div className="rai-setup">
          <div className="rai-setup__group">
            <label className="rai-setup__label" htmlFor="rai-surah">السورة</label>
            <select id="rai-surah" className="rai-surah-select" value={surahNumber} onChange={(e) => setSurahNumber(Number(e.target.value))}>
              {surahs.map((s) => (
                <option key={s.number} value={s.number}>{s.number}. {s.name} ({s.ayahs} آية)</option>
              ))}
            </select>
          </div>

          <div className="rai-setup__group">
            <span className="rai-setup__label">نوع الاختبار</span>
            <div className="rai-choice-grid">
              {(Object.keys(MODE_LABELS) as RecitationMode[]).map((m) => (
                <button key={m} type="button" className={`rai-choice ${mode === m ? "rai-choice--active" : ""}`} onClick={() => setMode(m)}>
                  {MODE_LABELS[m].label}
                  <span className="rai-choice__hint">{MODE_LABELS[m].hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rai-setup__group">
            <span className="rai-setup__label">مستوى الدقة</span>
            <div className="rai-choice-grid">
              <button type="button" className={`rai-choice ${precisionLevel === "hifz" ? "rai-choice--active" : ""}`} onClick={() => setPrecisionLevel("hifz")}>
                حفظ فقط
                <span className="rai-choice__hint">صحة الحفظ لا الأداء</span>
              </button>
              <button
                type="button"
                className={`rai-choice ${precisionLevel === "tajweed" ? "rai-choice--active" : ""}`}
                onClick={() => setPrecisionLevel("tajweed")}
                disabled={!tajweedAvailable?.available}
              >
                إتقان التجويد
                <span className="rai-choice__hint">دقيق جدًا</span>
              </button>
            </div>
            {!tajweedAvailable?.available && (
              <p className="rai-tajweed-disabled-note">
                {tajweedAvailable?.reason ?? "إتقان التجويد يتطلب اتصالًا بالمحرك المتخصص"}
              </p>
            )}
          </div>

          <div className="rai-setup__group">
            <span className="rai-setup__label">مستوى التنبيه</span>
            <div className="rai-choice-grid">
              {(Object.keys(ALERT_LABELS) as AlertLevel[]).map((a) => (
                <button key={a} type="button" className={`rai-choice ${alertLevel === a ? "rai-choice--active" : ""}`} onClick={() => setAlertLevel(a)}>
                  {ALERT_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {mode === "interactive_mushaf" && (
            <div className="rai-setup__group">
              <span className="rai-setup__label">طريقة الكشف</span>
              <div className="rai-choice-grid">
                <button type="button" className={`rai-choice ${revealGranularity === "word" ? "rai-choice--active" : ""}`} onClick={() => setRevealGranularity("word")}>كشف بالكلمة</button>
                <button type="button" className={`rai-choice ${revealGranularity === "ayah" ? "rai-choice--active" : ""}`} onClick={() => setRevealGranularity("ayah")}>كشف بالآية</button>
              </div>
            </div>
          )}

          <p className="rai-pre-session-warning" role="alert">
            هذه الميزة تجريبية وقد لا تكتشف جميع الأخطاء بدقة. لا تعتمد عليها بديلًا عن العرض على معلّم متقن.
          </p>

          <button type="button" className="rai-start-btn" onClick={startSession} disabled={phase === "loading"}>
            {phase === "loading" ? "جارٍ التحضير…" : "ابدأ التسميع"}
          </button>
          <p className="rai-report__disclaimer">
            سيُطلَب إذن الميكروفون قبل بدء الاستماع، ويُستخدَم فقط أثناء الجلسة — لا يُحفَظ التسجيل افتراضيًا،
            ولا يُرسَل أي جزء منه لخوادم مجالس. قد يعالج نظام تشغيلك/متصفحك التعرّف الصوتي خارج الجهاز حين لا
            يتوفر تعرّف كامل محليًا (راجع{" "}
            <a href="/privacy" style={{ color: "var(--rai-emerald)" }}>سياسة الخصوصية</a>).
          </p>
        </div>
      </div>
    );
  }

  if (phase === "session") {
    return (
      <div className="rai-page">
        <div className="rai-session">
          <div className="rai-session__topbar">
            <div className="rai-listen-indicator">
              {listening && (
                <span className="rai-listen-wave" aria-hidden="true"><span /><span /><span /></span>
              )}
              <span style={{ fontFamily: "var(--font-body)", fontSize: ".85rem" }}>{listening ? "يستمع الآن…" : "متوقّف مؤقتًا"}</span>
            </div>
            <span className="rai-error-count">{errorEvents.length} ملاحظة</span>
            <div className="rai-session__actions">
              <button type="button" className="rai-icon-btn" aria-label="إيقاف مؤقت"><Pause size={18} /></button>
              <button type="button" className="rai-icon-btn" aria-label="إنهاء الجلسة" onClick={finishSession}><Square size={18} /></button>
            </div>
          </div>

          <div className="rai-progress-bar">
            <div className="rai-progress-bar__fill" style={{ width: `${referenceWords.length ? (cursorIdx / referenceWords.length) * 100 : 0}%` }} />
          </div>

          {mode === "interactive_mushaf" ? (
            <InteractiveMushafReveal words={revealWords} revealGranularity={revealGranularity} justCompletedAyah={justCompletedAyah} />
          ) : (
            <p className="rai-plain-words">
              {referenceWords.map((w, i) => {
                const state = wordStates.get(`${w.surah}:${w.ayah}:${w.wordIndex}`) ?? "hidden";
                const cls = state === "revealed" ? "rai-plain-word--correct" : state === "error" ? "rai-plain-word--error" : "rai-plain-word--pending";
                const showText = mode !== "full_hide" || state !== "hidden";
                return (
                  <span key={i} className={cls}>
                    {showText ? w.raw : "ــــ"}{" "}
                  </span>
                );
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // phase === "report"
  const accuracy = referenceWords.length > 0 ? Math.round((correctCount / referenceWords.length) * 100) : 0;
  return (
    <div className="rai-page">
      <div className="rai-header">
        <h1 className="rai-header__title">تقرير الجلسة</h1>
      </div>
      <div className="rai-report">
        <div className="rai-report__ring-wrap">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(14,110,82,.15)" strokeWidth="12" />
            <circle
              cx="70" cy="70" r="60" fill="none" stroke="#0E6E52" strokeWidth="12"
              strokeDasharray={`${(accuracy / 100) * 377} 377`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
            <text x="70" y="78" textAnchor="middle" fontSize="28" fontWeight={800} fill="#153025">{accuracy}%</text>
          </svg>
        </div>

        <div className="rai-report__stats">
          <div className="rai-report__stat"><span className="rai-report__stat-val">{correctCount}</span><span className="rai-report__stat-lbl">كلمة صحيحة</span></div>
          <div className="rai-report__stat"><span className="rai-report__stat-val">{errorEvents.length}</span><span className="rai-report__stat-lbl">ملاحظة</span></div>
          <div className="rai-report__stat"><span className="rai-report__stat-val">{new Set(referenceWords.map((w) => w.ayah)).size}</span><span className="rai-report__stat-lbl">آية</span></div>
        </div>

        {errorEvents.length > 0 && (
          <div className="rai-report__errors-list">
            {errorEvents.map((e, i) => (
              <div key={i} className="rai-report__error-row">
                {e.ref ? `${e.ref.surah}:${e.ref.ayah} — ` : ""}
                {errorTypeLabel(e.errorType)}
                {e.heardWord ? ` (سُمع: "${e.heardWord}")` : ""}
              </div>
            ))}
          </div>
        )}

        <p className="rai-report__disclaimer">
          هذا التحليل مساعد تقني ولا يغني عن التلقي والعرض على مقرئ متقن.
        </p>

        <button type="button" className="rai-start-btn" onClick={() => setPhase("setup")}>
          <ChevronLeft size={18} style={{ verticalAlign: "middle" }} /> جلسة جديدة
        </button>
      </div>
    </div>
  );
}

function errorTypeLabel(t: string): string {
  const map: Record<string, string> = {
    wrong_word: "كلمة خاطئة",
    missing_word: "كلمة ناقصة",
    extra_word: "كلمة زائدة",
    out_of_order: "تقديم/تأخير",
    wrong_ayah_jump: "انتقال لموضع متشابه",
    repetition: "تكرار",
    long_pause: "توقف طويل",
    wrong_start: "بداية من موضع غير صحيح",
  };
  return map[t] ?? t;
}

export default function RecitationTestPage() {
  return <RecitationTestPageInner />;
}
