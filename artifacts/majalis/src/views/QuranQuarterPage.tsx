"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { fetchHizbQuarterAyahs } from "@/lib/quran-search";

function useQuarterParam(): number {
  const [location] = useLocation();
  const match = location.match(/\/quran\/quarters\/(\d+)/);
  return Number(match?.[1]) || 1;
}

export default function QuranQuarterPage() {
  const quarter = Math.min(240, Math.max(1, useQuarterParam()));
  const hizb = Math.floor((quarter - 1) / 4) + 1;
  const rub = ((quarter - 1) % 4) + 1;
  const [ayahs, setAyahs] = useState<Awaited<ReturnType<typeof fetchHizbQuarterAyahs>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchHizbQuarterAyahs(quarter)
      .then(setAyahs)
      .catch(() => setError("تعذر تحميل ربع الحزب"))
      .finally(() => setLoading(false));
  }, [quarter]);

  return (
    <div className="page-shell quran-page">
      <PageHeader eyebrow="القرآن" title={`ربع ${rub} — حزب ${hizb}`} subtitle={`ربع الحزب ${quarter} من 240`} />
      <QuranSubnav active="quarters" />
      <div className="quran-toolbar ui-card">
        <Link href="/quran" className="ui-card-btn">← المصحف</Link>
        {quarter > 1 && <Link href={`/quran/quarters/${quarter - 1}`} className="ui-card-btn">السابق</Link>}
        {quarter < 240 && <Link href={`/quran/quarters/${quarter + 1}`} className="ui-card-btn">التالي</Link>}
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

export function QuranQuartersIndexPage() {
  return (
    <div className="page-shell quran-page">
      <PageHeader eyebrow="القرآن" title="أرباع الأحزاب" subtitle="240 ربعاً — للمراجعة الدقيقة" />
      <QuranSubnav active="quarters" />
      <div className="quran-index-grid quran-index-grid--dense">
        {Array.from({ length: 240 }, (_, i) => {
          const q = i + 1;
          const hizb = Math.floor(i / 4) + 1;
          const rub = (i % 4) + 1;
          return (
            <Link key={q} href={`/quran/quarters/${q}`} className="quran-index-card ui-card">
              <strong>ربع {rub}</strong>
              <span>ح {hizb}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
