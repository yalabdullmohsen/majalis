import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import { Pause, Play, Square, ChevronLeft, RotateCcw } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { useAuth } from "@/components/AuthProvider";
import { fetchSurahDetail, getSurahList } from "@/lib/quran-api";
import { buildReferenceWords, buildReferenceWordsForRange } from "@/lib/recitation-ai/quran-reference-words";
import { VerseAlignmentEngine } from "@/lib/recitation-ai/verse-alignment-engine";
import { postProcessAlignmentEvents } from "@/lib/recitation-ai/error-detector";
import { overallSessionConfidence } from "@/lib/recitation-ai/confidence-scorer";
import { selectBestProvider } from "@/lib/recitation-ai/provider-registry";
import { ASRProviderUnavailableError, type QuranASRProvider, type ASRSession, type ASRProviderError } from "@/lib/recitation-ai/asr-provider";
import { isIOS, isAndroid, isNative } from "@/lib/capacitor-utils";
import { checkTajweedAvailability } from "@/lib/recitation-ai/precision-level";
import { saveRecitationSession, getRecentRecitationSessions, deleteAllRecitationSessions, type SessionRangeInput } from "@/lib/recitation-ai/recitation-session-service";
import { addRecitationReviewItem, getDueRecitationReviews, type RecitationReviewItem } from "@/lib/recitation-ai/recitation-review-service";
import { loadRecitationSettings, saveRecitationSettings } from "@/lib/recitation-ai/recitation-settings-service";
import { hapticNotify } from "@/lib/capacitor-utils";
import { InteractiveMushafReveal, type WordRevealInfo } from "@/components/quran/InteractiveMushafReveal";
import { loadMutashabihatIndex, getSimilarAyahs, type MutashabihMatch } from "@/lib/recitation-ai/mutashabihat";
import { FreeformStartDetector, loadPositionIndex } from "@/lib/recitation-ai/freeform-start-detector";
import { loadPageJuzIndex, getSegmentsForPage, getSegmentsForJuz, getSegmentsForHizb, getSegmentsForRub } from "@/lib/recitation-ai/page-juz-lookup";
import { normalizeQuranWord } from "@/lib/recitation-ai/quran-normalize";
import type { AlertLevel, AlignmentEvent, PrecisionLevel, RecitationMode, ReferenceWord } from "@/lib/recitation-ai/types";
import "@/styles/recitation-ai.css";

type Phase = "setup" | "loading" | "detecting" | "session" | "report" | "error";

const MODE_LABELS: Record<RecitationMode, { label: string; hint: string }> = {
  full_hide: { label: "التسميع الكامل", hint: "النص مخفٍ تمامًا" },
  assisted: { label: "التسميع بالمساعدة", hint: "تلميح متدرج عند التوقف" },
  word_follow: { label: "المتابعة كلمة بكلمة", hint: "الصفحة ظاهرة، تُظلَّل الكلمات الصحيحة" },
  interactive_mushaf: { label: "المصحف التفاعلي", hint: "الكلمات مموَّهة وتنكشف بتلاوتك" },
  teacher_test: { label: "اختبار المعلّم", hint: "يبدأ من موضع عشوائي" },
  freeform: { label: "التسميع الحر", hint: "ابدأ التلاوة مباشرة — نكتشف السورة تلقائيًا" },
};

const ALERT_LABELS: Record<AlertLevel, string> = { gentle: "لطيف", medium: "متوسط", immediate: "فوري", teacher: "معلّم حقيقي" };

/**
 * موافقة مخصَّصة لميزة "اختبار التسميع بالذكاء الاصطناعي" تحديدًا — مفتاح
 * localStorage منفصل عمدًا عن recitation-test-consent-v1 (لوحة "استكشف
 * الآية" السريعة في RecitationTestPanel.tsx): هذه الميزة تحفظ نتائج
 * الجلسة (دقة، أخطاء، مدة) في قاعدة البيانات لحساب مسجَّل الدخول وتغذّي
 * الشارات/الإنجازات — نطاق مختلف تمامًا يستحق شرحًا وموافقة مستقلَّين، لا
 * إعادة استخدام قسرية لموافقة لوحة لا تحفظ شيئًا إطلاقًا.
 */
const RAI_CONSENT_KEY = "recitation-ai-full-consent-v1";
function hasRecitationAiConsent(): boolean {
  try { return localStorage.getItem(RAI_CONSENT_KEY) === "1"; } catch { return false; }
}
function grantRecitationAiConsent(): void {
  try { localStorage.setItem(RAI_CONSENT_KEY, "1"); } catch { /* تجاهل */ }
}

/** يستخرج نصًا صالحًا للعرض ورمز الخطأ (إن وُجد) من أي خطأ مُلتقَط — يميّز ASRProviderUnavailableError (رمز حقيقي) عن أي Error عام آخر. */
function describeAsrError(e: unknown): { message: string; code: ASRProviderError["code"] | null } {
  if (e instanceof ASRProviderUnavailableError) return { message: e.detail.message, code: e.detail.code };
  if (e instanceof Error) return { message: e.message, code: null };
  return { message: "خطأ غير معروف", code: null };
}

function RecitationTestPageInner() {
  const search = useSearch();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("setup");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // رمز خطأ المزوّد (PERMISSION_DENIED خاصة) — يُميَّز عن باقي الأخطاء
  // بشاشة إرشادية خطوة بخطوة حسب المنصة بدل نص خطأ عام (القسم 1 بند 4).
  const [errorCode, setErrorCode] = useState<ASRProviderError["code"] | null>(null);

  // إعداد
  const [surahNumber, setSurahNumber] = useState(1);
  const [mode, setMode] = useState<RecitationMode>("interactive_mushaf");
  const [precisionLevel, setPrecisionLevel] = useState<PrecisionLevel>("hifz");
  const [alertLevel, setAlertLevel] = useState<AlertLevel>("gentle");
  const [revealGranularity, setRevealGranularity] = useState<"word" | "ayah" | "page">("word");
  const [tajweedAvailable, setTajweedAvailable] = useState<{ available: boolean; reason?: string } | null>(null);
  const [dueReviews, setDueReviews] = useState<RecitationReviewItem[]>([]);
  // نطاق آيات مخصَّص (القسم 1: "من آية إلى آية" بدل السورة كاملة دومًا)
  // "page"/"juz"/"hizb"/"rub": نطاق عابر للسور، مبني من page-juz-index.json
  // (حقول page/juz/hizbQuarter الحقيقية في بيانات كل آية — لا تخطيط
  // بصري، راجع scripts/build-page-juz-index.mjs).
  const [rangeMode, setRangeMode] = useState<"surah" | "ayahRange" | "page" | "juz" | "hizb" | "rub">("surah");
  const [ayahFrom, setAyahFrom] = useState(1);
  const [ayahTo, setAyahTo] = useState(7);
  const [pageNumber, setPageNumber] = useState(1);
  const [juzNumber, setJuzNumber] = useState(1);
  const [hizbNumber, setHizbNumber] = useState(1);
  const [rubNumber, setRubNumber] = useState(1);
  const [recentSession, setRecentSession] = useState<{ surahNumber: number; ayahFrom: number | null; ayahTo: number | null; accuracyPct: number | null } | null>(null);

  // جلسة
  const [referenceWords, setReferenceWords] = useState<ReferenceWord[]>([]);
  const [wordStates, setWordStates] = useState<Map<string, "hidden" | "revealed" | "error" | "unclear" | "needs_repeat">>(new Map());
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

  // بطاقة التصحيح الحي (القسم: "المعلّم الحقيقي" + بند تفوّق "بطاقة
  // تصحيح حي") — تُملأ عند كل خطأ مؤكَّد (kind:"error")، بصرف النظر عن
  // alertLevel، فتُتاح للنقر عليها من المصحف نفسه دومًا؛ في alertLevel
  // "teacher" فقط تُفتَح تلقائيًا وتُوقِف الجلسة فعليًا حتى إعادة صحيحة.
  const [correctionCard, setCorrectionCard] = useState<{ ref: ReferenceWord; heardWord: string } | null>(null);
  const [teacherHold, setTeacherHold] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // شاشة الخصوصية المخصَّصة قبل أول استخدام (القسم 12)
  const [consentGiven, setConsentGiven] = useState(hasRecitationAiConsent);
  const [deletingData, setDeletingData] = useState(false);
  const [deleteResult, setDeleteResult] = useState<"success" | "error" | null>(null);

  // كشف المتشابهات (القسم 1: بند تفوّق — راجع src/lib/recitation-ai/mutashabihat.ts
  // وscripts/build-mutashabihat-index.mjs). يُحمَّل فقط عند بلوغ شاشة
  // التقرير (لا أثناء الجلسة الحيّة)، ونصوص الآيات المتشابهة الفعلية
  // (للمقارنة جنبًا إلى جنب) تُجلب عند الحاجة فقط.
  const [mutashabihatByKey, setMutashabihatByKey] = useState<Map<string, MutashabihMatch[]>>(new Map());
  const [mutashabihatTexts, setMutashabihatTexts] = useState<Map<string, string>>(new Map());

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
  /** يُلغي جلسة اكتشاف "التسميع الحر" الجارية — يُضبَط داخل startSessionFreeform فقط. */
  const freeformCancelRef = useRef<(() => void) | null>(null);
  // وضع الجلسة النشطة الفعلي — لا الاعتماد على إغلاق (closure) لحالة
  // mode داخل attachAsrSession (لا تُعاد بناؤه عند تغيّر mode فتبقى قيمة
  // قديمة)؛ يُضبَط مرة واحدة عند بدء كل جلسة ويُقرَأ من هنا دومًا.
  const activeModeRef = useRef<RecitationMode>("interactive_mushaf");
  // "اختبار المعلّم" (القسم 2، الوضع 5): زمن الاسترجاع = من بدء الاستماع
  // حتى أول كلمة صحيحة — يُعرَض في التقرير لهذا الوضع تحديدًا فقط.
  const recallStartAtRef = useRef<number | null>(null);
  const [recallMs, setRecallMs] = useState<number | null>(null);

  // alertLevel طازج داخل applyEvents (اعتماديات فارغة عمدًا، نفس سبب
  // استبعاد applyEvents من اعتماديات attachAsrSession أعلاه — TDZ).
  const alertLevelRef = useRef<AlertLevel>(alertLevel);
  useEffect(() => { alertLevelRef.current = alertLevel; }, [alertLevel]);

  // listening طازج لمستمع visibilitychange (مسجَّل مرة واحدة عند التركيب) — أدناه.
  const listeningRef = useRef(false);
  useEffect(() => { listeningRef.current = listening; }, [listening]);

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

  // ⚠️ إصلاح خلل حقيقي (تشخيص م3 "الظهور المتقطع"): كانت بلا try/catch —
  // أي خطأ من selectBestProvider/checkTajweedAvailability (استثناء
  // حقيقي، لا مجرد "لا مزوّد") يُصبح رفض وعد غير مُلتقَط. ErrorBoundary
  // **لا يلتقط** أخطاء المستدعيات غير المتزامنة (موثَّق بالفعل في تعليق
  // attachAsrSession أسفله) فلا ينهار المكوّن ظاهريًا، لكن tajweedAvailable
  // يبقى عالقًا عند null إلى الأبد — قد يترك جزءًا من شاشة الإعداد
  // متجمّدًا بصمت حسب كيفية استهلاكه لاحقًا في الواجهة.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const provider = (await selectBestProvider(navigator.onLine)).provider;
        if (cancelled) return;
        if (provider) {
          const result = await checkTajweedAvailability(provider);
          if (!cancelled) setTajweedAvailable(result);
        } else {
          setTajweedAvailable({ available: false, reason: "لا يتوفر محرك تعرّف صوتي بعد" });
        }
      } catch (err) {
        console.error("recitation-ai: فشل اكتشاف مزوّد التعرّف الصوتي", err);
        if (!cancelled) setTajweedAvailable({ available: false, reason: "تعذّر التحقق من محرك التعرّف الصوتي — أعد تحميل الصفحة" });
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
    setErrorCode(null);
    try {
      // "اختبار المعلّم" (القسم 2، الوضع 5): يبدأ من آية عشوائية داخل
      // النطاق المُختار بدل أوله دومًا — يقيس قدرة الاسترجاع الفعلية لا
      // مجرد بدء التلاوة من حفظ معروف بالترتيب. الفلترة عبر `globalIndex`
      // (فهرس متصاعد دومًا عبر كامل النطاق، حتى العابر لأكثر من سورة في
      // وضعَي "بالصفحة"/"بالجزء") لا عبر رقم الآية الخام وحده — رقم الآية
      // يتكرر عبر سور مختلفة (كل سورة تقريبًا لها آية 5)، فمقارنته وحده
      // عبر نطاق متعدد السور كانت ستُدرج/تُسقط كلمات من سور غير مقصودة.
      let words = wordsIn;
      if (mode === "teacher_test") {
        const seen = new Set<string>();
        const uniqueStarts: number[] = []; // globalIndex لكل موضع بداية آية فريد، بترتيب الظهور
        for (const w of wordsIn) {
          const key = `${w.surah}:${w.ayah}`;
          if (!seen.has(key)) { seen.add(key); uniqueStarts.push(w.globalIndex); }
        }
        if (uniqueStarts.length > 1) {
          const startGlobalIndex = uniqueStarts[Math.floor(Math.random() * (uniqueStarts.length - 1))];
          words = wordsIn.filter((w) => w.globalIndex >= startGlobalIndex);
        }
      }

      setReferenceWords(words);
      setWordStates(new Map(words.map((w) => [`${w.surah}:${w.ayah}:${w.wordIndex}`, "hidden" as const])));
      setCursorIdx(0);
      setLiveEvents([]);
      setJustCompletedAyah(null);
      setPaused(false);
      setCorrectionCard(null);
      setTeacherHold(false);
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
      const { message, code } = describeAsrError(e);
      setErrorMsg(message);
      setErrorCode(code);
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
      if (rangeMode === "page" || rangeMode === "juz" || rangeMode === "hizb" || rangeMode === "rub") {
        const index = await loadPageJuzIndex();
        const segments =
          rangeMode === "page" ? getSegmentsForPage(index, pageNumber) :
          rangeMode === "juz" ? getSegmentsForJuz(index, juzNumber) :
          rangeMode === "hizb" ? getSegmentsForHizb(index, hizbNumber) :
          getSegmentsForRub(index, rubNumber);
        if (segments.length === 0) {
          const rangeErrorMsg = {
            page: "رقم صفحة غير صالح (يجب أن يكون بين 1 و604).",
            juz: "رقم جزء غير صالح (يجب أن يكون بين 1 و30).",
            hizb: "رقم حزب غير صالح (يجب أن يكون بين 1 و60).",
            rub: "رقم ربع غير صالح (يجب أن يكون بين 1 و240).",
          }[rangeMode];
          setErrorMsg(rangeErrorMsg);
          setPhase("error");
          return;
        }
        const surahAyahs = await Promise.all(
          segments.map(async (seg) => {
            const detail = await fetchSurahDetail(seg.surah);
            const ayahs = detail.ayahs.filter((a) => a.numberInSurah >= seg.ayahFrom && a.numberInSurah <= seg.ayahTo);
            return { surahNumber: seg.surah, ayahs };
          }),
        );
        setSurahNumber(segments[0].surah); // للعرض/التوافق فقط — النطاق الفعلي قد يمتد لأكثر من سورة
        const words = buildReferenceWordsForRange(surahAyahs);
        await startSessionWithWords(words);
        return;
      }

      const detail = await fetchSurahDetail(surahNumber);
      const ayahs = rangeMode === "ayahRange"
        ? detail.ayahs.filter((a) => a.numberInSurah >= ayahFrom && a.numberInSurah <= ayahTo)
        : detail.ayahs;
      const words = buildReferenceWords(surahNumber, ayahs);
      await startSessionWithWords(words);
    } catch (e) {
      const { message, code } = describeAsrError(e);
      setErrorMsg(message);
      setErrorCode(code);
      setPhase("error");
    }
  }, [surahNumber, startSessionWithWords, user?.id, mode, precisionLevel, alertLevel, revealGranularity, rangeMode, ayahFrom, ayahTo, pageNumber, juzNumber, hizbNumber, rubNumber]);

  /**
   * "التسميع الحر" (القسم 2، الوضع 6): يبدأ الاستماع فورًا بلا اختيار
   * سورة/نطاق مسبق، ويُحدِّد السورة/الآية تلقائيًا من أول كلمات مسموعة
   * عبر FreeformStartDetector — بلا أي طلب شبكي أثناء الحسم نفسه (فهرس
   * المواضع مُحمَّل مسبقًا كاملاً). الكلمات المسموعة أثناء الاكتشاف نفسه
   * لا تُهدَر: تُعاد تغذيتها للمحرك فور إنشائه بمجرد معرفة نقطة البدء،
   * فتُحتسَب ضمن التقييم كأي كلمة أخرى.
   */
  const startSessionFreeform = useCallback(async () => {
    setPhase("detecting");
    setErrorMsg(null);
    setErrorCode(null);
    try {
      const [selection, positionIndex] = await Promise.all([selectBestProvider(navigator.onLine), loadPositionIndex()]);
      if (!selection.provider) {
        setErrorMsg("لا يتوفر محرك تعرّف صوتي على هذا الجهاز/المتصفح حاليًا. جرّب من تطبيق الجوال، أو تحقّق من إذن الميكروفون.");
        setPhase("error");
        return;
      }
      const provider = selection.provider;
      providerRef.current = provider;

      const asrSession = await provider.startSession({ language: "ar-SA", precisionLevel });
      asrSessionRef.current = asrSession;
      sessionStartRef.current = Date.now();

      if (!provider.onPartialWord) {
        setErrorMsg("المزوّد المتاح لا يدعم الاستماع اللحظي اللازم للتسميع الحر.");
        setPhase("error");
        return;
      }

      const detector = new FreeformStartDetector(positionIndex);
      const buffered: Array<{ word: string; atMs: number; confidence?: number }> = [];
      let detectionUnsub: (() => void) | null = null;

      freeformCancelRef.current = () => {
        detectionUnsub?.();
        setListening(false);
        void provider.endSession(asrSession).catch(() => {});
        setPhase("setup");
      };

      const finishDetectionFailure = () => {
        detectionUnsub?.();
        freeformCancelRef.current = null;
        setErrorMsg("تعذّر تحديد السورة تلقائيًا من التلاوة المسموعة. جرّب مجددًا بصوت أوضح، أو اختر السورة يدويًا من وضع آخر.");
        setListening(false);
        void provider.endSession(asrSession).catch(() => {});
        setPhase("setup");
      };

      const resolveAndStart = async (surah: number, ayah: number) => {
        detectionUnsub?.();
        freeformCancelRef.current = null;
        const detail = await fetchSurahDetail(surah);
        const rangeAyahs = detail.ayahs.filter((a) => a.numberInSurah >= ayah);
        const words = buildReferenceWords(surah, rangeAyahs);

        setSurahNumber(surah);
        setReferenceWords(words);
        setWordStates(new Map(words.map((w) => [`${w.surah}:${w.ayah}:${w.wordIndex}`, "hidden" as const])));
        setCursorIdx(0);
        setLiveEvents([]);
        setJustCompletedAyah(null);
        setPaused(false);
        setCorrectionCard(null);
        setTeacherHold(false);
        activeModeRef.current = "freeform";
        hintsUsedRef.current = 0;
        setHintLevel(0);
        recallStartAtRef.current = null;
        setRecallMs(null);

        const engine = new VerseAlignmentEngine({ referenceWords: words, alertLevel });
        engineRef.current = engine;

        // إعادة تغذية الكلمات المسموعة أثناء الاكتشاف نفسه — لا تُهدَر.
        for (const b of buffered) {
          try {
            applyEvents(engine.feedWord(b.word, b.atMs, b.confidence));
          } catch {
            // تجاهل — لا يجب أن يُفشل خللٌ في كلمة اكتشاف واحدة الجلسة كاملة
          }
        }

        unsubRef.current = provider.onPartialWord!(asrSession, (word, atMs, confidence) => {
          try {
            applyEvents(engine.feedWord(word, atMs, confidence));
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

        setListening(true);
        setPhase("session");
      };

      detectionUnsub = provider.onPartialWord(asrSession, (rawWord, atMs, confidence) => {
        buffered.push({ word: rawWord, atMs, confidence });
        const result = detector.feedWord(normalizeQuranWord(rawWord));
        if (result === null) return; // لم يُحسَم بعد — استمر بالاستماع
        if (result.length === 0) { finishDetectionFailure(); return; }
        void resolveAndStart(result[0].surah, result[0].ayah);
      });

      setListening(true);
    } catch (e) {
      const { message, code } = describeAsrError(e);
      setErrorMsg(message);
      setErrorCode(code);
      setPhase("error");
    }
    // applyEvents مُتعمَّد استبعاده من الاعتماديات (مطابقةً لـattachAsrSession
    // أعلاه) — هويته ثابتة دومًا (useCallback بمصفوفة اعتماديات فارغة)،
    // وتضمينه هنا كان سيُسبِّب خطأ TDZ وقت render لأن تعريفه لاحقًا في الملف.
  }, [alertLevel, precisionLevel]);

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

  /** حذف حقيقي (لا صوري) لكل بيانات جلسات التسميع المحفوظة لهذا المستخدم — شاشة الخصوصية. */
  const handleDeleteRecitationData = useCallback(async () => {
    if (!user?.id) return;
    setDeletingData(true);
    setDeleteResult(null);
    try {
      const ok = await deleteAllRecitationSessions(user.id);
      setDeleteResult(ok ? "success" : "error");
    } catch {
      setDeleteResult("error");
    } finally {
      setDeletingData(false);
    }
  }, [user?.id]);

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

  // وضع المعلّم الحقيقي: يستدعي pauseSession() الفعلية (تُغلق المايكروفون
  // حقًا، لا مجرد تجاهل بصري) بمجرد ضبط teacherHold=true من applyEvents —
  // عبر useEffect مدفوع بالحالة بدل استدعاء pauseSession مباشرة من داخل
  // applyEvents (كانت ستحتاج إدراجها ضمن اعتماديات فارغة عمدًا لتفادي TDZ،
  // ونفس الخلل الموثَّق أعلاه لحالات setState متسابقة).
  useEffect(() => {
    if (teacherHold) void pauseSession();
  }, [teacherHold, pauseSession]);

  // استئناف تلقائي أدق (القسم 12: "لا يُبقي الجلسة عالقة صامتًا عند
  // انتقال المستخدم بعيدًا"): عند إخفاء التبويب/تصغير التطبيق أثناء
  // استماع فعلي، تُوقَف الجلسة فعليًا (pauseSession — نفس المسار المتاح
  // يدويًا بزر الإيقاف المؤقت، لا مجرد تجاهل بصري) بدل ترك مايكروفون
  // نشطًا بلا فائدة في الخلفية (يستنزف البطارية، وبعض المتصفحات/المنصات
  // الأصلية تُنهي جلسة ASR من تلقاء نفسها بصمت عند التصغير على أي حال،
  // فتُبقي الحالة الظاهرة "يستمع" غير صادقة). **لا استئناف تلقائي** عند
  // العودة عمدًا — إعادة تفعيل المايكروفون بلا فعل واعٍ من المستخدم قد
  // تُفاجئه؛ زر "استئناف الاستماع" (▶) الموجود أصلاً يبقى الخيار الوحيد.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && listeningRef.current) void pauseSession();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [pauseSession]);

  /**
   * "أعد من هذه الكلمة" — القسم "المعلّم الحقيقي": لا مجرد استئناف من حيث
   * توقفت الجلسة (ذاك مسار resumeSession العادي)، بل محرك محاذاة جديد
   * كليًا مصدره الكلمات من موضع الخطأ فصاعدًا (referenceWords.slice) —
   * تحقّق حقيقي بإعادة الاستماع لنفس الكلمة، لا إقرار بصري فقط بأنها
   * "صُحِّحت". حالات الكلمات من موضع الخطأ فصاعدًا تُعاد لـ"hidden" لأنها
   * ستُختبَر من جديد.
   */
  const retryFromError = useCallback(async () => {
    const failed = correctionCard;
    const provider = providerRef.current;
    if (!failed || !provider) return;
    setRetrying(true);
    try {
      const remaining = referenceWords.filter((w) => w.globalIndex >= failed.ref.globalIndex);
      setWordStates((prev) => {
        const next = new Map(prev);
        for (const w of remaining) next.set(`${w.surah}:${w.ayah}:${w.wordIndex}`, "hidden");
        return next;
      });
      const engine = new VerseAlignmentEngine({ referenceWords: remaining, alertLevel: alertLevelRef.current });
      engineRef.current = engine;
      setCorrectionCard(null);
      setTeacherHold(false);
      await attachAsrSession(provider, engine);
      setListening(true);
      setPaused(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "تعذّر إعادة المحاولة");
    } finally {
      setRetrying(false);
    }
  }, [correctionCard, referenceWords, attachAsrSession]);

  /** إغلاق بطاقة التصحيح دون إعادة اختبار الكلمة — تبقى الجلسة متقدِّمة من نفس موضعها الحالي. متاح فقط خارج وضع المعلّم (فيه الإغلاق إلزامي عبر "أعد من هذه الكلمة" فقط). */
  const dismissCorrectionCard = useCallback(() => {
    if (teacherHold) return;
    setCorrectionCard(null);
  }, [teacherHold]);

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
        } else if (e.kind === "needs_repeat") {
          next.set(`${e.ref.surah}:${e.ref.ayah}:${e.ref.wordIndex}`, "needs_repeat");
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

    // بطاقة التصحيح الحي + Haptics + وضع المعلّم الحقيقي — تُحسَب من آخر
    // حدث "error" في هذه الدفعة، بلا أي علاقة بمُحدِّث setWordStates
    // أعلاه (نفس نمط unclearNotice قبله تمامًا: استدعاء setState منفصل).
    const lastError = [...events].reverse().find((e) => e.kind === "error");
    if (lastError && lastError.kind === "error" && lastError.ref && lastError.heardWord) {
      setCorrectionCard({ ref: lastError.ref, heardWord: lastError.heardWord });
      if (alertLevelRef.current === "immediate" || alertLevelRef.current === "teacher") {
        void hapticNotify("error");
      }
      if (alertLevelRef.current === "teacher") {
        setTeacherHold(true);
      }
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
      // وضع "اختبار المعلّم" حيث يبدأ النطاق الفعلي من آية عشوائية، ووضع
      // "التسميع الحر" حيث يبدأ من آية مُكتشَفة تلقائيًا لا من أول السورة.
      const sessionAyahs = referenceWords.map((w) => w.ayah);
      const actualAyahFrom = sessionAyahs.length ? Math.min(...sessionAyahs) : ayahFrom;
      const actualAyahTo = sessionAyahs.length ? Math.max(...sessionAyahs) : ayahTo;
      const isWholeSurah = rangeMode === "surah" && mode !== "teacher_test" && mode !== "freeform";
      const range: SessionRangeInput =
        rangeMode === "page" ? { rangeType: "page", pageNumber } :
        rangeMode === "juz" ? { rangeType: "juz", juzNumber } :
        rangeMode === "hizb" ? { rangeType: "hizb", hizbNumber } :
        rangeMode === "rub" ? { rangeType: "rub", rubNumber } :
        isWholeSurah ? { rangeType: "surah", surahNumber } :
        { rangeType: "ayah_range", surahNumber, ayahFrom: actualAyahFrom, ayahTo: actualAyahTo };

      await saveRecitationSession(
        user.id,
        {
          range,
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

      // إضافة الآيات كثيرة الأخطاء لخطة المراجعة تلقائيًا (القسم 10) —
      // تُجمَّع حسب (سورة:آية) الفعلية من كل حدث خطأ، لا حسب `surahNumber`
      // الحالة الواحدة: نطاقا "بالصفحة"/"بالجزء" يمتدان غالبًا لأكثر من
      // سورة، فاستخدام `surahNumber` وحدها كان سيُسجِّل مراجعات بسورة
      // خاطئة لأي خطأ يقع في سورة غير أول سورة بالنطاق.
      const errorSurahAyahPairs = new Set(
        errors
          .map((e) => (e.kind === "error" ? e.ref : null))
          .filter((ref): ref is NonNullable<typeof ref> => ref !== null && ref !== undefined)
          .map((ref) => `${ref.surah}:${ref.ayah}`),
      );
      for (const pair of errorSurahAyahPairs) {
        const [s, a] = pair.split(":").map(Number);
        await addRecitationReviewItem(user.id, s, a, a);
      }
    },
    [user?.id, surahNumber, mode, precisionLevel, alertLevel, referenceWords, rangeMode, ayahFrom, ayahTo, pageNumber, juzNumber, hizbNumber, rubNumber],
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
  // "يحتاج إعادة" — المستوى الأوسط في نظام الثقة الثلاثي (TASMEE_AUDIT.md
  // القسم 5 بند 3): يُسجَّل ويُعرَض في التقرير (خلافًا لـ"غير واضح")، لكن
  // بلا احتساب ضمن الأخطاء المؤكَّدة (خلافًا لـ"error").
  const needsRepeatEvents = liveEvents.filter((e): e is Extract<AlignmentEvent, { kind: "needs_repeat" }> => e.kind === "needs_repeat");

  // كشف المتشابهات: يُحمَّل الفهرس فقط عند بلوغ شاشة التقرير (لا أثناء
  // الجلسة الحيّة — لا فائدة تعليمية أثناء التسميع نفسه، فقط تشتيت محتمل).
  useEffect(() => {
    if (phase !== "report") return;
    let cancelled = false;
    const errorAyahKeys = new Set(
      errorEvents.filter((e) => e.ref).map((e) => `${e.ref!.surah}:${e.ref!.ayah}`),
    );
    if (errorAyahKeys.size === 0) return;

    (async () => {
      try {
        const index = await loadMutashabihatIndex();
        if (cancelled) return;
        const matches = new Map<string, MutashabihMatch[]>();
        for (const key of errorAyahKeys) {
          const [s, a] = key.split(":").map(Number);
          const m = getSimilarAyahs(index, s, a);
          if (m.length > 0) matches.set(key, m);
        }
        setMutashabihatByKey(matches);

        // نصوص أقرب تشابه فقط (لا كل المطابقات) — تفاديًا لجلب شبكي غير ضروري.
        const texts = new Map<string, string>();
        for (const [, m] of matches) {
          const top = m[0];
          const textKey = `${top.surah}:${top.ayah}`;
          if (texts.has(textKey)) continue;
          try {
            const detail = await fetchSurahDetail(top.surah);
            const ayahText = detail.ayahs.find((a) => a.numberInSurah === top.ayah)?.text;
            if (ayahText) texts.set(textKey, ayahText);
          } catch {
            // تجاهل — التشابه يبقى معروضًا بلا نص مقارنة إن فشل الجلب
          }
        }
        if (!cancelled) setMutashabihatTexts(texts);
      } catch {
        // فشل تحميل الفهرس (شبكة/404) — لا يُفسد شاشة التقرير، يبقى القسم مخفيًا بصمت
      }
    })();

    return () => { cancelled = true; };
  }, [phase]);

  // شاشة الخصوصية المخصَّصة — تُعرَض قبل أي استخدام فعلي للميزة (تسبق كل
  // الأطوار الأخرى)، مرة واحدة فقط لكل جهاز/متصفح (localStorage). توضّح
  // بالتحديد ما يختلف هنا عن أي إذن ميكروفون عادي: نتائج الجلسة (الدقة
  // وتفاصيل الأخطاء) تُحفَظ في قاعدة البيانات لمن سجّل الدخول لتغذية
  // التقارير ومراجعة الأخطاء المتكررة والشارات — مع زر حذف حقيقي يعمل الآن.
  if (!consentGiven) {
    return (
      <div className="rai-page">
        <div className="rai-consent-screen">
          <h1 className="rai-header__title">قبل أن نبدأ</h1>
          <p className="rai-consent-screen__intro">
            "اختبار التسميع بالذكاء الاصطناعي" يستمع لتلاوتك عبر ميكروفون جهازك
            ليقارنها بنص الآيات فور نطقها. إليك بالتحديد ما يحدث ببياناتك:
          </p>
          <ul className="rai-consent-screen__list">
            <li>سيُطلَب إذن الميكروفون فقط عند ضغطك "ابدأ التسميع" — لا استماع في الخلفية بلا علمك.</li>
            <li>الصوت نفسه لا يُسجَّل ولا يُرسَل لخوادم مجالس مطلقًا؛ التعرّف الصوتي يتم على جهازك، أو عبر خدمة نظام التشغيل (Apple/Google) حين لا يتوفر تعرّف كامل محليًا.</li>
            <li>إن سجّلت الدخول: نتيجة كل جلسة (نسبة الدقة، مواضع الأخطاء، المدة) تُحفَظ في حسابك لعرضها في التقارير ومراجعة الأخطاء المتكررة، وتُحتسَب ضمن شارات الإنجاز.</li>
            <li>زائر بلا حساب: لا شيء يُحفَظ عبر الأجهزة — فقط أثناء الجلسة نفسها.</li>
            <li>يمكنك حذف كل بيانات جلسات التسميع المحفوظة نهائيًا في أي وقت — الزر أدناه فعّال الآن، لا وعد مستقبلي.</li>
          </ul>

          {user?.id && (
            <div className="rai-consent-screen__delete">
              <button type="button" className="rai-consent-screen__delete-btn" onClick={() => void handleDeleteRecitationData()} disabled={deletingData}>
                {deletingData ? "جارٍ الحذف…" : "حذف كل بيانات جلسات التسميع المحفوظة"}
              </button>
              {deleteResult === "success" && <p className="rai-consent-screen__delete-status rai-consent-screen__delete-status--ok">تم الحذف بنجاح.</p>}
              {deleteResult === "error" && <p className="rai-consent-screen__delete-status rai-consent-screen__delete-status--err">تعذّر الحذف. حاول مجددًا.</p>}
            </div>
          )}

          <p className="rai-report__disclaimer">
            التفاصيل الكاملة في <a href="/privacy" style={{ color: "var(--rai-emerald)" }}>سياسة الخصوصية</a>.
          </p>

          <button
            type="button"
            className="rai-start-btn"
            onClick={() => { grantRecitationAiConsent(); setConsentGiven(true); }}
          >
            أوافق، تابع إلى الميزة
          </button>
        </div>
      </div>
    );
  }

  if (phase === "detecting") {
    return (
      <div className="rai-page">
        <div className="rai-header">
          <h1 className="rai-header__title">
            اختبار التسميع بالذكاء الاصطناعي
            <span className="rai-experimental-badge">نسخة تجريبية</span>
          </h1>
        </div>
        <div className="rai-detecting">
          <div className="rai-listen-wave" aria-hidden="true"><span /><span /><span /></div>
          <p className="rai-detecting__title">نستمع... تابع التلاوة</p>
          <p className="rai-detecting__hint">نحدِّد السورة والآية تلقائيًا من كلماتك — لا حاجة للتوقف.</p>
          <button
            type="button"
            className="rai-icon-btn"
            onClick={() => freeformCancelRef.current?.()}
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

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

        {errorMsg && errorCode !== "PERMISSION_DENIED" && (
          <p className="rai-tajweed-disabled-note" style={{ maxWidth: 720, margin: "0 auto 1rem" }}>{errorMsg}</p>
        )}

        {/* شاشة إرشادية مخصَّصة لرفض إذن الميكروفون — خطوات فعل حسب المنصة
            الفعلية (Capacitor iOS/Android أو متصفح) بدل نص خطأ عام، مع زر
            إعادة محاولة حقيقي (يعيد محاولة بدء الجلسة، لا مجرد إخفاء الرسالة). */}
        {errorCode === "PERMISSION_DENIED" && (
          <div className="rai-permission-guide" role="alert">
            <p className="rai-permission-guide__title">يحتاج التطبيق إذن الميكروفون للاستماع لتلاوتك</p>
            <p className="rai-permission-guide__steps">
              {isNative && isIOS
                ? "افتح إعدادات آيفون ← مرِّر لتطبيق «المجلس العلمي» ← فعِّل «الميكروفون» و«التعرّف على الكلام»، ثم عد وحاول مجددًا."
                : isNative && isAndroid
                  ? "افتح إعدادات الجهاز ← التطبيقات ← «المجلس العلمي» ← الأذونات ← فعِّل «الميكروفون»، ثم عد وحاول مجددًا."
                  : "اضغط على أيقونة القفل 🔒 بجانب عنوان الموقع في المتصفح ← اسمح بإذن «الميكروفون» لهذا الموقع، ثم أعد تحميل الصفحة."}
            </p>
            <button type="button" className="rai-permission-guide__retry" onClick={() => { setErrorMsg(null); setErrorCode(null); setPhase("setup"); }}>
              حسنًا، حاول مجددًا
            </button>
          </div>
        )}

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
          {mode !== "freeform" && (
            <div className="rai-setup__group">
              <span className="rai-setup__label">النطاق</span>
              <div className="rai-choice-grid">
                <button type="button" className={`rai-choice ${rangeMode === "surah" ? "rai-choice--active" : ""}`} onClick={() => setRangeMode("surah")}>
                  السورة كاملة
                </button>
                <button type="button" className={`rai-choice ${rangeMode === "ayahRange" ? "rai-choice--active" : ""}`} onClick={() => setRangeMode("ayahRange")}>
                  من آية إلى آية
                </button>
                <button type="button" className={`rai-choice ${rangeMode === "page" ? "rai-choice--active" : ""}`} onClick={() => setRangeMode("page")}>
                  بالصفحة
                </button>
                <button type="button" className={`rai-choice ${rangeMode === "juz" ? "rai-choice--active" : ""}`} onClick={() => setRangeMode("juz")}>
                  بالجزء
                </button>
                <button type="button" className={`rai-choice ${rangeMode === "hizb" ? "rai-choice--active" : ""}`} onClick={() => setRangeMode("hizb")}>
                  بالحزب
                </button>
                <button type="button" className={`rai-choice ${rangeMode === "rub" ? "rai-choice--active" : ""}`} onClick={() => setRangeMode("rub")}>
                  بالربع
                </button>
              </div>

              {(rangeMode === "surah" || rangeMode === "ayahRange") && (
                <div style={{ marginTop: ".6rem" }}>
                  <label className="rai-setup__label" htmlFor="rai-surah">السورة</label>
                  <select id="rai-surah" className="rai-surah-select" value={surahNumber} onChange={(e) => setSurahNumber(Number(e.target.value))}>
                    {surahs.map((s) => (
                      <option key={s.number} value={s.number}>{s.number}. {s.name} ({s.ayahs} آية)</option>
                    ))}
                  </select>
                </div>
              )}

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

              {rangeMode === "page" && (
                <label style={{ display: "block", marginTop: ".6rem" }}>
                  <span className="rai-choice__hint">رقم الصفحة (1-604، ترقيم مصحف المدينة)</span>
                  <input
                    type="number" min={1} max={604} value={pageNumber}
                    onChange={(e) => setPageNumber(Math.min(Math.max(Number(e.target.value) || 1, 1), 604))}
                  />
                </label>
              )}

              {rangeMode === "juz" && (
                <label style={{ display: "block", marginTop: ".6rem" }}>
                  <span className="rai-choice__hint">رقم الجزء (1-30)</span>
                  <input
                    type="number" min={1} max={30} value={juzNumber}
                    onChange={(e) => setJuzNumber(Math.min(Math.max(Number(e.target.value) || 1, 1), 30))}
                  />
                </label>
              )}

              {rangeMode === "hizb" && (
                <label style={{ display: "block", marginTop: ".6rem" }}>
                  <span className="rai-choice__hint">رقم الحزب (1-60)</span>
                  <input
                    type="number" min={1} max={60} value={hizbNumber}
                    onChange={(e) => setHizbNumber(Math.min(Math.max(Number(e.target.value) || 1, 1), 60))}
                  />
                </label>
              )}

              {rangeMode === "rub" && (
                <label style={{ display: "block", marginTop: ".6rem" }}>
                  <span className="rai-choice__hint">رقم ربع الحزب (1-240)</span>
                  <input
                    type="number" min={1} max={240} value={rubNumber}
                    onChange={(e) => setRubNumber(Math.min(Math.max(Number(e.target.value) || 1, 1), 240))}
                  />
                </label>
              )}
            </div>
          )}

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
                <button type="button" className={`rai-choice ${revealGranularity === "page" ? "rai-choice--active" : ""}`} onClick={() => setRevealGranularity("page")}>إخفاء الصفحة</button>
              </div>
            </div>
          )}

          {mode === "freeform" && (
            <p className="rai-tajweed-disabled-note">
              لا حاجة لاختيار سورة — اضغط "ابدأ" وابدأ التلاوة مباشرة (يمكنك البدء بالبسملة كالمعتاد)،
              وسنكتشف السورة والآية تلقائيًا من أول كلماتك. إن تعذّر التحديد، أعد المحاولة بصوت أوضح.
            </p>
          )}

          <p className="rai-pre-session-warning" role="alert">
            هذه الميزة تجريبية وقد لا تكتشف جميع الأخطاء بدقة. لا تعتمد عليها بديلًا عن العرض على معلّم متقن.
          </p>

          <button
            type="button"
            className="rai-start-btn"
            onClick={mode === "freeform" ? () => void startSessionFreeform() : startSession}
            disabled={phase === "loading"}
          >
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

          {/* بطاقة التصحيح الحي — تُعرَض تلقائيًا فقط في alertLevel "فوري"/"معلّم
              حقيقي" (نمط "لطيف"/"متوسط" بلا مقاطعة تلقائية عمدًا، يبقى الخطأ
              مرئيًا في تظليل الكلمة + قائمة التقرير لاحقًا فقط). في وضع
              المعلّم تحديدًا: الجلسة متوقفة فعليًا (مايكروفون مغلق عبر
              teacherHold أعلاه) ولا خيار سوى "أعد من هذه الكلمة". */}
          {correctionCard && (alertLevel === "immediate" || alertLevel === "teacher") && (
            <div className="rai-correction-card" role="alertdialog" aria-label="بطاقة تصحيح">
              {teacherHold && <p className="rai-correction-card__teacher-note">توقفت الجلسة — صحّح ثم أعد النطق</p>}
              <p className="rai-correction-card__row">
                <span className="rai-correction-card__label">قرأتَ:</span>
                <bdi className="rai-correction-card__heard">{correctionCard.heardWord}</bdi>
              </p>
              <p className="rai-correction-card__row">
                <span className="rai-correction-card__label">الصواب:</span>
                <bdi className="rai-correction-card__correct">{correctionCard.ref.raw}</bdi>
              </p>
              <div className="rai-correction-card__actions">
                <button type="button" className="rai-correction-card__retry" onClick={() => void retryFromError()} disabled={retrying}>
                  {retrying ? "جارٍ الاستئناف…" : "أعد من هذه الكلمة"}
                </button>
                {!teacherHold && (
                  <button type="button" className="rai-correction-card__dismiss" onClick={dismissCorrectionCard}>
                    إغلاق
                  </button>
                )}
              </div>
            </div>
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
                  state === "needs_repeat" ? "rai-plain-word--needs-repeat" :
                  "rai-plain-word--pending";
                const showText = mode !== "full_hide" || state !== "hidden";
                return (
                  <Fragment key={i}>
                    <span className={cls}>{showText ? w.raw : "ــــ"}</span>
                    {i < referenceWords.length - 1 ? " " : ""}
                  </Fragment>
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
          {needsRepeatEvents.length > 0 && (
            <div className="rai-report__stat rai-report__stat--needs-repeat" title="ثقة متوسطة — قد تكون خطأ حفظ حقيقيًا أو مجرد التقاط غير حاسم، فلا جزم كامل ولا تنبيه أحمر">
              <span className="rai-report__stat-val">{needsRepeatEvents.length}</span><span className="rai-report__stat-lbl">يحتاج إعادة</span>
            </div>
          )}
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
                {(() => {
                  const mKey = `${group.surah}:${group.ayah}`;
                  const matches = mutashabihatByKey.get(mKey);
                  if (!matches || matches.length === 0) return null;
                  const top = matches[0];
                  const topKey = `${top.surah}:${top.ayah}`;
                  const otherText = mutashabihatTexts.get(topKey);
                  const thisText = referenceWords.filter((w) => w.surah === group.surah && w.ayah === group.ayah).map((w) => w.raw).join(" ");
                  return (
                    <div className="rai-mutashabih-note">
                      <p className="rai-mutashabih-note__title">
                        ⚠️ هذه الآية لها آية مشابهة نصيًا (سبب شائع للخلط أثناء الحفظ) — سورة {top.surah}:{top.ayah}
                        {matches.length > 1 ? ` (و${matches.length - 1} أخرى)` : ""}
                      </p>
                      {otherText && (
                        <div className="rai-mutashabih-note__diff">
                          <p><bdi>{thisText}</bdi> <span className="rai-mutashabih-note__loc">({group.surah}:{group.ayah})</span></p>
                          <p><bdi>{otherText}</bdi> <span className="rai-mutashabih-note__loc">({top.surah}:{top.ayah})</span></p>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
