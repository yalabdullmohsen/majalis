"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { HIZB_STARTS } from "@/lib/quran-index";
import { fetchHizbQuarterAyahs } from "@/lib/quran-search";

function useHizbParam(): number {
  const [location] = useLocation();
  const match = location.match(/\/quran\/hizb\/(\d+)/);
  return Number(match?.[1]) || 1;
}

export default function QuranHizbPage() {
  const hizb = useHizbParam();
  const info = HIZB_STARTS.find((h) => h.hizb === hizb) || HIZB_STARTS[0];
  const quarter = (hizb - 1) * 4 + 1;
  const [ayahs, setAyahs] = useState<Awaited<ReturnType<typeof fetchHizbQuarterAyahs>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchHizbQuarterAyahs(quarter)
      .then(setAyahs)
      .catch(() => setError("تعذر تحميل الحزب"))
      .finally(() => setLoading(false));
  }, [quarter]);

  return (
    <div className="page-shell quran-page">
      <PageHeader eyebrow="القرآن" title={`الحزب ${hizb}`} subtitle={`يبدأ من ${info.surah}:${info.ayah}`} />
      <QuranSubnav active="hizb" />
      <div className="quran-toolbar ui-card">
        <Link href="/quran" className="ui-card-btn">← المصحف</Link>
        {hizb > 1 && <Link href={`/quran/hizb/${hizb - 1}`} className="ui-card-btn">الحزب السابق</Link>}
        {hizb < 60 && <Link href={`/quran/hizb/${hizb + 1}`} className="ui-card-btn">الحزب التالي</Link>}
      </div>
      {loading ? <Loading /> : error ? <p className="quran-error">{error}</p> : (
        <article className="quran-reader ui-card">
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

export function QuranHizbIndexPage() {
  return (
    <div className="page-shell quran-page">
      <PageHeader eyebrow="القرآن" title="فهرس الأحزاب" subtitle="60 حزباً — للختم والمراجعة" />
      <QuranSubnav active="hizb" />
      <div className="quran-index-grid quran-index-grid--dense">
        {HIZB_STARTS.map((h) => (
          <Link key={h.hizb} href={`/quran/hizb/${h.hizb}`} className="quran-index-card ui-card">
            <strong>الحزب {h.hizb}</strong>
            <span>{h.surah}:{h.ayah}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
