/**
 * HomeDashboard — Quran reading entry surface.
 *
 * Cards: daily wird ring · active khatmah · recent reflections · stats strip
 * FAB: Quick Start → last read page in QuranViewer
 * Data: QuranEngineContext + DatabaseManager (lazy fetch on mount)
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen,
  Feather,
  Flame,
  Clock,
  Layers,
  Play,
  ArrowLeft,
} from "lucide-react";
import {
  ACTIVE_READING_KHATMAH_ID,
  useQuranEngineCore,
  type DashboardStats,
  type ReflectionsStore,
} from "@/core/quran";
import { getSurahMeta, SURAH_START_PAGES } from "@/lib/quran-api";
import { toArabicDigits } from "@/lib/utils";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/home-dashboard.css";

function formatDuration(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${toArabicDigits(h)} س ${toArabicDigits(m)} د`;
  if (m > 0) return `${toArabicDigits(m)} د`;
  return `${toArabicDigits(totalSec)} ث`;
}

function snippet(text: string, max = 96): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function CircularWirdRing({
  value,
  target,
}: {
  value: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const size = 148;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="hd-ring" role="img" aria-label={`الورد: ${value} من ${target}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="hd-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <motion.circle
          className="hd-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="hd-ring__label">
        <strong>
          {toArabicDigits(value)}
          <span>/{toArabicDigits(target)}</span>
        </strong>
        <em>صفحة اليوم</em>
      </div>
    </div>
  );
}

export function HomeDashboard() {
  const [, setLocation] = useLocation();
  const { state, activePage, hydrating, db, loadLastReadingProgress } =
    useQuranEngineCore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reflections, setReflections] = useState<ReflectionsStore[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const fetchedRef = useRef(false);
  const sessionStarted = useRef<number | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/",
      title: "مجالس العلم | لوحة القراءة",
      description:
        "وردك اليومي، ختمتك الجارية، وآخر تأملاتك في منصة مجالس العلم — ابدأ من حيث توقفت في المصحف.",
      keywords: ["مجالس العلم", "قراءة القرآن", "ورد يومي", "ختمة", "تأملات"],
    });
  }, []);

  // Lazy DB prefetch — only when this landing mounts
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    setStatsLoading(true);
    sessionStarted.current = Date.now();

    void (async () => {
      try {
        await loadLastReadingProgress();
        const [dash, notes] = await Promise.all([
          db.getDashboardStats(ACTIVE_READING_KHATMAH_ID),
          db.listRecentReflections(3),
        ]);
        if (!cancelled) {
          setStats(dash);
          setReflections(notes);
        }
      } catch {
        if (!cancelled) {
          setStats(null);
          setReflections([]);
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      // Persist dwell time on dashboard (soft reading presence)
      const started = sessionStarted.current;
      if (started != null) {
        const delta = Date.now() - started;
        if (delta > 2_000) {
          void db.addDailyReadingTimeMs(Math.min(delta, 120_000)).catch(() => undefined);
        }
      }
    };
  }, [db, loadLastReadingProgress]);

  const surah = stats?.active_khatmah?.current_surah ?? state.surah ?? 1;
  const ayah = stats?.active_khatmah?.current_ayah ?? state.ayah ?? 1;
  const page = stats?.active_khatmah?.current_page ?? activePage ?? state.page ?? 1;
  const surahName = useMemo(() => getSurahMeta(surah).name, [surah]);

  const pagesToday = stats?.pages_read_today ?? 0;
  const target = stats?.daily_wird_target ?? 1;
  const streak = stats?.streak_days ?? 0;
  const timeMs = stats?.total_time_ms ?? 0;

  const continueHref = `/quran-viewer/page/${page}`;

  const openLastRead = () => {
    setLocation(continueHref);
  };

  return (
    <motion.div
      className="hd"
      dir="rtl"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="hd-hero">
        <p className="hd-hero__eyebrow">مجالس العلم · المصحف</p>
        <h1 className="hd-hero__title">لوحة القراءة</h1>
        <p className="hd-hero__sub">
          وردك، ختمتك، وتأملاتك — في مكان واحد هادئ.
        </p>
      </header>

      <section className="hd-stats" aria-label="إحصاءات اليوم">
        <div className="hd-stat">
          <Flame size={18} aria-hidden="true" />
          <div>
            <strong>{statsLoading ? "…" : toArabicDigits(streak)}</strong>
            <span>أيام متتالية</span>
          </div>
        </div>
        <div className="hd-stat">
          <Layers size={18} aria-hidden="true" />
          <div>
            <strong>{statsLoading ? "…" : toArabicDigits(pagesToday)}</strong>
            <span>صفحات اليوم</span>
          </div>
        </div>
        <div className="hd-stat">
          <Clock size={18} aria-hidden="true" />
          <div>
            <strong>{statsLoading ? "…" : formatDuration(timeMs)}</strong>
            <span>وقت القراءة</span>
          </div>
        </div>
      </section>

      <div className="hd-grid">
        <article className="hd-card hd-card--wird">
          <header className="hd-card__head">
            <h2>الورد اليومي</h2>
            <p>تقدمك مقابل هدف الختمة</p>
          </header>
          <div className="hd-card__body hd-card__body--center">
            {hydrating || statsLoading ? (
              <div className="hd-skel hd-skel--ring" aria-label="تحميل الورد" />
            ) : (
              <CircularWirdRing value={pagesToday} target={target} />
            )}
            <p className="hd-card__hint">
              {pagesToday >= target
                ? "أحسنت — أتممت ورد اليوم."
                : `متبقٍ ${toArabicDigits(Math.max(0, target - pagesToday))} صفحة لإكمال الهدف.`}
            </p>
          </div>
        </article>

        <article className="hd-card hd-card--khatmah">
          <header className="hd-card__head">
            <h2>الختمة الجارية</h2>
            <p>{stats?.active_khatmah?.title ?? "قراءة متواصلة"}</p>
          </header>
          <div className="hd-card__body">
            <div className="hd-khatmah">
              <span className="hd-khatmah__icon" aria-hidden="true">
                <BookOpen size={22} />
              </span>
              <div className="hd-khatmah__text">
                <strong>سورة {surahName}</strong>
                <span>
                  الآية {toArabicDigits(ayah)} · الصفحة {toArabicDigits(page)}
                </span>
              </div>
            </div>
            <Link href={continueHref} className="hd-btn hd-btn--primary">
              متابعة القراءة
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
          </div>
        </article>

        <article className="hd-card hd-card--reflections">
          <header className="hd-card__head">
            <div>
              <h2>آخر التأملات</h2>
              <p>من مذكراتك المحلية</p>
            </div>
            <Link href="/mushaf/reflections" className="hd-card__more">
              الكل
            </Link>
          </header>
          <div className="hd-card__body">
            {statsLoading ? (
              <div className="hd-skel hd-skel--list" aria-label="تحميل التأملات" />
            ) : reflections.length === 0 ? (
              <div className="hd-empty">
                <Feather size={22} aria-hidden="true" />
                <p>لا توجد تأملات بعد. أضف ملاحظة من صفحة المصحف.</p>
                <Link href="/quran-viewer" className="hd-btn hd-btn--ghost">
                  افتح المصحف
                </Link>
              </div>
            ) : (
              <ul className="hd-notes">
                {reflections.map((note) => {
                  const name = getSurahMeta(note.surah_id).name;
                  const notePage =
                    SURAH_START_PAGES[Math.max(0, note.surah_id - 1)] ?? 1;
                  return (
                    <li key={note.id}>
                      <Link
                        href={`/quran-viewer/page/${notePage}`}
                        className="hd-note"
                      >
                        <span className="hd-note__meta">
                          {name} · {toArabicDigits(note.ayah_id)}
                        </span>
                        <span className="hd-note__text">
                          {snippet(note.note_text || "تأمّل بلا نص")}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>
      </div>

      <footer className="hd-foot">
        <Link href="/platform" className="hd-foot__link">
          استكشف منصة مجالس العلم
        </Link>
      </footer>

      <button
        type="button"
        className="hd-fab"
        onClick={openLastRead}
        aria-label="بدء سريع — آخر صفحة قرأتها"
      >
        <Play size={22} aria-hidden="true" />
        <span>بدء سريع</span>
      </button>
    </motion.div>
  );
}

export default HomeDashboard;
