import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Menu, Pause, Play, Copy, Check, Mic } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { fetchSurahDetail, getSurahList, type SurahDetail, type SurahSummary } from "@/lib/quran-api";
import { SurahList } from "@/components/quran/SurahList";
import { ExploreAyahPanel } from "@/components/quran/ExploreAyahPanel";
import { useAyahPlayer } from "@/hooks/useAyahPlayer";
import { copyAyahText } from "@/lib/share-ayah";
import "@/styles/quran.css";

export default function MushafPage() {
  const params = useParams<{ surah?: string }>();
  const [, navigate] = useLocation();
  const surahNum = Math.min(114, Math.max(1, Number(params.surah) || 1));

  const [detail, setDetail] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exploreAyah, setExploreAyah] = useState<{ num: number; text: string } | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);

  const surahs = useMemo<SurahSummary[]>(
    () => getSurahList().map((s) => ({
      number: s.number,
      name: s.name,
      englishName: "",
      englishNameTranslation: "",
      numberOfAyahs: s.ayahs,
      revelationType: s.revelation === "مدنية" ? "Medinan" : "Meccan",
    })),
    [],
  );
  const surahMeta = surahs.find((s) => s.number === surahNum);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchSurahDetail(surahNum)
      .then(setDetail)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [surahNum]);

  useEffect(() => {
    applyPageSeo({
      path: `/mushaf${surahNum > 1 ? `/${surahNum}` : ""}`,
      title: `${surahMeta ? `سورة ${surahMeta.name}` : "المصحف الشريف"} | المجلس العلمي`,
      description: surahMeta
        ? `اقرأ سورة ${surahMeta.name} كاملة (${surahMeta.numberOfAyahs} آية) برواية حفص عن عاصم، مع الاستماع والمشاركة.`
        : "المصحف الشريف كاملاً — اقرأ القرآن الكريم سورة سورة بخط عثماني واضح، مع الاستماع لكل آية ومشاركتها.",
      keywords: ["المصحف", "القرآن الكريم", "قراءة القرآن", surahMeta?.name ?? ""].filter(Boolean),
    });
  }, [surahNum, surahMeta]);

  const totalAyahs = detail?.ayahs.length ?? surahMeta?.numberOfAyahs ?? 0;
  const { currentAyah, playerState, togglePlayAyah } = useAyahPlayer(surahNum, totalAyahs);

  const handleSelectSurah = (n: number) => {
    navigate(n === 1 ? "/mushaf" : `/mushaf/${n}`);
    setSidebarOpen(false);
  };

  const handleCopy = async (ayahNum: number, text: string) => {
    const ok = await copyAyahText(text, surahMeta?.name ?? "", ayahNum);
    if (ok) {
      setCopiedAyah(ayahNum);
      setTimeout(() => setCopiedAyah((v) => (v === ayahNum ? null : v)), 1800);
    }
  };

  const isFirstAyahBasmala = surahNum !== 1 && surahNum !== 9;

  return (
    <div className="quran-shell" dir="rtl">
      <PageHeader
        eyebrow="القرآن الكريم"
        title="المصحف الشريف"
        subtitle="اقرأ القرآن الكريم كاملاً، سورة سورة، مع الاستماع لكل آية."
      />

      <div className="qs-layout">
        <button
          type="button"
          className="qs-mobile-sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="فهرس السور"
        >
          <Menu size={16} aria-hidden="true" />
          فهرس السور
        </button>

        <aside className={`qs-sidebar${sidebarOpen ? " is-open" : ""}`}>
          <SurahList
            surahs={surahs}
            currentSurah={surahNum}
            onSelect={handleSelectSurah}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        <main className="qs-main">
          {loading ? (
            <p className="ds-empty">جاري التحميل...</p>
          ) : error || !detail ? (
            <p className="ds-empty">تعذّر تحميل السورة. تحقّق من اتصالك وحاول مجددًا.</p>
          ) : (
            <>
              <header className="qs-surah-header">
                <div className="qs-surah-header__ornament" aria-hidden="true">﴾ ﴿</div>
                <h1 className="qs-surah-header__title">{surahMeta ? `سورة ${surahMeta.name}` : detail.name}</h1>
                <p className="qs-surah-meta">
                  {detail.numberOfAyahs} آية · {detail.revelationType === "Meccan" ? "مكية" : "مدنية"}
                </p>
                {isFirstAyahBasmala && (
                  <p className="qs-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                )}
                <button
                  type="button"
                  className="qs-recitation-cta"
                  onClick={() => navigate(`/quran/recitation-test-ai?surah=${surahNum}`)}
                >
                  <Mic size={16} aria-hidden="true" />
                  سمّع هذه السورة
                  <span className="qs-recitation-cta__badge">نسخة تجريبية</span>
                </button>
              </header>

              <div className="qs-ayah-display">
                <p className="qs-mushaf-body">
                  {detail.ayahs.map((a) => {
                    const isPlaying = currentAyah === a.numberInSurah && playerState === "playing";
                    const isTarget = currentAyah === a.numberInSurah;
                    return (
                      <span
                        key={a.number}
                        className={`qs-ayah-inline${isPlaying ? " qs-ayah-inline--playing" : ""}${isTarget ? " qs-ayah-inline--target" : ""}`}
                      >
                        <span
                          className="qs-ayah-inline__text"
                          onClick={() => setExploreAyah({ num: a.numberInSurah, text: a.text })}
                        >
                          {a.text}
                        </span>
                        <span className="qs-ayah-inline__num" aria-hidden="true">﴾{a.numberInSurah}﴿</span>
                        <button
                          type="button"
                          className={`qs-ayah-inline__play${isPlaying ? " is-playing" : ""}`}
                          onClick={() => togglePlayAyah(a.numberInSurah)}
                          aria-label={isPlaying ? `إيقاف تلاوة الآية ${a.numberInSurah}` : `استماع الآية ${a.numberInSurah}`}
                        >
                          {isPlaying ? <Pause size={9} /> : <Play size={9} />}
                        </button>
                        <button
                          type="button"
                          className="qs-ayah-inline__share"
                          onClick={() => handleCopy(a.numberInSurah, a.text)}
                          aria-label={`نسخ الآية ${a.numberInSurah}`}
                        >
                          {copiedAyah === a.numberInSurah ? <Check size={9} /> : <Copy size={9} />}
                        </button>
                      </span>
                    );
                  })}
                </p>
              </div>

              <nav className="qs-surah-nav" aria-label="التنقل بين السور">
                {surahNum > 1 && (
                  <button type="button" onClick={() => handleSelectSurah(surahNum - 1)} className="page-link-inline">
                    السورة السابقة →
                  </button>
                )}
                {surahNum < 114 && (
                  <button type="button" onClick={() => handleSelectSurah(surahNum + 1)} className="page-link-inline">
                    ← السورة التالية
                  </button>
                )}
              </nav>
            </>
          )}
        </main>
      </div>

      {exploreAyah && (
        <ExploreAyahPanel
          surahNum={surahNum}
          ayahNum={exploreAyah.num}
          surahName={surahMeta?.name ?? ""}
          ayahText={exploreAyah.text}
          onClose={() => setExploreAyah(null)}
        />
      )}
    </div>
  );
}
