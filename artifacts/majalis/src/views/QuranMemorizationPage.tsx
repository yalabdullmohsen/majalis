import "@/styles/quran-memorization.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { applyPageSeo } from "@/lib/seo";
import { fetchSurahList, type SurahSummary } from "@/lib/quran-api";
import {
  TEST_LABELS,
  TEST_DESCRIPTIONS,
  generateQuestion,
  fetchRandomAyah,
  fetchAdjacentAyah,
  addCard,
  reviewCard,
  getDueCards,
  getStatsSnapshot,
  type TestType,
  type QuizQuestion,
  type AyahCard,
} from "@/lib/quran-memorization";
import { BookOpen, ChevronLeft, Mic, MicOff, RotateCcw } from "lucide-react";

const ALL_TEST_TYPES: TestType[] = [
  "complete-ayah",
  "fill-blank",
  "which-surah",
  "multiple-choice",
  "first-word",
  "ayah-number",
  "surah-type",
  "juz-number",
  "surah-count",
  "next-ayah",
  "prev-ayah",
  "order-ayahs",
];

type Phase = "setup" | "quiz" | "end";

/* ═══════════════════════════════════════════════════
   مكوّن السؤال
═══════════════════════════════════════════════════ */
function QuestionCard({
  question,
  onAnswer,
}: {
  question: QuizQuestion;
  onAnswer: (correct: boolean, rating?: 0 | 1 | 2 | 3 | 4 | 5) => void;
}) {
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [adjacentAyah, setAdjacentAyah] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const w = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : {};
  const hasSpeechSupport = "SpeechRecognition" in w || "webkitSpeechRecognition" in w;

  const toggleVoice = () => {
    if (!hasSpeechSupport) return;
    const SR = (w["SpeechRecognition"] || w["webkitSpeechRecognition"]) as (new () => {
      lang: string; continuous: boolean; interimResults: boolean;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      start: () => void; stop: () => void;
    }) | undefined;
    if (!SR) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "ar-SA";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join("");
      setTextInput((prev) => prev + transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  const isTextInput = ["complete-ayah", "fill-blank", "next-ayah", "prev-ayah", "order-ayahs"].includes(question.type);
  const isAutoReveal = ["next-ayah", "prev-ayah", "order-ayahs"].includes(question.type);

  useEffect(() => {
    setAnswered(false);
    setSelectedOption(null);
    setTextInput("");
    setIsCorrect(false);
    setAdjacentAyah(null);
  }, [question.id]);

  useEffect(() => {
    if (isAutoReveal) {
      const dir = question.type === "next-ayah" ? "next" : question.type === "prev-ayah" ? "prev" : null;
      if (dir) {
        fetchAdjacentAyah(question.surahNumber, question.ayahNumber, dir)
          .then((ayah) => setAdjacentAyah(ayah?.text ?? "لا توجد آية"))
          .catch(() => setAdjacentAyah("تعذّر التحميل"));
      }
    }
  }, [question, isAutoReveal]);

  const handleOption = (opt: string) => {
    if (answered) return;
    const correct = opt === question.correctAnswer;
    setSelectedOption(opt);
    setIsCorrect(correct);
    setAnswered(true);
  };

  const handleTextSubmit = () => {
    if (answered || !textInput.trim()) return;
    if (isAutoReveal) {
      setIsCorrect(true);
      setAnswered(true);
      return;
    }
    const correct = textInput.trim().includes(question.correctAnswer.slice(0, 5));
    setIsCorrect(correct);
    setAnswered(true);
  };

  const handleRating = (rating: 0 | 1 | 3 | 5) => {
    onAnswer(isCorrect, rating as 0 | 1 | 2 | 3 | 4 | 5);
  };

  return (
    <div className="qmem-card">
      <div className="qmem-card__type">
        <BookOpen size={13} />
        {TEST_LABELS[question.type]} — سورة {question.surahName} (آية {question.ayahNumber})
      </div>

      <p className="qmem-card__prompt">
        {question.prompt.replace(/\n/g, "\n")}
      </p>

      {question.options ? (
        <div className="qmem-options">
          {question.options.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={answered}
              onClick={() => handleOption(opt)}
              className={`qmem-option${
                answered && opt === question.correctAnswer
                  ? " qmem-option--correct"
                  : answered && opt === selectedOption && opt !== question.correctAnswer
                  ? " qmem-option--wrong"
                  : ""
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : isTextInput ? (
        <div className="qmem-input-wrap">
          {isAutoReveal ? (
            <div className="qmem-ayah-text">
              {adjacentAyah ?? "جارٍ التحميل..."}
            </div>
          ) : (
            <>
              <div className="qmem-input-row">
                <textarea
                  className="qmem-answer-input"
                  rows={3}
                  aria-label="أدخل إجابتك" placeholder="أدخل إجابتك..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={answered}
                  dir="rtl"
                />
                {hasSpeechSupport && !answered && (
                  <button
                    type="button"
                    className={`qmem-voice-btn${isListening ? " qmem-voice-btn--active" : ""}`}
                    onClick={toggleVoice}
                    aria-label={isListening ? "إيقاف التسجيل" : "إدخال صوتي"}
                    title={isListening ? "إيقاف التسجيل" : "إدخال صوتي"}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
              </div>
              {!answered && (
                <button
                  type="button"
                  className="qmem-submit-btn"
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                >
                  تحقق
                </button>
              )}
            </>
          )}
        </div>
      ) : null}

      {/* نتيجة */}
      {answered && !isAutoReveal && (
        <div className={`qmem-result qmem-result--${isCorrect ? "correct" : "wrong"}`}>
          <p className="qmem-result__label">
            {isCorrect ? "✓ إجابة صحيحة!" : "✗ إجابة خاطئة"}
          </p>
          {!isCorrect && (
            <p className="qmem-result__answer">
              الإجابة الصحيحة: <strong>{question.correctAnswer}</strong>
            </p>
          )}
          <p className="qmem-result__full">
            الآية الكاملة: {question.fullAyah}
          </p>
        </div>
      )}

      {isAutoReveal && (
        <div className="qmem-result qmem-result--correct" style={{ marginTop: "0.75rem" }}>
          <p className="qmem-result__label">الآية الكاملة للمراجعة:</p>
          <p className="qmem-result__full" style={{ fontFamily: "Amiri Quran, serif", fontSize: "1rem" }}>
            {question.fullAyah}
          </p>
        </div>
      )}

      {/* تقييم الإجابة لـ Spaced Repetition */}
      {(answered || isAutoReveal) && (
        <>
          <div className="qmem-rating">
            <span className="qmem-rating__label">تقييم مستوى الحفظ:</span>
            <button type="button" className="qmem-rating-btn qmem-rating-btn--0" onClick={() => handleRating(0)}>لم أحفظ</button>
            <button type="button" className="qmem-rating-btn qmem-rating-btn--1" onClick={() => handleRating(1)}>صعب</button>
            <button type="button" className="qmem-rating-btn qmem-rating-btn--3" onClick={() => handleRating(3)}>جيد</button>
            <button type="button" className="qmem-rating-btn qmem-rating-btn--5" onClick={() => handleRating(5)}>ممتاز</button>
          </div>
          <button
            type="button"
            className="qmem-next-btn"
            onClick={() => onAnswer(isCorrect)}
          >
            السؤال التالي ←
          </button>
        </>
      )}

      {isAutoReveal && !answered && (
        <button
          type="button"
          className="qmem-next-btn"
          style={{ background: "#176B57" }}
          onClick={() => { setAnswered(true); }}
        >
          اعرض الإجابة
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   الصفحة الرئيسية
═══════════════════════════════════════════════════ */
export default function QuranMemorizationPage() {
  const [surahList, setSurahList] = useState<SurahSummary[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<TestType>("complete-ayah");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [dueCards, setDueCards] = useState<AyahCard[]>([]);
  const [stats, setStats] = useState(getStatsSnapshot());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/quran-memorization",
      title: "اختبارات الحفظ القرآني | المجلس العلمي",
      description:
        "12 نوعًا من اختبارات حفظ القرآن الكريم مع نظام المراجعة المتباعدة (Spaced Repetition). اختبر حفظك وتتبّع تقدمك سورةً سورة.",
      keywords: ["حفظ القرآن", "اختبار الحفظ", "مراجعة القرآن", "حفظ السور", "spaced repetition"],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: "اختبارات الحفظ القرآني",
        description: "12 نوعًا من اختبارات حفظ القرآن الكريم مع نظام المراجعة المتباعدة.",
        url: "https://www.majlisilm.com/quran-memorization",
        inLanguage: "ar",
        educationalLevel: "Beginner",
        learningResourceType: "Quiz",
        publisher: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
      }],
    });

    fetchSurahList()
      .then((list) => setSurahList(list))
      .catch(() => setError("تعذّر تحميل قائمة السور. تحقق من الاتصال بالإنترنت."));

    setDueCards(getDueCards());
  }, []);

  const startSession = useCallback(async () => {
    if (!selectedSurah || loading) return;
    setLoading(true);
    setError(null);

    try {
      const SESSION_SIZE = 5;
      const qs: QuizQuestion[] = [];

      for (let i = 0; i < SESSION_SIZE; i++) {
        const { surah, ayah } = await fetchRandomAyah(selectedSurah);
        // أضف الآية لنظام المراجعة تلقائيًا
        addCard(surah.number, surah.name, ayah.numberInSurah, ayah.text);
        const q = await generateQuestion(selectedType, surah.number, ayah, surah.name);
        qs.push(q);
      }

      setQuestions(qs);
      setCurrentIdx(0);
      setScore(0);
      setPhase("quiz");
    } catch {
      setError("تعذّر تحميل أسئلة الاختبار. تحقق من الاتصال بالإنترنت.");
    } finally {
      setLoading(false);
    }
  }, [selectedSurah, selectedType, loading]);

  const handleAnswer = useCallback(
    (correct: boolean, rating?: 0 | 1 | 2 | 3 | 4 | 5) => {
      if (correct) setScore((s) => s + 1);

      // تحديث SM-2
      if (rating !== undefined) {
        const q = questions[currentIdx];
        const key = `${q.surahNumber}:${q.ayahNumber}`;
        reviewCard(key, rating);
        setStats(getStatsSnapshot());
      }

      if (currentIdx + 1 >= questions.length) {
        setPhase("end");
        setDueCards(getDueCards());
      } else {
        setCurrentIdx((i) => i + 1);
      }
    },
    [currentIdx, questions]
  );

  const resetSession = () => {
    setPhase("setup");
    setQuestions([]);
    setCurrentIdx(0);
    setScore(0);
    setStats(getStatsSnapshot());
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="qmem-page">
      {/* Hero */}
      <div className="qmem-hero">
        <div className="qmem-hero__icon">📖</div>
        <h1 className="qmem-hero__title">اختبارات الحفظ القرآني</h1>
        <p className="qmem-hero__sub">
          12 نوعًا من اختبارات الحفظ مع نظام المراجعة المتباعدة
        </p>
        <div className="qmem-stats">
          <div className="qmem-stat">
            <span className="qmem-stat__num">{stats.total}</span>
            <span className="qmem-stat__lbl">آية محفوظة</span>
          </div>
          <div className="qmem-stat">
            <span className="qmem-stat__num">{stats.due}</span>
            <span className="qmem-stat__lbl">للمراجعة الآن</span>
          </div>
          <div className="qmem-stat">
            <span className="qmem-stat__num">{stats.mastered}</span>
            <span className="qmem-stat__lbl">متقنة</span>
          </div>
        </div>
      </div>

      <div className="qmem-body">
        {error && (
          <div style={{ padding: "1rem", background: "#fee2e2", borderRadius: "10px", color: "#7f1d1d", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {phase === "setup" && (
          <>
            {/* أنواع الاختبارات */}
            <p className="qmem-section-title">اختر نوع الاختبار</p>
            <div className="qmem-types">
              {ALL_TEST_TYPES.map((type, i) => (
                <button
                  key={type}
                  type="button"
                  className={`qmem-type-card${selectedType === type ? " qmem-type-card--active" : ""}`}
                  onClick={() => setSelectedType(type)}
                >
                  <span className="qmem-type-card__num">نوع {i + 1}</span>
                  <span className="qmem-type-card__name">{TEST_LABELS[type]}</span>
                  <span className="qmem-type-card__desc">{TEST_DESCRIPTIONS[type]}</span>
                </button>
              ))}
            </div>

            {/* اختيار السورة */}
            <p className="qmem-section-title">اختر السورة</p>
            <div className="qmem-surah-row">
              {surahList.length > 0 ? (
                <select
                  className="qmem-surah-select"
                  value={selectedSurah}
                  onChange={(e) => setSelectedSurah(Number(e.target.value))}
                  aria-label="اختر السورة"
                >
                  {surahList.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.name} ({s.numberOfAyahs} آية)
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>جارٍ تحميل السور...</div>
              )}
              <button
                type="button"
                className="qmem-start-btn"
                onClick={startSession}
                disabled={loading || surahList.length === 0}
              >
                {loading ? "جارٍ التحميل..." : "ابدأ الاختبار"}
                {!loading && <BookOpen size={15} />}
              </button>
            </div>

            {/* قائمة الآيات للمراجعة */}
            {dueCards.length > 0 && (
              <div className="qmem-review-section">
                <p className="qmem-section-title" style={{ marginBottom: "0.5rem" }}>
                  آيات مستحقة للمراجعة ({dueCards.length})
                </p>
                <div className="qmem-review-list">
                  {dueCards.slice(0, 5).map((card) => (
                    <div key={card.key} className="qmem-review-item">
                      <div>
                        <div className="qmem-review-item__text">{card.text}</div>
                        <div className="qmem-review-item__meta">
                          سورة {card.surahName} — آية {card.ayahNumber}
                        </div>
                      </div>
                      <span className="qmem-due-badge">للمراجعة</span>
                    </div>
                  ))}
                  {dueCards.length > 5 && (
                    <p style={{ fontSize: "0.78rem", color: "#6b7280", textAlign: "center" }}>
                      +{dueCards.length - 5} آيات أخرى مستحقة
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {phase === "quiz" && currentQ && (
          <div className="qmem-quiz">
            <div className="qmem-progress">
              <div className="qmem-progress__bar">
                <div
                  className="qmem-progress__fill"
                  style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                />
              </div>
              <span className="qmem-progress__text">
                {currentIdx + 1} / {questions.length}
              </span>
            </div>
            <QuestionCard
              key={currentQ.id}
              question={currentQ}
              onAnswer={handleAnswer}
            />
          </div>
        )}

        {phase === "end" && (
          <div className="qmem-end">
            <div className="qmem-end__icon">
              {score >= questions.length * 0.8 ? "🌟" : score >= questions.length * 0.5 ? "📚" : "📖"}
            </div>
            <h2 className="qmem-end__title">انتهت الجلسة!</h2>
            <p className="qmem-end__sub">
              {score >= questions.length * 0.8
                ? "أحسنت! أداء ممتاز في الحفظ"
                : score >= questions.length * 0.5
                ? "أداء جيد، استمر في المراجعة"
                : "المراجعة المستمرة هي مفتاح الحفظ — لا تيأس"}
            </p>
            <div className="qmem-end__score">
              {score} / {questions.length}
            </div>
            <div className="qmem-end__score-lbl">إجابات صحيحة</div>
            <div className="qmem-end__actions">
              <button type="button" className="qmem-start-btn" onClick={startSession}>
                <RotateCcw size={15} />
                جلسة جديدة
              </button>
              <button
                type="button"
                className="qmem-start-btn"
                style={{ background: "var(--ds-border,#e5e7eb)", color: "var(--ds-text-1,#1a1a1a)" }}
                onClick={resetSession}
              >
                <ChevronLeft size={15} />
                تغيير الإعدادات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
