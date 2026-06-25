import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import {
  fetchSurahAyahs,
  getLastQuranPosition,
  getQuranAudioUrl,
  getSurahList,
  saveQuranPosition,
} from "@/lib/quran-content";

export default function QuranPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const initialSurah = Number(params.get("surah")) || getLastQuranPosition()?.surah || 1;

  const [surah, setSurah] = useState(initialSurah);
  const [ayahs, setAyahs] = useState<{ numberInSurah: number; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [night, setNight] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchSurahAyahs(surah)
      .then(setAyahs)
      .catch(() => setAyahs([]))
      .finally(() => setLoading(false));
    saveQuranPosition(surah, 1);
  }, [surah]);

  const surahs = getSurahList().filter((s) =>
    !search.trim() || s.name.includes(search.trim()) || String(s.number).includes(search.trim()),
  );

  return (
    <div className={`page-shell quran-page${night ? " quran-page--night" : ""}`}>
      <PageHeader eyebrow="القرآن" title="القرآن الكريم" subtitle="قراءة، تلاوة، وبحث في السور." />

      <div className="quran-toolbar ui-card">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث عن سورة..."
          className="quran-search"
        />
        <select value={surah} onChange={(e) => setSurah(Number(e.target.value))} className="quran-select">
          {surahs.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number}. {s.name}
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
          <h2 className="quran-surah-title">{getSurahList().find((s) => s.number === surah)?.name}</h2>
          <div className="quran-ayah-list">
            {ayahs.map((a) => (
              <p key={a.numberInSurah} className="quran-ayah home-ayah-text">
                <span className="quran-ayah-num">{a.numberInSurah}</span>
                {a.text}
              </p>
            ))}
          </div>
          <Link href="/daily-wird" className="home-section-link">الورد اليومي</Link>
        </article>
      )}
    </div>
  );
}
