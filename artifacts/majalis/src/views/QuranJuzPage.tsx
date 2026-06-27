"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { JUZ_STARTS } from "@/lib/quran-index";
import { fetchJuzAyahs } from "@/lib/quran-search";

function useIndexParam(prefix: string): number {
  const [location] = useLocation();
  const match = location.match(new RegExp(`${prefix}/(\\d+)`));
  return Number(match?.[1]) || 1;
}

export default function QuranJuzPage() {
  const juz = useIndexParam("/quran/juz");
  const info = JUZ_STARTS.find((j) => j.juz === juz) || JUZ_STARTS[0];
  const [ayahs, setAyahs] = useState<Awaited<ReturnType<typeof fetchJuzAyahs>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchJuzAyahs(juz)
      .then(setAyahs)
      .catch(() => setError("تعذر تحميل الجزء"))
      .finally(() => setLoading(false));
  }, [juz]);

  return (
    <div className="page-shell quran-page">
      <PageHeader eyebrow="القرآن" title={info.label} subtitle={`يبدأ من سورة ${info.surah} — آية ${info.ayah}`} />
      <QuranSubnav active="juz" />
      <div className="quran-toolbar ui-card">
        <Link href="/quran" className="ui-card-btn">← المصحف</Link>
        {juz > 1 && <Link href={`/quran/juz/${juz - 1}`} className="ui-card-btn">الجزء السابق</Link>}
        {juz < 30 && <Link href={`/quran/juz/${juz + 1}`} className="ui-card-btn">الJزء التالي</Link>}
      </div>
      {loading ? <Loading /> : error ? <p className="quran-error">{error}</p> : (
        <article className="quran-reader ui-card quran-juz-reader">
          {ayahs.map((a, i) => (
            <p key={`${a.surah.number}-${a.numberInSurah}-${i}`} className="quran-ayah home-ayah-text">
              <Link href={`/quran/surah/${a.surah.number}?ayah=${a.numberInSurah}`}>
                <span className="quran-ayah-num">{a.surah.name} {a.numberInSurah}</span>
              </Link>
              {a.text}
            </p>
          ))}
        </article>
      )}
    </div>
  );
}

export function QuranJuzIndexPage() {
  return (
    <div className="page-shell quran-page">
      <PageHeader eyebrow="القرآن" title="فهرس الأجزاء" subtitle="30 جزءاً — انتقل مباشرة لقراءة أي جزء" />
      <QuranSubnav active="juz" />
      <div className="quran-index-grid">
        {JUZ_STARTS.map((j) => (
          <Link key={j.juz} href={`/quran/juz/${j.juz}`} className="quran-index-card ui-card">
            <strong>{j.label}</strong>
            <span>سورة {j.surah}:{j.ayah}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
