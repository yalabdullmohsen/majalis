"use client";

import { useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { searchMushafQuran, type MushafSearchHit } from "@/lib/mushaf/mushaf-search";
import "@/styles/kuwait-mushaf.css";

export default function QuranSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<MushafSearchHit[]>([]);

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchMushafQuran(q);
      setHits(results);
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
            placeholder="مثال: الرحمن"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runSearch()}
            aria-label="كلمة البحث"
          />
          <button type="button" className="km-btn km-btn--primary" onClick={() => void runSearch()} disabled={loading}>
            {loading ? "جاري البحث…" : "بحث"}
          </button>
        </div>
      </div>

      {error && <p className="quran-v2-error" role="alert">{error}</p>}

      {hits.length > 0 && (
        <div className="ui-card" style={{ marginTop: "1rem", padding: 0, overflow: "hidden" }}>
          {hits.map((h) => (
            <div key={`${h.surah}-${h.ayah}-${h.page}`} className="km-search-hit">
              <div>
                <strong>{h.surahName}</strong>
                <span className="km-search-hit__meta"> · آية {h.ayah} · صفحة {h.page}</span>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.95rem", lineHeight: 1.7 }}>{h.text}</p>
              </div>
              <Link href={`/quran/mushaf?page=${h.page}`} className="km-btn km-btn--primary">
                اذهب للمصحف
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
