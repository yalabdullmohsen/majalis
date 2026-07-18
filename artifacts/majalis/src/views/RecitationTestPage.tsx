import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import { Pause, Play, Square, ChevronLeft, RotateCcw } from "lucide-react";
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
import { saveRecitationSession, getRecentRecitationSessions } from "@/lib/recitation-ai/recitation-session-service";
import { addRecitationReviewItem, getDueRecitationReviews, type RecitationReviewItem } from "@/lib/recitation-ai/recitation-review-service";
import { loadRecitationSettings, saveRecitationSettings } from "@/lib/recitation-ai/recitation-settings-service";
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
  const [dueReviews, setDueReviews] = useState<RecitationReviewItem[]>([]);
  // نطاق آيات مخصَّص (القسم 1: "من آية إلى آية" بدل السورة كاملة دومًا)
  const [rangeMode, setRangeMode] = useState<"surah" | "ayahRange">("surah");
  const [ayahFrom, setAyahFrom] = useState(1);
  const [ayahTo, setAyahTo] = useState(7);
  const [recentSession, setRecentSession] = useState<{ surahNumber: number; ayahFrom: number | null; ayahTo: number | null; accuracyPct: number | null } | null>(null);

  // جلسة
  const [referenceWords, setReferenceWords] = useState<ReferenceWord[]>([]);
  const [wordStates, setWordStates] = useState<Map<string, "hidden" | "revealed" | "error" | "unclear">>(new Map());
  const [cursorIdx, setCursorIdx] = useState(0);
  const [liveEvents, setLiveEvents] = useState<AlignmentEvent[]>([]);
  const [justCompletedAyah, setJustCompletedAyah] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  // بند تفوّق "غير واضح": إشعار عابر (لا جزم بخطأ) يطلب إعادة النطق —
  // مؤقَّت بمهلة زمنية حقيقية عبر ref، بلا أي استدعاء متداخل داخل مُحدِّث
  // setWordStates (نفس درس سباق hintLevel أعلاه).
  const [unclearNotice, setUnclearNotice] = useState<string | null>(null);
  const unclearNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [paused, setPaused] = useState(false);

  // تلميح متدرج لوضع "التسميع بالمساعدة" (القسم 2، الوضع 2): أول حرف ←
  // أول كلمة ← الآية كاملة. **مبني على مؤقّت زمني حقيقي (wall-clock)**
  // لا على أحداث long_pause الرجعية من المحرك — هذه الأخيرة لا تُصدَر
  // إلا بعد وصول الكلمة التالية فعليًا (مقارنة رجعية للفجوة الزمنية)،
  // أي بعد فوات أوان إظهار تلميح مفيد أثناء التوقف نفسه. جُرِّب هذا
  // النهج فعليًا وأثبت تحقّق حي (Playwright) أنه لا يعمل: استدعاء
  // setHintLevel(0) كأثر جانبي داخل مُحدِّث setWordStates الوظيفي كان
  // يتسابق مع استدعاء setHintLevel(1) اللاحق فيُبطله دومًا — درس: لا
  // تستدعِ setState كأثر جانبي داخل مُحدِّث وظيفي لحالة أخرى أبدًا.
  const [hintLevel, setHintLevel] = useState(0);
  const hintsUsedRef = useRef(0);

  const engineRef = useRef<VerseAlignmentEngine | null>(null);
  const providerRef = useRef<QuranASRProvider | null>(null);
  const asrSessionRef = useRef<ASRSession | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const sessionStartRef = useRef<number>(0);
  // وضع الجلسة النشطة الفعلي — لا الاعتماد على إغلاق (closure) لحالة
  // mode داخل attachAsrSession (لا تُعاد بناؤه عند تغيّر mode فتبقى قيمة
  // قديمة)؛ يُضبَط مرة واحدة عند بدء كل جلسة ويُقرَأ من هنا دومًا.
  const activeModeRef = useRef<RecitationMode>("interactive_mushaf");
  // "اختبار المعلّم" (القسم 2، الوضع 5): زمن الاسترجاع = من بدء الاستماع
  // حتى أول كلمة صحيحة — يُعرَض في التقرير لهذا الوضع تحديدًا فقط.
  const recallStartAtRef = useRef<number | null>(null);
  const [recallMs, setRecallMs] = useState<number | null>(null);

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
  const currentSurahAyahCount = surahs.find((s) => s.number === surahNumber)?.ayahs ?? 7;

  // عند تغيير السورة، اضبط نطاق الآية الافتراضي (كامل السورة الجديدة)
  useEffect(() => {
    setAyahFrom(1);
    setAyahTo(currentSurahAyahCount);
  }, [surahNumber]);

  // تحميل آخر إعدادات محفوظة للمستخدم (القسم 1) — لا تأثير لزائر مجهول
  // (بلا حساب)، يبقى ببساطة على الإعدادات الافتراضية المحلية.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const saved = await loadRecitationSettings(user.id);
        if (cancelled) return;
        setMode(saved.defaultMode);
        setPrecisionLevel(saved.precisionLevel);
        setAlertLevel(saved.alertLevel);
        setRevealGranularity(saved.revealGranularity);
      } catch {
        // تجاهل — الإعدادات الافتراضية المحلية تبقى سارية
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // مقاطع "مراجعة اليوم" المستحقة (القسم 10، عبر محرك SM-2 القائم) —
  // زائر مجهول (بلا حساب) لا يرى شيئًا هنا، بلا خطأ.
  useEffect(() => {
    if (!user?.id) { setDueReviews([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const items = await getDueRecitationReviews(user.id, 5);
        if (!cancelled) setDueReviews(items);
      } catch {
        // تجاهل — لا حاجة لإفشال الصفحة كاملة لخطأ في تحميل قائمة المراجعة
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // "متابعة من آخر جلسة" / "مراجعة آخر محفوظ" (القسم 1) — آخر جلسة
  // مكتملة للمستخدم، تُعرض كاختصار سريع لإعادة نفس النطاق.
  useEffect(() => {
    if (!user?.id) { setRecentSession(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const sessions = await getRecentRecitationSessions(user.id, 1);
        const last = sessions[0];
        if (!cancelled && last?.surah_number) {
          setRecentSession({
            surahNumber: last.surah_number,
            ayahFrom: last.ayah_from,
            ayahTo: last.ayah_to,
            accuracyPct: last.accuracy_pct,
          });
        }
      } catch {
        // تجاهل — لا حاجة لإفشال الصفحة كاملة
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

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

  /** يبدأ جلسة ASR جديدة على نفس المزوّد ويُغذّي نفس محرك المحاذاة القائم — يُستخدَم عند البدء الأول وعند الاستئناف بعد إيقاف مؤقت. */
  const attachAsrSession = useCallback(async (provider: QuranASRProvider, engine: VerseAlignmentEngine) => {
    const asrSession = await provider.startSession({ language: "ar-SA", precisionLevel });
    asrSessionRef.current = asrSession;

    if (provider.onPartialWord) {
      unsubRef.current = provider.onPartialWord(asrSession, (word, atMs, confidence) => {
        // خارج دورة render — ErrorBoundary لا يلتقط أخطاء المستدعيات
        // غير المتزامنة، فأي خطأ هنا (مثلًا في المحرك) قد يُبقي الجلسة
        // عالقة صامتًا بدل الانهيار. نلتقطه يدويًا وننهي الجلسة بصدق
        // بدل تعليقها أو إسقاط الصفحة (القسم 12).
        try {
          const events = engine.feedWord(word, atMs, confidence);
          applyEvents(events);
        } catch (err) {
          console.error("recitation-ai: feedWord failed", err);
          setErrorMsg("حدث خلل أثناء تحليل التلاوة. أُنهيت الجلسة تلقائيًا لحمايتك — جرّب مجددًا.");
          setListening(false);
          unsubRef.current?.();
          unsubRef.current = null;
          void provider.endSession(asrSession).catch(() => {});
          setPhase("error");
        }
      });
    }
  }, [precisionLevel]);

  /** ينطلق منها كل من startSession (سورة كاملة/نطاق) وretryAyah ("مراجعة اليوم" و"إعادة اختبار هذه الآية"). */
  const startSessionWithWords = useCallback(async (wordsIn: ReferenceWord[]) => {
    setPhase("loading");
    setErrorMsg(null);
    try {
      // "اختبار المعلّم" (القسم 2، الوضع 5): يبدأ من آية عشوائية داخل
      // النطاق المُختار بدل أوله دومًا — يقيس قدرة الاسترجاع الفعلية لا
      // مجرد بدء التلاوة من حفظ معروف بالترتيب.
      let words = wordsIn;
      if (mode === "teacher_test") {
        const uniqueAyahs = [...new Set(wordsIn.map((w) => w.ayah))];
        if (uniqueAyahs.length > 1) {
          const randomAyah = uniqueAyahs[Math.floor(Math.random() * (uniqueAyahs.length - 1))];
          words = wordsIn.filter((w) => w.ayah >= randomAyah);
        }
      }

      setReferenceWords(words);
      setWordStates(new Map(words.map((w) => [`${w.surah}:${w.ayah}:${w.wordIndex}`, "hidden" as const])));
      setCursorIdx(0);
      setLiveEvents([]);
      setJustCompletedAyah(null);
      setPaused(false);
      activeModeRef.current = mode;
      hintsUsedRef.current = 0;
      setHintLevel(0);
      recallStartAtRef.current = mode === "teacher_test" ? Date.now() : null;
      setRecallMs(null);

      const selection = await selectBestProvider(navigator.onLine);
      if (!selection.provider) {
        setErrorMsg("لا يتوفر محرك تعرّف صوتي على هذا الجهاز/المتصفح حاليًا. جرّب من تطبيق الجوال، أو تحقّق من إذن الميكروفون.");
        setPhase("error");
        return;
      }
      providerRef.current = selection.provider;

      const engine = new VerseAlignmentEngine({ referenceWords: words, alertLevel });
      engineRef.current = engine;
      sessionStartRef.current = Date.now();

      await attachAsrSession(selection.provider, engine);

      setListening(true);
      setPhase("session");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "تعذّر بدء الجلسة");
      setPhase("error");
    }
  }, [alertLevel, attachAsrSession, mode]);

  const startSession = useCallback(async () => {
    if (user?.id) {
      void saveRecitationSettings(user.id, {
        defaultMode: mode,
        precisionLevel,
        alertLevel,
        hintStyle: "progressive",
        revealGranularity,
        saveRecordings: false,
        showErrorCount: true,
      }).catch(() => {});
    }
    setPhase("loading");
    try {
      const detail = await fetchSurahDetail(surahNumber);
      const ayahs = rangeMode === "ayahRange"
        ? detail.ayahs.filter((a) => a.numberInSurah >= ayahFrom && a.numberInSurah <= ayahTo)
        : detail.ayahs;
      const words = buildReferenceWords(surahNumber, ayahs);
      await startSessionWithWords(words);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "تعذّر بدء الجلسة");
      setPhase("error");
    }
  }, [surahNumber, startSessionWithWords, user?.id, mode, precisionLevel, alertLevel, revealGranularity, rangeMode, ayahFrom, ayahTo]);

  /** "إعادة اختبار هذه الآية فورًا" — القسم 9. يبني كلمات مرجعية لآية واحدة فقط من نفس السورة. */
  /** يبني جلسة بنطاق آيات محدَّد من سورة واحدة — يُستخدَم لكل من "إعادة اختبار هذه الآية" و"مراجعة اليوم" (القسم 10). */
  const startSessionForAyahRange = useCallback(async (surah: number, ayahFrom: number, ayahTo: number) => {
    setPhase("loading");
    setSurahNumber(surah);
    try {
      const detail = await fetchSurahDetail(surah);
      const rangeAyahs = detail.ayahs.filter((a) => a.numberInSurah >= ayahFrom && a.numberInSurah <= ayahTo);
      const words = buildReferenceWords(surah, rangeAyahs);
      await startSessionWithWords(words);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "تعذّر بدء المراجعة");
      setPhase("error");
    }
  }, [startSessionWithWords]);

  const retryAyah = useCallback(
    (surah: number, ayah: number) => startSessionForAyahRange(surah, ayah, ayah),
    [startSessionForAyahRange],
  );

  /** إيقاف مؤقت: يوقف الاستماع فقط (يُغلق جلسة ASR) — محرك المحاذاة يحتفظ بموضعه وكل التقدّم المُحرَز. */
  const pauseSession = useCallback(async () => {
    const provider = providerRef.current;
    const asrSession = asrSessionRef.current;
    unsubRef.current?.();
    unsubRef.current = null;
    setListening(false);
    setPaused(true);
    if (provider && asrSession) {
      try { await provider.endSession(asrSession); } catch { /* تجاهل */ }
    }
    asrSessionRef.current = null;
  }, []);

  /** استئناف بعد إيقاف مؤقت: جلسة ASR جديدة تُغذّي نفس محرك المحاذاة القائم — لا فقدان لأي تقدّم. */
  const resumeSession = useCallback(async () => {
    const provider = providerRef.current;
    const engine = engineRef.current;
    if (!provider || !engine) return;
    try {
      await attachAsrSession(provider, engine);
      setListening(true);
      setPaused(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "تعذّر استئناف الاستماع");
    }
  }, [attachAsrSession]);

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
        } else if (e.kind === "unclear") {
          next.set(`${e.ref.surah}:${e.ref.ayah}:${e.ref.wordIndex}`, "unclear");
        } else if (e.kind === "ayah_complete") {
          setJustCompletedAyah(e.ayah);
          setTimeout(() => setJustCompletedAyah(null), 900);
        }
      }
      return next;
    });

    // إشعار "غير واضح" العابر — يُحسَب من آخر حدث unclear في هذه الدفعة
    // فقط، بلا أي علاقة بمُحدِّث setWordStates أعلاه (استدعاء setState
    // منفصل تمامًا، خارج أي دالة تحديث أخرى).
    const lastUnclear = [...events].reverse().find((e) => e.kind === "unclear");
    if (lastUnclear && lastUnclear.kind === "unclear") {
      setUnclearNotice(lastUnclear.heardWord);
      if (unclearNoticeTimerRef.current) clearTimeout(unclearNoticeTimerRef.current);
      unclearNoticeTimerRef.current = setTimeout(() => setUnclearNotice(null), 3000);
    }

    // زمن الاسترجاع لوضع "اختبار المعلّم" — يُسجَّل مرة واحدة فقط، عند
    // أول كلمة صحيحة بعد بدء الجلسة من الموضع العشوائي. بلا أي استدعاء
    // setState متسابق (خارج مُحدِّث setWordStates تمامًا، درسٌ من خلل
    // hintLevel السابق أعلاه).
    if (recallStartAtRef.current !== null && events.some((e) => e.kind === "correct")) {
      setRecallMs(Date.now() - recallStartAtRef.current);
      recallStartAtRef.current = null;
    }

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

      // النطاق الفعلي المُسمَّع (لا الاختيار الأصلي فقط) — يهم خصوصًا في
      // وضع "اختبار المعلّم" حيث يبدأ النطاق الفعلي من آية عشوائية.
      const sessionAyahs = referenceWords.map((w) => w.ayah);
      const actualAyahFrom = sessionAyahs.length ? Math.min(...sessionAyahs) : ayahFrom;
      const actualAyahTo = sessionAyahs.length ? Math.max(...sessionAyahs) : ayahTo;
      const isWholeSurah = rangeMode === "surah" && mode !== "teacher_test";

      await saveRecitationSession(
        user.id,
        {
          range: isWholeSurah
            ? { rangeType: "surah", surahNumber }
            : { rangeType: "ayah_range", surahNumber, ayahFrom: actualAyahFrom, ayahTo: actualAyahTo },
          mode,
          precisionLevel,
          providerId: providerRef.current?.id ?? "unknown",
          alertLevel,
          durationSeconds,
          versesCount: new Set(referenceWords.map((w) => w.ayah)).size,
          wordsTotal: referenceWords.length,
          wordsCorrect: correct,
          hintsUsed: hintsUsedRef.current,
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
    [user?.id, surahNumber, mode, precisionLevel, alertLevel, referenceWords, rangeMode, ayahFrom, ayahTo],
  );

  useEffect(() => {
    return () => {
      unsubRef.current?.();
      if (unclearNoticeTimerRef.current) clearTimeout(unclearNoticeTimerRef.current);
    };
  }, []);

  // تلميح متدرج (وضع "التسميع بالمساعدة" فقط) — مؤقّت زمني حقيقي يُعاد
  // ضبطه في كل مرة يتقدَّم فيها الموضع (cursorIdx) أو يُوقَف الاستماع
  // مؤقتًا، فيبدأ العدّ من الصفر عند كل كلمة جديدة صحيحة تلقائيًا (بلا
  // أي استدعاء setState متسابق من applyEvents — راجع تعليق hintLevel أعلاه).
  useEffect(() => {
    if (phase !== "session" || mode !== "assisted" || !listening) return;
    setHintLevel(0);
    const HINT_STEP_MS = 5000;
    const timers = [1, 2, 3].map((level) =>
      setTimeout(() => {
        setHintLevel((prev) => Math.max(prev, level));
        if (level === 1) hintsUsedRef.current += 1;
      }, HINT_STEP_MS * level),
    );
    return () => timers.forEach(clearTimeout);
  }, [cursorIdx, mode, phase, listening]);

  const revealWords: WordRevealInfo[] = useMemo(
    () => referenceWords.map((w) => ({ word: w, state: wordStates.get(`${w.surah}:${w.ayah}:${w.wordIndex}`) ?? "hidden" })),
    [referenceWords, wordStates],
  );

  const correctCount = liveEvents.filter((e) => e.kind === "correct").length;
  const errorEvents = liveEvents.filter((e): e is Extract<AlignmentEvent, { kind: "error" }> => e.kind === "error");
  // "غير واضح" منفصل تمامًا عن errorEvents — لا يُحتسَب ضمن ملاحظات
  // الأخطاء المؤكَّدة (القسم 9)، يُعرَض فقط كإحصاء شفاف مستقل في التقرير.
  const unclearEvents = liveEvents.filter((e): e is Extract<AlignmentEvent, { kind: "unclear" }> => e.kind === "unclear");

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

        {recentSession && (
          <div className="rai-setup" style={{ marginBottom: "1.25rem" }}>
            <div className="rai-setup__group">
              <span className="rai-setup__label">متابعة من آخر جلسة</span>
              <button
                type="button"
                className="rai-choice"
                onClick={() => void startSessionForAyahRange(
                  recentSession.surahNumber,
                  recentSession.ayahFrom ?? 1,
                  recentSession.ayahTo ?? (surahs.find((s) => s.number === recentSession.surahNumber)?.ayahs ?? 1),
                )}
              >
                {surahs.find((s) => s.number === recentSession.surahNumber)?.name ?? `سورة ${recentSession.surahNumber}`}
                <span className="rai-choice__hint">
                  {recentSession.accuracyPct !== null ? `آخر نسبة إتقان: ${Math.round(recentSession.accuracyPct)}%` : "استكمل نفس النطاق"}
                </span>
              </button>
            </div>
          </div>
        )}

        {dueReviews.length > 0 && (
          <div className="rai-setup" style={{ marginBottom: "1.25rem" }}>
            <div className="rai-setup__group">
              <span className="rai-setup__label">مراجعة اليوم ({dueReviews.length})</span>
              <div className="rai-choice-grid">
                {dueReviews.map((item) => (
                  <button
                    key={item.cardId}
                    type="button"
                    className="rai-choice"
                    onClick={() => void startSessionForAyahRange(item.surahNumber, item.ayahFrom, item.ayahTo)}
                  >
                    {item.label}
                    <span className="rai-choice__hint">مقطع مستحق للمراجعة</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
            <span className="rai-setup__label">النطاق</span>
            <div className="rai-choice-grid">
              <button type="button" className={`rai-choice ${rangeMode === "surah" ? "rai-choice--active" : ""}`} onClick={() => setRangeMode("surah")}>
                السورة كاملة
              </button>
              <button type="button" className={`rai-choice ${rangeMode === "ayahRange" ? "rai-choice--active" : ""}`} onClick={() => setRangeMode("ayahRange")}>
                من آية إلى آية
              </button>
            </div>
            {rangeMode === "ayahRange" && (
              <div className="rai-range-inputs" style={{ display: "flex", gap: ".6rem", marginTop: ".6rem" }}>
                <label style={{ flex: 1 }}>
                  <span className="rai-choice__hint">من آية</span>
                  <input
                    type="number" min={1} max={currentSurahAyahCount} value={ayahFrom}
                    onChange={(e) => setAyahFrom(Math.min(Number(e.target.value) || 1, ayahTo))}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <span className="rai-choice__hint">إلى آية</span>
                  <input
                    type="number" min={ayahFrom} max={currentSurahAyahCount} value={ayahTo}
                    onChange={(e) => setAyahTo(Math.max(Number(e.target.value) || ayahFrom, ayahFrom))}
                  />
                </label>
              </div>
            )}
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
    // نص التلميح المتدرج (وضع "التسميع بالمساعدة" فقط) — القسم 2:
    // مستوى 1: أول حرف من الكلمة المنتظرة، مستوى 2: الكلمة كاملة،
    // مستوى 3: الآية كاملة.
    const waitingWord = mode === "assisted" ? referenceWords[cursorIdx] : undefined;
    let hintText: string | null = null;
    if (waitingWord && hintLevel > 0) {
      if (hintLevel === 1) hintText = waitingWord.raw.slice(0, 1) + "…";
      else if (hintLevel === 2) hintText = waitingWord.raw;
      else hintText = referenceWords.filter((w) => w.ayah === waitingWord.ayah).map((w) => w.raw).join(" ");
    }

    return (
      <div className="rai-page">
        <div className="rai-session">
          <div className="rai-session__topbar">
            <div className="rai-listen-indicator">
              {listening && (
                <span className="rai-listen-wave" aria-hidden="true"><span /><span /><span /></span>
              )}
              <span style={{ fontFamily: "var(--font-body)", fontSize: ".85rem" }}>{listening ? "يستمع الآن…" : paused ? "متوقّف مؤقتًا" : "جارٍ الاتصال…"}</span>
            </div>
            <span className="rai-error-count">{errorEvents.length} ملاحظة</span>
            <div className="rai-session__actions">
              {paused ? (
                <button type="button" className="rai-icon-btn" aria-label="استئناف الاستماع" onClick={() => void resumeSession()}><Play size={18} /></button>
              ) : (
                <button type="button" className="rai-icon-btn" aria-label="إيقاف مؤقت" onClick={() => void pauseSession()}><Pause size={18} /></button>
              )}
              <button type="button" className="rai-icon-btn" aria-label="إنهاء الجلسة" onClick={finishSession}><Square size={18} /></button>
            </div>
          </div>

          <div className="rai-progress-bar">
            <div className="rai-progress-bar__fill" style={{ width: `${referenceWords.length ? (cursorIdx / referenceWords.length) * 100 : 0}%` }} />
          </div>

          {hintText && (
            <p className="rai-hint-banner" role="status">
              تلميح ({hintLevel === 1 ? "أول حرف" : hintLevel === 2 ? "الكلمة" : "الآية كاملة"}): <bdi>{hintText}</bdi>
            </p>
          )}

          {unclearNotice && (
            <p className="rai-unclear-banner" role="status">
              لم يتّضح الصوت جيدًا — أعد نطق هذه الكلمة: <bdi>{unclearNotice}</bdi>
            </p>
          )}

          {mode === "interactive_mushaf" ? (
            <InteractiveMushafReveal words={revealWords} revealGranularity={revealGranularity} justCompletedAyah={justCompletedAyah} />
          ) : (
            <p className="rai-plain-words">
              {referenceWords.map((w, i) => {
                const state = wordStates.get(`${w.surah}:${w.ayah}:${w.wordIndex}`) ?? "hidden";
                const cls =
                  state === "revealed" ? "rai-plain-word--correct" :
                  state === "error" ? "rai-plain-word--error" :
                  state === "unclear" ? "rai-plain-word--unclear" :
                  "rai-plain-word--pending";
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

  // تجميع الأخطاء حسب الآية (القسم 9: "تفصيل الأخطاء آية آية")
  const errorsByAyah = new Map<string, { surah: number; ayah: number; errors: typeof errorEvents }>();
  for (const e of errorEvents) {
    if (!e.ref) continue;
    const key = `${e.ref.surah}:${e.ref.ayah}`;
    if (!errorsByAyah.has(key)) errorsByAyah.set(key, { surah: e.ref.surah, ayah: e.ref.ayah, errors: [] });
    errorsByAyah.get(key)!.errors.push(e);
  }
  const ayahGroups = [...errorsByAyah.values()].sort((a, b) => b.errors.length - a.errors.length);
  const mostRepeatedAyah = ayahGroups[0];

  // "أفضل مقطع" — أطول سلسلة كلمات متتالية صحيحة بلا أي خطأ بينها
  let bestStreak = 0;
  let currentStreak = 0;
  let bestStreakEndRef: ReferenceWord | null = null;
  for (const e of liveEvents) {
    if (e.kind === "correct") {
      currentStreak += 1;
      if (currentStreak > bestStreak) { bestStreak = currentStreak; bestStreakEndRef = e.ref; }
    } else if (e.kind === "error") {
      currentStreak = 0;
    }
  }

  const sessionConfidence = overallSessionConfidence(
    liveEvents.filter((e) => e.kind !== "ayah_complete").map((e) => (e as { confidence: number }).confidence),
  );

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
          {unclearEvents.length > 0 && (
            <div className="rai-report__stat rai-report__stat--unclear" title="لا تُحتسَب أخطاءً — التقاط الصوت لم يكن واضحًا كفاية للجزم">
              <span className="rai-report__stat-val">{unclearEvents.length}</span><span className="rai-report__stat-lbl">غير واضح</span>
            </div>
          )}
          <div className="rai-report__stat"><span className="rai-report__stat-val">{new Set(referenceWords.map((w) => w.ayah)).size}</span><span className="rai-report__stat-lbl">آية</span></div>
          <div className="rai-report__stat"><span className="rai-report__stat-val">{sessionConfidence}%</span><span className="rai-report__stat-lbl">ثقة التحليل</span></div>
          {mode === "teacher_test" && recallMs !== null && (
            <div className="rai-report__stat"><span className="rai-report__stat-val">{(recallMs / 1000).toFixed(1)}ث</span><span className="rai-report__stat-lbl">زمن الاسترجاع</span></div>
          )}
        </div>

        {bestStreak > 0 && (
          <p className="rai-report__disclaimer">
            أفضل مقطع: {bestStreak} كلمة متتالية صحيحة{bestStreakEndRef ? ` (تنتهي عند آية ${bestStreakEndRef.surah}:${bestStreakEndRef.ayah})` : ""}
          </p>
        )}
        {mostRepeatedAyah && mostRepeatedAyah.errors.length > 1 && (
          <p className="rai-report__disclaimer">
            أكثر موضع تكرر فيه الخطأ: آية {mostRepeatedAyah.surah}:{mostRepeatedAyah.ayah} ({mostRepeatedAyah.errors.length} ملاحظات)
          </p>
        )}

        {ayahGroups.length > 0 && (
          <div className="rai-report__errors-list">
            {ayahGroups.map((group) => (
              <div key={`${group.surah}:${group.ayah}`} className="rai-report__error-row">
                <strong>آية {group.surah}:{group.ayah}</strong>
                <ul style={{ margin: ".35rem 0", paddingInlineStart: "1.2rem" }}>
                  {group.errors.map((e, i) => (
                    <li key={i}>
                      {errorTypeLabel(e.errorType)}
                      {e.ref ? ` — النص الصحيح: "${e.ref.raw}"` : ""}
                      {e.heardWord ? ` — سُمع: "${e.heardWord}"` : ""}
                      {" "}(ثقة {Math.round(e.confidence)}%)
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: ".5rem", marginTop: ".4rem" }}>
                  <button
                    type="button"
                    className="rai-icon-btn"
                    onClick={() => void retryAyah(group.surah, group.ayah)}
                  >
                    <RotateCcw size={14} style={{ verticalAlign: "middle" }} /> إعادة اختبار هذه الآية
                  </button>
                  {user?.id && (
                    <button
                      type="button"
                      className="rai-icon-btn"
                      onClick={() => void addRecitationReviewItem(user.id, group.surah, group.ayah, group.ayah)}
                    >
                      إضافة لخطة المراجعة
                    </button>
                  )}
                </div>
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
