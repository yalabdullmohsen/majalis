"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuranReader } from "@/hooks/useQuranReader";
import { useAyahPlayer } from "@/hooks/useAyahPlayer";
import { fetchTafsirAyahs, type TafsirAyah } from "@/lib/quran-api";
import { SurahList } from "@/components/quran/SurahList";
import { AyahDisplay } from "@/components/quran/AyahDisplay";
import { QuranPlayerBar } from "@/components/quran/QuranPlayerBar";
import { QuranSearch } from "@/components/quran/QuranSearch";
import "@/styles/quran.css";

const TAFSIR_SOURCES = [
  { id: "ar.muyassar", label: "الميسّر" },
  { id: "ar.jalalayn", label: "الجلالين" },
  { id: "ar.waseet", label: "الوسيط" },
] as const;
type TafsirId = (typeof TAFSIR_SOURCES)[number]["id"];

const TAFSIR_KEY = "mj-quran-tafsir-v3";
function loadTafsirId(): TafsirId {
  try {
    const v = localStorage.getItem(TAFSIR_KEY) as TafsirId;
    return TAFSIR_SOURCES.some((t) => t.id === v) ? v : "ar.muyassar";
  } catch { return "ar.muyassar"; }
}

export default function QuranPage() {
  const reader = useQuranReader();
  const { detail, loading, error, surahNum, targetAyah, summary } = reader;
  const totalAyahs = detail?.numberOfAyahs ?? 0;
  const player = useAyahPlayer(surahNum, totalAyahs);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [fontScale, setFontScale] = useState(26);
  const [showAyahNumbers, setShowAyahNumbers] = useState(true);
  const [tafsirId, setTafsirId] = useState<TafsirId>(loadTafsirId);
  const [tafsirAyahs, setTafsirAyahs] = useState<TafsirAyah[]>([]);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);

  const changeTafsirId = useCallback((id: TafsirId) => {
    setTafsirId(id);
    try { localStorage.setItem(TAFSIR_KEY, id); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!showTafsir) return;
    setTafsirLoading(true);
    fetchTafsirAyahs(surahNum, tafsirId)
      .then(setTafsirAyahs)
      .catch(() => setTafsirAyahs([]))
      .finally(() => setTafsirLoading(false));
  }, [surahNum, tafsirId, showTafsir]);

  const tafsirMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of tafsirAyahs) m.set(t.numberInSurah, t.text);
    return m;
  }, [tafsirAyahs]);

  const handleFontScale = useCallback((delta: number) => {
    setFontScale((v) => Math.min(42, Math.max(18, v + delta)));
  }, []);

  const handleGoToResult = useCallback((surah: number, ayah: number) => {
    reader.goToSurah(surah, ayah);
    setShowSearch(false);
  }, [reader]);

  return (
    <div className="quran-shell">
      {/* Sub-navigation */}
      <nav className="qs-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="qs-subnav__link is-active">المصحف</Link>
        <Link href="/quran-radio" className="qs-subnav__link">الإذاعة والبث</Link>
      </nav>

      <div className="qs-layout">
        {/* ── Sidebar overlay (mobile) ── */}
        <div
          className={`qs-sidebar-backdrop${sidebarOpen ? " is-open" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* ── Sidebar ── */}
        <aside className={`qs-sidebar${sidebarOpen ? " is-open" : ""}`}>
          <SurahList
            surahs={reader.surahList}
            currentSurah={surahNum}
            onSelect={(n) => reader.goToSurah(n)}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        {/* ── Main content ── */}
        <main className="qs-main">
          {/* Mobile sidebar toggle + search */}
          <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <button type="button" className="qs-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
              ☰ السور
            </button>
            <button
              type="button"
              className="qs-pb-btn"
              onClick={() => setShowSearch((v) => !v)}
            >
              {showSearch ? "✕ أغلق البحث" : "🔍 بحث في القرآن"}
            </button>
            <button
              type="button"
              className="qs-pb-btn"
              onClick={() => setShowTafsir((v) => !v)}
            >
              {showTafsir ? "✕ أخفِ التفسير" : "📖 عرض التفسير"}
            </button>
          </div>

          {/* Last position resume */}
          {reader.lastPos && reader.lastPos.surah !== surahNum && (
            <div style={{
              padding: ".6rem 1rem",
              background: "#f0f7f4",
              borderRadius: ".5rem",
              marginBottom: "1rem",
              direction: "rtl",
              fontSize: ".88rem",
            }}>
              <strong>استئناف القراءة:</strong>{" "}
              توقفت عند سورة {reader.surahList.find((s) => s.number === reader.lastPos!.surah)?.name ?? reader.lastPos.surah}
              {" "}آية {reader.lastPos.ayah}
              {" "}&mdash;{" "}
              <button
                type="button"
                className="qs-pb-btn qs-pb-btn--primary"
                style={{ padding: ".2rem .5rem", fontSize: ".82rem" }}
                onClick={() => reader.goToSurah(reader.lastPos!.surah, reader.lastPos!.ayah)}
              >
                اذهب إليها
              </button>
            </div>
          )}

          {/* Search panel */}
          {showSearch && <QuranSearch onGoToResult={handleGoToResult} />}

          {/* Tafsir source picker */}
          {showTafsir && (
            <div className="qs-tafsir" aria-label="التفسير">
              <div className="qs-tafsir__head">
                <span className="qs-tafsir__title">التفسير</span>
                <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
                  {TAFSIR_SOURCES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`qs-tafsir__source-btn${tafsirId === t.id ? " is-active" : ""}`}
                      onClick={() => changeTafsirId(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {tafsirLoading && <p className="qs-loading">جاري تحميل التفسير…</p>}
              {!tafsirLoading && tafsirAyahs.length > 0 && (
                <div>
                  {tafsirAyahs.slice(0, 10).map((t) => (
                    <div key={t.numberInSurah} className="qs-tafsir__ayah">
                      <p className="qs-tafsir__ayah-ref">آية {t.numberInSurah}</p>
                      <p className="qs-tafsir__ayah-text">{t.text}</p>
                    </div>
                  ))}
                  {tafsirAyahs.length > 10 && (
                    <p style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>
                      يُعرض أول 10 آيات. استخدم كتب التفسير المعتمدة للرجوع الكامل.
                    </p>
                  )}
                </div>
              )}
              <p className="qs-source-note">
                المصدر: AlQuran Cloud API — alquran.cloud · {TAFSIR_SOURCES.find((t) => t.id === tafsirId)?.label}
              </p>
            </div>
          )}

          {/* Loading / error / content */}
          {loading && (
            <div className="qs-loading" aria-live="polite">
              جاري تحميل السورة من AlQuran Cloud…
            </div>
          )}

          {!loading && error && (
            <div className="qs-error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="qs-pb-btn qs-pb-btn--primary"
                style={{ marginTop: ".5rem" }}
                onClick={() => reader.goToSurah(surahNum)}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loading && !error && detail && (
            <>
              <AyahDisplay
                ayahs={detail.ayahs}
                surahNum={surahNum}
                surahName={detail.name}
                targetAyah={targetAyah}
                currentPlayingAyah={player.currentAyah}
                playerState={player.playerState}
                fontScale={fontScale}
                showAyahNumbers={showAyahNumbers}
                onPlayAyah={player.togglePlayAyah}
                onAyahClick={reader.goToAyah}
              />
              <p className="qs-source-note">
                المصدر: AlQuran Cloud API · طبعة عثمان طه (رواية حفص عن عاصم) ·
                التلاوة: everyayah.com
              </p>
            </>
          )}
        </main>
      </div>

      {/* ── Sticky player bar ── */}
      {summary && (
        <QuranPlayerBar
          surahName={summary.name}
          surahNum={surahNum}
          totalAyahs={totalAyahs}
          currentAyah={player.currentAyah}
          playerState={player.playerState}
          reciterId={player.reciterId}
          fontScale={fontScale}
          showAyahNumbers={showAyahNumbers}
          prevSurah={reader.prevSurah}
          nextSurah={reader.nextSurah}
          onReciterChange={player.setReciterId}
          onFontScale={handleFontScale}
          onToggleAyahNumbers={() => setShowAyahNumbers((v) => !v)}
          onPrevSurah={() => reader.prevSurah && reader.goToSurah(reader.prevSurah)}
          onNextSurah={() => reader.nextSurah && reader.goToSurah(reader.nextSurah)}
          onStop={player.stop}
          onPlayFromAyah={player.playFromAyah}
          onPause={player.pause}
          onResume={player.resume}
        />
      )}
    </div>
  );
}
