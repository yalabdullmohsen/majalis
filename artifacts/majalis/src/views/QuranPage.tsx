"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuranReader } from "@/hooks/useQuranReader";
import { useAyahPlayer } from "@/hooks/useAyahPlayer";
import {
  fetchTafsirAyahs,
  fetchJuz,
  fetchSurahDetailQiraat,
  getMushafPageUrl,
  QIRAAT_LIST,
  getQiraatPref,
  setQiraatPref,
  type TafsirAyah,
  type Ayah,
  type JuzData,
  type SurahDetail,
} from "@/lib/quran-api";
import { SurahList } from "@/components/quran/SurahList";
import { AyahDisplay } from "@/components/quran/AyahDisplay";
import { QuranPlayerBar } from "@/components/quran/QuranPlayerBar";
import { QuranSearch } from "@/components/quran/QuranSearch";
import "@/styles/quran.css";

// ─── Types ─────────────────────────────────────────────────────────────────

type ViewMode = "surah" | "page" | "verse" | "juz";

const VIEWS: { id: ViewMode; label: string; icon: string }[] = [
  { id: "surah", label: "سورة",  icon: "📜" },
  { id: "page",  label: "صفحة", icon: "📖" },
  { id: "verse", label: "آية",   icon: "✨" },
  { id: "juz",   label: "جزء",   icon: "📦" },
];

const TAFSIR_SOURCES = [
  { id: "ar.muyassar", label: "الميسّر" },
  { id: "ar.jalalayn", label: "الجلالين" },
  { id: "ar.waseet",   label: "الوسيط" },
] as const;
type TafsirId = (typeof TAFSIR_SOURCES)[number]["id"];

const VIEW_KEY   = "mj-quran-view-v1";
const TAFSIR_KEY = "mj-quran-tafsir-v3";
const PAGE_KEY   = "mj-quran-page-v1";
const JUZ_KEY    = "mj-quran-juz-v1";

function ls<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ─── Page View ─────────────────────────────────────────────────────────────

function PageView() {
  const [page, setPage] = useState(() => ls<number>(PAGE_KEY, 1));
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const url = getMushafPageUrl(page);

  const go = useCallback((delta: number) => {
    setPage((prev) => {
      const next = Math.max(1, Math.min(604, prev + delta));
      lsSet(PAGE_KEY, next);
      return next;
    });
    setLoaded(false);
    setError(false);
  }, []);

  return (
    <div style={{ direction: "rtl", textAlign: "center" }}>
      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "0.875rem" }}>
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={page <= 1}
          style={navBtn(page <= 1)}
          aria-label="الصفحة السابقة"
        >
          ← السابقة
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <input
            type="number"
            min={1}
            max={604}
            value={page}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v >= 1 && v <= 604) { setPage(v); lsSet(PAGE_KEY, v); setLoaded(false); setError(false); }
            }}
            style={{ width: 60, textAlign: "center", border: "1px solid var(--ds-line-color)", borderRadius: "0.375rem", padding: "0.3rem 0.4rem", fontSize: "0.9rem", fontFamily: "inherit" }}
          />
          <span style={{ fontSize: "0.82rem", color: "var(--ds-ink-soft)" }}>/ 604</span>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={page >= 604}
          style={navBtn(page >= 604)}
          aria-label="الصفحة التالية"
        >
          التالية →
        </button>
      </div>

      {/* Page image */}
      <div style={{ position: "relative", maxWidth: 600, margin: "0 auto", borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", background: "#f8f4e8" }}>
        {!loaded && !error && (
          <div style={{ padding: "5rem 2rem", color: "var(--ds-ink-soft)", fontSize: "0.9rem" }}>
            جاري تحميل صفحة المصحف…
          </div>
        )}
        {error && (
          <div style={{ padding: "3rem 2rem", color: "#8B1A1A" }}>
            <p>تعذر تحميل الصورة.</p>
            <button type="button" onClick={() => setError(false)} style={{ ...primaryBtnS, marginTop: "0.5rem" }}>
              إعادة المحاولة
            </button>
          </div>
        )}
        <img
          key={url}
          src={url}
          alt={`صفحة ${page} من المصحف الشريف`}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          style={{ display: loaded && !error ? "block" : "none", width: "100%", height: "auto" }}
        />
      </div>

      <p style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "var(--ds-ink-soft)" }}>
        المصدر: Islamic Network CDN · طبعة حفص عن عاصم
      </p>
    </div>
  );
}

// ─── Verse View ────────────────────────────────────────────────────────────

function VerseView({
  ayahs,
  surahName,
  tafsirMap,
  tafsirId,
  tafsirLoading,
  onChangeTafsir,
}: {
  ayahs: Ayah[];
  surahName: string;
  tafsirMap: Map<number, string>;
  tafsirId: TafsirId;
  tafsirLoading: boolean;
  onChangeTafsir: (id: TafsirId) => void;
}) {
  const [ayahIdx, setAyahIdx] = useState(0);
  const total = ayahs.length;
  const ayah = ayahs[ayahIdx] ?? null;

  return (
    <div style={{ direction: "rtl", maxWidth: 640, margin: "0 auto" }}>
      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <button type="button" onClick={() => setAyahIdx((v) => Math.max(0, v - 1))} disabled={ayahIdx <= 0} style={navBtn(ayahIdx <= 0)}>
          ← السابقة
        </button>
        <span style={{ fontSize: "0.85rem", color: "var(--ds-ink-soft)" }}>
          {surahName} — آية {ayahIdx + 1} / {total}
        </span>
        <button type="button" onClick={() => setAyahIdx((v) => Math.min(total - 1, v + 1))} disabled={ayahIdx >= total - 1} style={navBtn(ayahIdx >= total - 1)}>
          التالية →
        </button>
      </div>

      {/* Ayah card */}
      <div style={{ background: "linear-gradient(135deg, #f8f4e8, #fff)", border: "2px solid var(--majalis-brass, #b8860b)", borderRadius: "1rem", padding: "2rem 1.5rem", textAlign: "center", boxShadow: "0 4px 20px rgba(184,134,11,0.1)" }}>
        {ayah && (
          <>
            <div style={{ fontSize: "0.75rem", color: "var(--majalis-brass)", fontWeight: 700, marginBottom: "1rem", letterSpacing: "0.05em" }}>
              ﴿ {surahName} : {ayah.numberInSurah} ﴾
            </div>
            <p
              style={{
                fontSize: "2rem",
                lineHeight: 2.2,
                fontFamily: "var(--font-quran, 'Amiri Quran', 'Scheherazade New', serif)",
                color: "var(--ds-ink, #1a1a1a)",
                margin: 0,
                direction: "rtl",
              }}
            >
              {ayah.text}
            </p>
          </>
        )}
      </div>

      {/* Tafsir */}
      <div style={{ marginTop: "1rem", background: "#fff", borderRadius: "0.75rem", border: "1px solid var(--ds-line-color)", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--ds-emerald-deep)" }}>📖 التفسير</span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {TAFSIR_SOURCES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTafsir(t.id)}
                style={{
                  padding: "0.2rem 0.5rem",
                  borderRadius: 999,
                  border: `1px solid ${tafsirId === t.id ? "var(--ds-emerald)" : "var(--ds-line-color)"}`,
                  background: tafsirId === t.id ? "var(--ds-emerald-soft)" : "transparent",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: tafsirId === t.id ? "var(--ds-emerald-deep)" : "var(--ds-ink-soft)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {tafsirLoading && <p style={{ color: "var(--ds-ink-soft)", fontSize: "0.85rem" }}>جاري تحميل التفسير…</p>}
        {!tafsirLoading && ayah && (
          <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.9, color: "var(--ds-ink, #1a1a1a)" }}>
            {tafsirMap.get(ayah.numberInSurah) || "لا يوجد تفسير متاح لهذه الآية في المصدر المختار."}
          </p>
        )}
      </div>

      {/* Jump to ayah */}
      <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--ds-ink-soft)" }}>انتقل إلى الآية:</span>
        <input
          type="number"
          min={1}
          max={total}
          defaultValue={ayahIdx + 1}
          onBlur={(e) => {
            const v = parseInt(e.target.value, 10);
            if (v >= 1 && v <= total) setAyahIdx(v - 1);
          }}
          style={{ width: 60, textAlign: "center", border: "1px solid var(--ds-line-color)", borderRadius: "0.375rem", padding: "0.25rem 0.4rem", fontSize: "0.85rem", fontFamily: "inherit" }}
        />
      </div>
    </div>
  );
}

// ─── Juz View ──────────────────────────────────────────────────────────────

function JuzView({ fontScale }: { fontScale: number }) {
  const [juzNum, setJuzNum] = useState(() => ls<number>(JUZ_KEY, 1));
  const [juzData, setJuzData] = useState<JuzData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrollPct, setScrollPct] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchJuz(juzNum)
      .then((d) => { setJuzData(d); setScrollPct(0); })
      .catch(() => setError("تعذر تحميل الجزء"))
      .finally(() => setLoading(false));
  }, [juzNum]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pct = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    setScrollPct(Math.round(pct * 100));
  }, []);

  const changeJuz = useCallback((n: number) => {
    const v = Math.max(1, Math.min(30, n));
    setJuzNum(v);
    lsSet(JUZ_KEY, v);
  }, []);

  const surahNameMap = useMemo<Map<number, string>>(() => {
    const m = new Map<number, string>();
    juzData?.surahs.forEach((s) => m.set(s.number, s.name));
    return m;
  }, [juzData]);

  return (
    <div style={{ direction: "rtl" }}>
      {/* Juz selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--ds-ink-soft)" }}>اختر الجزء:</span>
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
          {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => changeJuz(n)}
              style={{
                width: 34,
                height: 34,
                borderRadius: "0.375rem",
                border: `1px solid ${n === juzNum ? "var(--ds-emerald)" : "var(--ds-line-color)"}`,
                background: n === juzNum ? "var(--ds-emerald-soft)" : "#fff",
                color: n === juzNum ? "var(--ds-emerald-deep)" : "var(--ds-ink)",
                fontSize: "0.75rem",
                fontWeight: n === juzNum ? 700 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "0.875rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--ds-ink-soft)", marginBottom: "0.25rem" }}>
          <span>الجزء {juzNum} من 30</span>
          <span>موقعك: {scrollPct}%</span>
        </div>
        <div style={{ height: 6, background: "var(--ds-line-color)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "var(--ds-emerald)", width: `${scrollPct}%`, borderRadius: 999, transition: "width 0.2s" }} />
        </div>
      </div>

      {loading && <p style={{ textAlign: "center", color: "var(--ds-ink-soft)", padding: "2rem" }}>جاري تحميل الجزء {juzNum}…</p>}
      {error && <p style={{ textAlign: "center", color: "#8B1A1A", padding: "1rem" }}>{error}</p>}

      {juzData && !loading && (
        <div ref={scrollRef} onScroll={handleScroll} style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "0.5rem" }}>
          {(() => {
            const elements: React.ReactNode[] = [];
            let lastSurahNumber = -1;
            juzData.ayahs.forEach((ayah, idx) => {
              const curSurah = ayah.surahNumber ?? -1;
              if (curSurah !== -1 && curSurah !== lastSurahNumber) {
                lastSurahNumber = curSurah;
                const sName = surahNameMap.get(curSurah) ?? `سورة ${curSurah}`;
                elements.push(
                  <div key={`hdr-${curSurah}-${idx}`} style={{
                    background: "linear-gradient(135deg, var(--ds-emerald-soft), #f8f4e8)",
                    border: "1px solid var(--ds-emerald)",
                    borderRadius: "0.625rem",
                    padding: "0.625rem 1rem",
                    marginBottom: "0.625rem",
                    marginTop: idx > 0 ? "1.25rem" : 0,
                    textAlign: "center",
                  }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ds-emerald-deep)" }}>
                      سورة {sName}
                    </span>
                  </div>
                );
              }
              elements.push(
                <div key={ayah.number} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem", alignItems: "flex-start" }}>
                  <span style={{
                    flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
                    background: "var(--ds-emerald-soft)", color: "var(--ds-emerald-deep)",
                    fontSize: "0.65rem", fontWeight: 700, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {ayah.numberInSurah}
                  </span>
                  <p style={{
                    margin: 0, fontSize: fontScale, lineHeight: 2.1,
                    fontFamily: "var(--font-quran, 'Amiri Quran', 'Scheherazade New', serif)",
                    color: "var(--ds-ink, #1a1a1a)", direction: "rtl",
                  }}>
                    {ayah.text}
                  </p>
                </div>
              );
            });
            return elements;
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Style helpers ─────────────────────────────────────────────────────────

const primaryBtnS: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "var(--ds-radius, 0.5rem)",
  background: "var(--ds-emerald, #1a6b4a)",
  color: "#fff",
  border: "none",
  fontSize: "0.85rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

function navBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "0.45rem 0.875rem",
    borderRadius: "var(--ds-radius, 0.5rem)",
    border: "1px solid var(--ds-line-color)",
    background: disabled ? "var(--ds-parchment-deep, #f5f0e8)" : "#fff",
    color: disabled ? "var(--ds-ink-soft)" : "var(--ds-ink)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "0.82rem",
    fontFamily: "inherit",
    opacity: disabled ? 0.5 : 1,
  };
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function QuranPage() {
  const reader = useQuranReader();
  const { detail, loading, error, surahNum, targetAyah, summary } = reader;
  const totalAyahs = detail?.numberOfAyahs ?? 0;
  const player = useAyahPlayer(surahNum, totalAyahs);

  const [viewMode, setViewMode] = useState<ViewMode>(() => ls<ViewMode>(VIEW_KEY, "surah"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [fontScale, setFontScale] = useState(26);
  const [showAyahNumbers, setShowAyahNumbers] = useState(true);
  const [tafsirId, setTafsirId] = useState<TafsirId>(() => {
    try { return (localStorage.getItem(TAFSIR_KEY) as TafsirId) || "ar.muyassar"; }
    catch { return "ar.muyassar"; }
  });
  const [tafsirAyahs, setTafsirAyahs] = useState<TafsirAyah[]>([]);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);

  // Qiraat state
  const [qiraatId, setQiraatId] = useState<string>(() => getQiraatPref());
  const [qiraatDetail, setQiraatDetail] = useState<SurahDetail | null>(null);
  const [qiraatLoading, setQiraatLoading] = useState(false);

  // When qiraat != hafs, fetch different edition
  useEffect(() => {
    if (qiraatId === "hafs") { setQiraatDetail(null); return; }
    setQiraatLoading(true);
    fetchSurahDetailQiraat(surahNum, qiraatId)
      .then(setQiraatDetail)
      .catch(() => setQiraatDetail(null))
      .finally(() => setQiraatLoading(false));
  }, [surahNum, qiraatId]);

  const activeDetail = qiraatId === "hafs" ? detail : (qiraatDetail ?? detail);
  const activeAyahs: Ayah[] = activeDetail?.ayahs ?? [];

  const changeTafsirId = useCallback((id: TafsirId) => {
    setTafsirId(id);
    try { localStorage.setItem(TAFSIR_KEY, id); } catch { /* ignore */ }
  }, []);

  // Load tafsir for verse/surah views
  useEffect(() => {
    if (!showTafsir && viewMode !== "verse") return;
    setTafsirLoading(true);
    fetchTafsirAyahs(surahNum, tafsirId)
      .then(setTafsirAyahs)
      .catch(() => setTafsirAyahs([]))
      .finally(() => setTafsirLoading(false));
  }, [surahNum, tafsirId, showTafsir, viewMode]);

  // Auto-load tafsir for verse view
  useEffect(() => {
    if (viewMode === "verse" && tafsirAyahs.length === 0 && !tafsirLoading) {
      setTafsirLoading(true);
      fetchTafsirAyahs(surahNum, tafsirId)
        .then(setTafsirAyahs)
        .catch(() => setTafsirAyahs([]))
        .finally(() => setTafsirLoading(false));
    }
  }, [viewMode]);

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

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    lsSet(VIEW_KEY, mode);
  };

  const handleQiraatChange = (id: string) => {
    setQiraatId(id);
    setQiraatPref(id);
    setQiraatDetail(null);
  };

  const currentQiraat = QIRAAT_LIST.find((q) => q.id === qiraatId);

  return (
    <div className="quran-shell">
      {/* Sub-navigation */}
      <nav className="qs-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="qs-subnav__link is-active">المصحف</Link>
        <Link href="/quran-radio" className="qs-subnav__link">الإذاعة والبث</Link>
      </nav>

      {/* View mode tabs */}
      <div style={{ display: "flex", gap: "0.35rem", margin: "0.75rem 0", padding: "0.3rem", background: "var(--ds-parchment-deep, #f5f0e8)", borderRadius: "0.75rem", direction: "rtl" }}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => handleViewChange(v.id)}
            style={{
              flex: 1,
              padding: "0.5rem 0.4rem",
              borderRadius: "0.55rem",
              border: "none",
              background: viewMode === v.id ? "#fff" : "transparent",
              color: viewMode === v.id ? "var(--ds-emerald-deep)" : "var(--ds-ink-soft)",
              fontWeight: viewMode === v.id ? 700 : 400,
              fontSize: "0.8rem",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: viewMode === v.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.25rem",
            }}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {/* Qiraat selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", direction: "rtl", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--ds-ink-soft)", flexShrink: 0 }}>القراءة:</span>
        <select
          value={qiraatId}
          onChange={(e) => handleQiraatChange(e.target.value)}
          style={{
            border: "1px solid var(--ds-line-color)",
            borderRadius: "0.375rem",
            padding: "0.3rem 0.5rem",
            fontSize: "0.8rem",
            fontFamily: "inherit",
            background: "#fff",
            color: "var(--ds-ink)",
            cursor: "pointer",
          }}
        >
          {QIRAAT_LIST.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name}{q.apiEdition ? "" : " (قريباً)"}
            </option>
          ))}
        </select>
        {currentQiraat && !currentQiraat.apiEdition && (
          <span style={{ fontSize: "0.7rem", color: "#8B1A1A", background: "#FEE2E2", padding: "0.15rem 0.4rem", borderRadius: 999 }}>
            يُعرض نص الحفص مؤقتاً
          </span>
        )}
        {qiraatLoading && <span style={{ fontSize: "0.72rem", color: "var(--ds-ink-soft)" }}>جاري التحميل…</span>}
      </div>

      <div className="qs-layout">
        {/* Sidebar overlay (mobile) */}
        <div
          className={`qs-sidebar-backdrop${sidebarOpen ? " is-open" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <aside className={`qs-sidebar${sidebarOpen ? " is-open" : ""}`}>
          <SurahList
            surahs={reader.surahList}
            currentSurah={surahNum}
            onSelect={(n) => reader.goToSurah(n)}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        {/* Main content */}
        <main className="qs-main">
          {/* Controls row */}
          <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {(viewMode === "surah" || viewMode === "verse") && (
              <button type="button" className="qs-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
                ☰ السور
              </button>
            )}
            <button
              type="button"
              className="qs-pb-btn"
              onClick={() => setShowSearch((v) => !v)}
            >
              {showSearch ? "✕ أغلق البحث" : "🔍 بحث"}
            </button>
            {(viewMode === "surah") && (
              <button
                type="button"
                className="qs-pb-btn"
                onClick={() => setShowTafsir((v) => !v)}
              >
                {showTafsir ? "✕ أخفِ التفسير" : "📖 التفسير"}
              </button>
            )}
          </div>

          {/* Resume banner */}
          {reader.lastPos && reader.lastPos.surah !== surahNum && (viewMode === "surah" || viewMode === "verse") && (
            <div style={{ padding: ".6rem 1rem", background: "#f0f7f4", borderRadius: ".5rem", marginBottom: "1rem", direction: "rtl", fontSize: ".88rem" }}>
              <strong>استئناف:</strong>{" "}
              {reader.surahList.find((s) => s.number === reader.lastPos!.surah)?.name ?? reader.lastPos.surah} آية {reader.lastPos.ayah}
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

          {showSearch && <QuranSearch onGoToResult={handleGoToResult} />}

          {/* Tafsir panel (surah view only) */}
          {showTafsir && viewMode === "surah" && (
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
                </div>
              )}
              <p className="qs-source-note">
                المصدر: AlQuran Cloud API · {TAFSIR_SOURCES.find((t) => t.id === tafsirId)?.label}
              </p>
            </div>
          )}

          {/* ── View Modes ── */}

          {viewMode === "page" && <PageView />}

          {viewMode === "juz" && <JuzView fontScale={fontScale} />}

          {(viewMode === "surah" || viewMode === "verse") && (
            <>
              {loading && <div className="qs-loading">جاري تحميل السورة…</div>}

              {!loading && error && (
                <div className="qs-error" role="alert">
                  <p>{error}</p>
                  <button type="button" className="qs-pb-btn qs-pb-btn--primary" style={{ marginTop: ".5rem" }} onClick={() => reader.goToSurah(surahNum)}>
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {!loading && !error && activeAyahs.length > 0 && viewMode === "surah" && (
                <>
                  <AyahDisplay
                    ayahs={activeAyahs}
                    surahNum={surahNum}
                    surahName={activeDetail?.name ?? ""}
                    targetAyah={targetAyah}
                    currentPlayingAyah={player.currentAyah}
                    playerState={player.playerState}
                    fontScale={fontScale}
                    showAyahNumbers={showAyahNumbers}
                    onPlayAyah={player.togglePlayAyah}
                    onAyahClick={reader.goToAyah}
                  />
                  <p className="qs-source-note">
                    القراءة: {currentQiraat?.name} · المصدر: AlQuran Cloud API
                  </p>
                </>
              )}

              {!loading && !error && activeAyahs.length > 0 && viewMode === "verse" && (
                <VerseView
                  ayahs={activeAyahs}
                  surahName={activeDetail?.name ?? ""}
                  tafsirMap={tafsirMap}
                  tafsirId={tafsirId}
                  tafsirLoading={tafsirLoading}
                  onChangeTafsir={changeTafsirId}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Sticky player bar (surah view only) */}
      {summary && viewMode === "surah" && (
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
