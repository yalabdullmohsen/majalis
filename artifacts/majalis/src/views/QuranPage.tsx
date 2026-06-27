"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { SurahCard } from "@/components/quran/SurahCard";
import {
  filterSurahCards,
  getAllSurahCards,
  parseAyahRef,
  JUZ_STARTS,
  HIZB_STARTS,
} from "@/lib/quran-index";
import { searchQuranKeyword, type QuranSearchHit } from "@/lib/quran-search";
import { getLastQuranPosition } from "@/lib/quran-content";

type Tab = "surahs" | "juz" | "hizb" | "quarters";

export default function QuranPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("surahs");
  const [search, setSearch] = useState("");
  const [keywordResults, setKeywordResults] = useState<QuranSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const cards = useMemo(() => getAllSurahCards(), []);
  const filtered = useMemo(() => filterSurahCards(cards, search), [cards, search]);
  const lastPos = getLastQuranPosition();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = Number(params.get("surah"));
    if (s >= 1 && s <= 114) {
      const ayah = params.get("ayah");
      navigate(`/quran/surah/${s}${ayah ? `?ayah=${ayah}` : ""}`);
    }
  }, [navigate]);

  const runKeywordSearch = async () => {
    const ref = parseAyahRef(search);
    if (ref) {
      navigate(`/quran/surah/${ref.surah}?ayah=${ref.ayah}`);
      return;
    }
    if (search.trim().length < 2) return;
    setSearchLoading(true);
    setSearchError("");
    try {
      const hits = await searchQuranKeyword(search.trim());
      setKeywordResults(hits);
      if (!hits.length) setSearchError("لا نتائج لهذا البحث.");
    } catch {
      setSearchError("تعذر البحث — تحقق من الاتصال.");
      setKeywordResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="page-shell quran-page quran-hub">
      <PageHeader
        eyebrow="القرآن"
        title="المصحف الشريف"
        subtitle="بحث بالسورة والآية والكلمة — فهرس السور والأجزاء والأحزاب"
      />

      <QuranSubnav active="hub" />

      {lastPos && (
        <p className="quran-resume">
          آخر موضع: سورة {lastPos.surah} — آية {lastPos.ayah || 1}
          <Link href={`/quran/surah/${lastPos.surah}?ayah=${lastPos.ayah || 1}`} className="quran-resume-btn">
            استئناف
          </Link>
        </p>
      )}

      <div className="quran-hub-search ui-card">
        <input
          aria-label="بحث في القرآن"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setKeywordResults([]);
            setSearchError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && runKeywordSearch()}
          placeholder="اسم السورة، رقمها، 2:255، أو كلمة..."
          className="quran-search full"
        />
        <button type="button" className="ui-card-btn" onClick={runKeywordSearch}>
          بحث
        </button>
      </div>

      {searchLoading && <Loading />}
      {searchError && <p className="quran-error">{searchError}</p>}

      {keywordResults.length > 0 && (
        <section className="quran-search-results ui-card">
          <h2 className="quran-section-title">نتائج البحث ({keywordResults.length})</h2>
          <ul className="quran-search-list">
            {keywordResults.map((hit) => (
              <li key={`${hit.surah}-${hit.ayah}`}>
                <Link href={`/quran/surah/${hit.surah}?ayah=${hit.ayah}`}>
                  <strong>{hit.surah}:{hit.ayah}</strong>
                  <span>{hit.text.slice(0, 120)}…</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="quran-hub-tabs">
        {(["surahs", "juz", "hizb", "quarters"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`content-hub-chip${tab === t ? " content-hub-chip--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "surahs" ? "السور" : t === "juz" ? "الأجزاء" : t === "hizb" ? "الأحزاب" : "أرباع الحزب"}
          </button>
        ))}
      </div>

      {tab === "surahs" && (
        <div className="quran-surah-grid">
          {filtered.map((s) => (
            <SurahCard key={s.number} surah={s} />
          ))}
        </div>
      )}

      {tab === "juz" && (
        <div className="quran-index-grid">
          {JUZ_STARTS.map((j) => (
            <Link key={j.juz} href={`/quran/juz/${j.juz}`} className="quran-index-card ui-card">
              <strong>{j.label}</strong>
              <span>سورة {j.surah} — آية {j.ayah}</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "hizb" && (
        <div className="quran-index-grid quran-index-grid--dense">
          {HIZB_STARTS.map((h) => (
            <Link key={h.hizb} href={`/quran/hizb/${h.hizb}`} className="quran-index-card ui-card">
              <strong>الحزب {h.hizb}</strong>
              <span>{h.surah}:{h.ayah}</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "quarters" && (
        <div className="quran-index-grid quran-index-grid--dense">
          {Array.from({ length: 240 }, (_, i) => {
            const q = i + 1;
            const hizb = Math.floor(i / 4) + 1;
            const rub = (i % 4) + 1;
            return (
              <Link key={q} href={`/quran/quarters/${q}`} className="quran-index-card ui-card">
                <strong>ربع {rub}</strong>
                <span>حزب {hizb}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
