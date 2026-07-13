import { useCallback, useEffect, useRef, useState } from "react";
import { Coffee, Pause, Target } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ShareButtons } from "@/components/ContentActions";
import { PageHeader } from "@/components/ui-common";
import {
  logStudySession,
  getDailyStudyStats,
  getRecentSessions,
  type DailyStudyStats,
  type StudySession,
} from "@/lib/study-session-service";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

// ─── Pomodoro config ──────────────────────────────────────────────────────────

const PRESETS = [
  { label: "٢٥ / ٥", work: 25, rest: 5 },
  { label: "٤٥ / ١٠", work: 45, rest: 10 },
  { label: "٦٠ / ١٥", work: 60, rest: 15 },
];

type Phase = "idle" | "work" | "rest";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

// Simple beep using Web Audio API
function beep(type: "start" | "end") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = type === "end" ? 660 : 440;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch { /* AudioContext may be blocked */ }
}

// ─── Stats display ─────────────────────────────────────────────────────────────

function StatsPanel({ stats }: { stats: DailyStudyStats }) {
  return (
    <div className="sr-stats">
      <div className="sr-stats__item">
        <strong>{stats.totalMinutesToday}</strong>
        <span>دقيقة اليوم</span>
      </div>
      <div className="sr-stats__item">
        <strong>{stats.sessionsToday}</strong>
        <span>جلسة اليوم</span>
      </div>
      <div className="sr-stats__item">
        <strong>{stats.totalMinutesWeek}</strong>
        <span>دقيقة هذا الأسبوع</span>
      </div>
      <div className="sr-stats__item">
        <strong>{stats.longestSession}</strong>
        <span>أطول جلسة (د)</span>
      </div>
    </div>
  );
}

// ─── History ──────────────────────────────────────────────────────────────────

function SessionHistory({ sessions }: { sessions: StudySession[] }) {
  if (sessions.length === 0) return null;
  return (
    <section className="sr-history">
      <h3 className="sr-history__title">آخر الجلسات</h3>
      <ul className="sr-history__list">
        {sessions.map((s) => (
          <li key={s.id} className="sr-history__item">
            <span className="sr-history__dur">{s.duration_minutes} د</span>
            <span className="sr-history__goal">{s.goal ?? "جلسة دراسة"}</span>
            <span className="sr-history__date">{s.session_date}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudyRoomPage() {
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    applyPageSeo({
      path: "/study-room",
      title: "غرفة المذاكرة | المجلس العلمي",
      description: "غرفة المذاكرة الإسلامية، مؤقت بومودورو للمذاكرة وتسجيل جلسات الدراسة الشرعية.",
      keywords: ["غرفة مذاكرة", "مذاكرة إسلامية", "بومودورو إسلامي", "جلسة دراسة", "تعلم شرعي"],
      robots: "index, follow",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "غرفة الدراسة — المجلس العلمي",
          url: "https://majlisilm.com/study-room",
          description: "بيئة مذاكرة مركّزة مع مؤقت Pomodoro وتتبع جلسات الدراسة الشرعية",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          inLanguage: "ar",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
        },
      ],
    });
  }, []);

  // Preset
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = PRESETS[presetIdx];

  // Goal
  const [goal, setGoal] = useState("");

  // Timer
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(preset.work * 60);
  const [elapsed, setElapsed] = useState(0); // seconds worked in current work phase
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stats
  const [stats, setStats] = useState<DailyStudyStats | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!user?.id) return;
    setLoadingData(true);
    const [s, h] = await Promise.all([
      getDailyStudyStats(user.id),
      getRecentSessions(user.id, 8),
    ]).catch(() => [null, []]) as [DailyStudyStats | null, StudySession[]];
    setStats(s);
    setSessions(h);
    setLoadingData(false);
  }, [user?.id]);

  useEffect(() => {
    if (isLoggedIn) refreshStats();
  }, [isLoggedIn, refreshStats]);

  // Reset timer when preset changes (only when idle)
  useEffect(() => {
    if (phase === "idle") setSecondsLeft(preset.work * 60);
  }, [preset, phase]);

  // Tick
  useEffect(() => {
    if (phase === "idle") return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
      if (phase === "work") setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [phase]);

  // Handle phase end
  useEffect(() => {
    if (secondsLeft > 0) return;
    beep("end");
    if (phase === "work") {
      // Log session
      const minutesWorked = Math.round(elapsed / 60);
      if (isLoggedIn && user?.id && minutesWorked >= 1) {
        logStudySession(user.id, minutesWorked, goal || undefined)
          .then(refreshStats)
          .catch(() => {});
      }
      setPhase("rest");
      setSecondsLeft(preset.rest * 60);
      setElapsed(0);
    } else if (phase === "rest") {
      setPhase("idle");
      setSecondsLeft(preset.work * 60);
    }
  }, [secondsLeft, phase, elapsed, isLoggedIn, user?.id, goal, preset.rest, preset.work, refreshStats]);

  const startWork = () => {
    beep("start");
    setPhase("work");
    setSecondsLeft(preset.work * 60);
    setElapsed(0);
  };

  const pause = () => {
    clearInterval(intervalRef.current!);
    setPhase("idle");
  };

  const reset = () => {
    clearInterval(intervalRef.current!);
    setPhase("idle");
    setSecondsLeft(preset.work * 60);
    setElapsed(0);
  };

  const pct = phase === "idle"
    ? 0
    : phase === "work"
    ? Math.round(((preset.work * 60 - secondsLeft) / (preset.work * 60)) * 100)
    : Math.round(((preset.rest * 60 - secondsLeft) / (preset.rest * 60)) * 100);

  return (
    <div className="page-shell narrow sr-page" dir="rtl">
      <PageHeader
        eyebrow="التعلّم الذكي"
        title="⏱ غرفة الدراسة"
        subtitle="جلسات Pomodoro مع تتبع وقت الدراسة الفعلي."
      />

      {/* Preset selector */}
      <div className="sr-presets" role="tablist" aria-label="إعدادات مسبقة للجلسة">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            role="tab"
            type="button"
            className={`sr-preset${presetIdx === i ? " sr-preset--active" : ""}`}
            onClick={() => { setPresetIdx(i); reset(); }}
            aria-selected={presetIdx === i}
            disabled={phase !== "idle"}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Goal input */}
      <input
        type="text"
        className="sr-goal-input"
        placeholder="ما هدفك لهذه الجلسة؟ (اختياري)"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        disabled={phase !== "idle"}
        maxLength={120}
      />

      {/* Timer display */}
      <div className={`sr-timer${phase === "rest" ? " sr-timer--rest" : phase === "work" ? " sr-timer--work" : ""}`}>
        <svg className="sr-timer__ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" className="sr-timer__ring-bg" />
          <circle
            cx="60" cy="60" r="54"
            className="sr-timer__ring-fill"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
          />
        </svg>
        <div className="sr-timer__content">
          <span className="sr-timer__phase">
            {phase === "work" ? <><Target size={14} strokeWidth={2} aria-hidden="true" /> تركيز</> : phase === "rest" ? <><Coffee size={14} strokeWidth={2} aria-hidden="true" /> راحة</> : <><Pause size={14} strokeWidth={2} aria-hidden="true" /> جاهز</>}
          </span>
          <span className="sr-timer__time">{formatTime(secondsLeft)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="sr-controls">
        {phase === "idle" ? (
          <button type="button" className="sr-btn sr-btn--start" onClick={startWork}>
            ▶ ابدأ الجلسة
          </button>
        ) : (
          <>
            <button type="button" className="sr-btn sr-btn--pause" onClick={pause}>
              <Pause size={14} strokeWidth={2} aria-hidden="true" /> إيقاف
            </button>
            <button type="button" className="sr-btn sr-btn--reset" onClick={reset}>
              ↺ إعادة
            </button>
          </>
        )}
      </div>

      {/* Stats */}
      {isLoggedIn ? (
        loadingData ? (
          <div className="profile-loading stp-loading-center">
            <span className="profile-loading__dot" /><span className="profile-loading__dot" /><span className="profile-loading__dot" />
          </div>
        ) : (
          <>
            {stats && <StatsPanel stats={stats} />}
            <SessionHistory sessions={sessions} />
          </>
        )
      ) : (
        <div className="sr-login-hint">
          <Link href="/login?next=/study-room">سجّل الدخول</Link> لحفظ جلسات دراستك وعرض إحصاءاتك.
        </div>
      )}

      <div className="twh-share">
        <ShareButtons title="غرفة الدراسة — المجلس العلمي" url="https://majlisilm.com/study-room" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["quran", "hadith"]} title="اختبر معلوماتك أثناء الدراسة" count={4} />
      </div>
    </div>
  );
}
