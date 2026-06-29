"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import {
  searchMushafQuran,
  localMushafNavigate,
  type MushafSearchHit,
} from "@/lib/mushaf/mushaf-search";
import {
  pushSearchHistory,
  getSearchHistory,
  clearSearchHistory,
} from "@/lib/mushaf/mushaf-storage";
import { mushafPageUrl } from "@/lib/mushaf/kuwait-mushaf-data";
import "@/styles/kuwait-mushaf.css";

function renderHighlighted(text: string) {
  const parts = text.split(/(【[^】]+】)/g);
  return parts.map((part, i) => {
    if (part.startsWith("【") && part.endsWith("】")) {
      return (
        <mark key={i} className="km-search-hit__mark">
          {part.slice(1, -1)}
        </mark>
      );
    }
    return part;
  });
}

export default function QuranSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<MushafSearchHit[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const localHit = useMemo(() => localMushafNavigate(query), [query]);

  const runSearch = async (q?: string) => {
    const term = (q ?? query).trim();
    if (term.length < 1) return;
    setQuery(term);
    setLoading(true);
    setError(null);
    try {
      const results = await searchMushafQuran(term);
      setHits(results);
      setHistory(pushSearchHistory(term));
    } catch {
      setError("تعذّر البحث. تحقق من الاتصال وحاول مجدداً.");
      setHits([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell km-search-page">
      <PageHeader
        eyebrow="القرآن الكريم"
        title="البحث في القرآن"
        subtitle="ابحث عن كلمة أو عبارة وانتقل مباشرة إلى موضعها في المصحف"
      />
      <QuranSubnav active="search" />

      <div className="ui-card" style={{ padding: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="search"
            className="ds-input"
            style={{ flex: 1, minWidth: "200px" }}
            placeholder="مثال: الرحمن · ص 293 · جزء 15 · 18:1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runSearch()}
            aria-label="كلمة البحث"
          />
          <button type="button" className="km-btn km-btn--primary" onClick={() => void runSearch()} disabled={loading}>
            {loading ? "جاري البحث…" : "بحث"}
          </button>
        </div>

        {localHit && (
          <div className="km-search-local">
            <span>انتقال سريع:</span>
            <Link href={mushafPageUrl(localHit.page)} className="km-btn km-btn--sm km-btn--primary">
              {localHit.label} — ص {localHit.page}
            </Link>
          </div>
        )}

        {history.length > 0 && (
          <div className="km-search-history">
            <span>عمليات بحث سابقة:</span>
            {history.map((h) => (
              <button key={h} type="button" className="km-btn km-btn--sm" onClick={() => void runSearch(h)}>
                {h}
              </button>
            ))}
            <button
              type="button"
              className="km-btn km-btn--sm"
              onClick={() => { clearSearchHistory(); setHistory([]); }}
            >
              مسح
            </button>
          </div>
        )}
      </div>

      {error && <p className="quran-v2-error" role="alert">{error}</p>}

      {hits.length > 0 && (
        <div className="ui-card" style={{ marginTop: "1rem", padding: 0, overflow: "hidden" }}>
          {hits.map((h) => (
            <div key={`${h.surah}-${h.ayah}-${h.page}`} className="km-search-hit">
              <div>
                <strong>{h.surahName}</strong>
                <span className="km-search-hit__meta"> · آية {h.ayah} · صفحة {h.page}</span>
                <p className="km-search-hit__text">{renderHighlighted(h.text)}</p>
              </div>
              <Link
                href={mushafPageUrl(h.page, h.surah, h.ayah)}
                className="km-btn km-btn--primary"
              >
                اذهب للمصحف
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
