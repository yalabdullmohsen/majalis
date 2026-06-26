import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import {
  fetchSurahAyahs,
  getLastQuranPosition,
  getQuranAudioUrl,
  getSurahMeta,
  getSurahList,
  saveQuranPosition,
} from "@/lib/quran-content";

const QURAN_NIGHT_KEY = "majalis-quran-night-v1";

export default function QuranPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const initialSurah = Number(params.get("surah")) || getLastQuranPosition()?.surah || 1;

  const [surah, setSurah] = useState(initialSurah);
  const [ayahs, setAyahs] = useState<{ numberInSurah: number; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [night, setNight] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(QURAN_NIGHT_KEY) === "1";
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchSurahAyahs(surah)
      .then(setAyahs)
      .catch(() => {
        setAyahs([]);
        setError("تعذر تحميل نص السورة من مزود المصحف حالياً. جرّب التحديث أو اختر سورة أخرى.");
      })
      .finally(() => setLoading(false));
    saveQuranPosition(surah, 1);
  }, [surah]);

  useEffect(() => {
    try {
      window.localStorage.setItem(QURAN_NIGHT_KEY, night ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [night]);

  const surahs = getSurahList().filter((s) =>
    !search.trim() ||
    s.name.includes(search.trim()) ||
    s.englishName.toLowerCase().includes(search.trim().toLowerCase()) ||
    String(s.number).includes(search.trim()),
  );
  const meta = getSurahMeta(surah);

  return (
    <div className={`page-shell quran-page${night ? " quran-page--night" : ""}`}>
      <PageHeader eyebrow="القرآن" title="القرآن الكريم" subtitle="قراءة، تلاوة، وبحث في السور." />

      <div className="quran-toolbar ui-card">
        <input
          name="quran-surah-search"
          aria-label="بحث عن سورة"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث عن سورة..."
          className="quran-search"
        />
        <select
          name="quran-surah-select"
          aria-label="اختيار السورة"
          value={surah}
          onChange={(e) => setSurah(Number(e.target.value))}
          className="quran-select"
        >
          {surahs.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number}. {s.name} — {s.englishName}
            </option>
          ))}
        </select>
        <audio controls src={getQuranAudioUrl(surah)} className="quran-audio" />
        <button type="button" className="ui-card-btn" onClick={() => setNight((n) => !n)}>
          {night ? "وضع نهاري" : "وضع ليلي"}
        </button>
      </div>

      {getLastQuranPosition() && (
        <p className="quran-resume">
          آخر موضع: سورة {getLastQuranPosition()?.surah}
        </p>
      )}

      {loading ? (
        <Loading />
      ) : (
        <article className="quran-reader ui-card">
          <header className="quran-surah-header">
            <div>
              <h2 className="quran-surah-title">{meta.name}</h2>
              <p className="quran-surah-meta">
                {meta.englishName} · رقم {meta.number} · {meta.ayahs} آية · {meta.revelation}
                {meta.revelationOrder ? ` · ترتيب النزول ${meta.revelationOrder}` : ""}
              </p>
            </div>
            <span className="quran-trust-badge">ثقة {meta.trustLevel}%</span>
          </header>

          <section className="quran-science-card">
            <h3>عرض علمي موثق للسورة</h3>
            <div className="quran-meta-grid">
              <div><strong>المحاور:</strong> {meta.themes.join("، ")}</div>
              <div><strong>المقاصد:</strong> {meta.objectives.join("، ")}</div>
              <div><strong>الموضوعات:</strong> {meta.mainTopics.join("، ")}</div>
              <div><strong>الأحكام:</strong> {meta.keyRulings.join("، ")}</div>
              <div><strong>الفوائد:</strong> {meta.keyBenefits.join("، ")}</div>
              <div><strong>الأسماء:</strong> {meta.commonNames.join("، ")}</div>
            </div>
            <p><strong>المناسبة بين البداية والنهاية:</strong> {meta.openingClosingConnection}</p>
            <p><strong>سبب النزول:</strong> {meta.asbabNuzul}</p>
            <p><strong>الفضائل:</strong> {meta.virtues}</p>
            <p className="quran-source-note">
              المصدر: {meta.source} · آخر مراجعة: {meta.lastReviewed}
            </p>
            <div className="quran-link-row">
              {meta.tafsirLinks.map((link) => (
                <Link key={link.title} href={link.href}>{link.title}</Link>
              ))}
              {meta.relatedLessons.map((link) => (
                <Link key={link.title} href={link.href}>{link.title}</Link>
              ))}
              {meta.similarAyahLinks.map((link) => (
                <Link key={link.title} href={link.href}>{link.title}</Link>
              ))}
            </div>
          </section>

          {error ? (
            <div className="quran-error" role="alert">{error}</div>
          ) : (
            <div className="quran-ayah-list">
              {ayahs.map((a) => (
                <p key={a.numberInSurah} className="quran-ayah home-ayah-text">
                  <span className="quran-ayah-num">{a.numberInSurah}</span>
                  {a.text}
                </p>
              ))}
            </div>
          )}
          <Link href="/daily-wird" className="home-section-link">الورد اليومي</Link>
        </article>
      )}
    </div>
  );
}
