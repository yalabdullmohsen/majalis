/**
 * HomeDashboard — continue reading, daily progress, recent bookmarks/reflections.
 */
import { useEffect, useState } from "react";
import { BookOpen, Bookmark, Flame, Mic2, Moon, Play, Sun } from "lucide-react";
import { useQuranEngine } from "@/hooks/useQuranEngine";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { getSurahMeta } from "@/lib/quran-api";
import { getFeaturedReciters, getReciter, RECITERS, saveReciterId } from "@/lib/quran-audio";
import { toArabicDigits } from "@/lib/utils";
import type { BookmarkRecord, ReadingProgress } from "@/core/quran/DatabaseManager";
import "@/styles/quran-engine-ui.css";

export type HomeDashboardProps = {
  onContinue?: (progress: ReadingProgress) => void;
  onOpenViewer?: (surah: number, ayah: number) => void;
};

export function HomeDashboard({ onContinue, onOpenViewer }: HomeDashboardProps) {
  const {
    currentSurah,
    currentAyah,
    currentPage,
    currentReciter,
    hydrating,
    db,
    loadLastReadingProgress,
    setActiveVerse,
    setReciter,
  } = useQuranEngine();
  const { resolvedTheme, toggleDark } = useThemePreference();

  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [pagesToday, setPagesToday] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAllReciters, setShowAllReciters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoadError(null);
        await loadLastReadingProgress();
        const [p, b] = await Promise.all([db.getReadingProgress(), db.listBookmarks()]);
        if (cancelled) return;
        setProgress(p);
        setBookmarks(b.slice(0, 3));
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const startMs = start.getTime();
        const todayMarks = b.filter((x) => x.createdAt >= startMs).length;
        const touchedToday = p && p.updatedAt >= startMs ? 1 : 0;
        setPagesToday(Math.max(touchedToday, todayMarks > 0 ? 1 : 0) + Math.min(4, todayMarks));
      } catch (err) {
        if (!cancelled) {
          console.warn("[HomeDashboard] load:", err);
          setLoadError("تعذّر تحميل بيانات القراءة المحلية. يمكنك المتابعة من موضع افتراضي.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, loadLastReadingProgress]);

  const surah = progress?.lastSurah ?? currentSurah;
  const ayah = progress?.lastAyah ?? currentAyah;
  const page = progress?.lastPage ?? currentPage;
  const surahName = getSurahMeta(surah).name;
  const target = 5;
  const pct = Math.min(100, Math.round((pagesToday / target) * 100));
  const isDark = resolvedTheme === "dark";
  const activeReciter = getReciter(currentReciter);
  const listedReciters = showAllReciters ? RECITERS : getFeaturedReciters();

  const continueReading = () => {
    setActiveVerse({ surah, ayah, page }, { persist: true });
    if (progress) onContinue?.(progress);
    onOpenViewer?.(surah, ayah);
  };

  const pickReciter = (id: string) => {
    setReciter(id);
    saveReciterId(id);
  };

  return (
    <div className="qe-dash" dir="rtl">
      <header className="qe-dash__hero">
        <div className="qe-dash__hero-copy">
          <p className="qe-dash__eyebrow">محرك القرآن</p>
          <h1>لوحة القراءة</h1>
          <p>{hydrating ? "جاري استعادة موضعك…" : "تابع من حيث توقفت."}</p>
        </div>
        <button
          type="button"
          className="qe-dash__theme"
          onClick={toggleDark}
          aria-pressed={isDark}
          aria-label={isDark ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي"}
        >
          {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          <span>{isDark ? "نهاري" : "ليلي"}</span>
        </button>
      </header>

      {loadError ? (
        <p className="qe-dash__load-err" role="alert">
          {loadError}
        </p>
      ) : null}

      <section className="qe-dash__card">
        <header>
          <h2>متابعة القراءة</h2>
          <p>آخر موضع محفوظ</p>
        </header>
        <div className="qe-dash__continue">
          <span className="qe-dash__icon" aria-hidden="true">
            <BookOpen size={22} />
          </span>
          <div>
            <strong>سورة {surahName}</strong>
            <span>
              الآية {toArabicDigits(ayah)} · الصفحة {toArabicDigits(page)}
            </span>
          </div>
        </div>
        <button type="button" className="qe-dash__cta" onClick={continueReading}>
          <Play size={16} aria-hidden="true" />
          متابعة القراءة
        </button>
      </section>

      <section className="qe-dash__card">
        <header>
          <h2 className="qe-dash__h2-with-icon">
            <Mic2 size={16} aria-hidden="true" />
            أشهر القراء
          </h2>
          <p>القارئ الحالي: {activeReciter.nameAr}</p>
        </header>
        <div className="qe-reciter-grid" role="listbox" aria-label="أشهر القراء">
          {listedReciters.map((r) => (
            <button
              key={r.id}
              type="button"
              role="option"
              aria-selected={r.id === activeReciter.id}
              className={`qe-reciter-chip${r.id === activeReciter.id ? " is-on" : ""}`}
              onClick={() => pickReciter(r.id)}
            >
              {r.nameAr}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="qe-dash__more-reciters"
          onClick={() => setShowAllReciters((v) => !v)}
        >
          {showAllReciters
            ? "عرض أشهر القراء فقط"
            : `عرض جميع القراء (${toArabicDigits(RECITERS.length)})`}
        </button>
      </section>

      <section className="qe-dash__card">
        <header>
          <h2>التقدّم اليومي</h2>
          <p>
            {toArabicDigits(pagesToday)} / {toArabicDigits(target)} نشاط اليوم
          </p>
        </header>
        <div className="qe-dash__progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="qe-dash__hint">
          <Flame size={14} aria-hidden="true" />{" "}
          {pct >= 100 ? "أحسنت — هدف اليوم مكتمل." : `متبقٍ ${toArabicDigits(Math.max(0, target - pagesToday))} للوصول للهدف.`}
        </p>
      </section>

      <section className="qe-dash__card">
        <header>
          <h2>أحدث الإشارات</h2>
          <p>من مذكراتك المحلية</p>
        </header>
        {bookmarks.length === 0 ? (
          <p className="qe-dash__empty">لا إشارات بعد — أضف واحدة من شريط الآية.</p>
        ) : (
          <ul className="qe-dash__notes">
            {bookmarks.map((b) => (
              <li key={b.verseKey}>
                <button
                  type="button"
                  className="qe-dash__note"
                  onClick={() => onOpenViewer?.(b.surahId, b.ayahId)}
                >
                  <Bookmark size={14} aria-hidden="true" />
                  <span>
                    {getSurahMeta(b.surahId).name} · {toArabicDigits(b.ayahId)}
                  </span>
                  <em>{(b.note || "إشارة بلا ملاحظة").slice(0, 80)}</em>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default HomeDashboard;
