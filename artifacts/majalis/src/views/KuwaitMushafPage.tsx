"use client";

import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { MushafReader } from "@/components/mushaf/MushafReader";
import { useKuwaitMushaf } from "@/hooks/useKuwaitMushaf";
import { MUSHAF_INDEX } from "@/lib/mushaf/kuwait-mushaf-data";
import "@/styles/kuwait-mushaf.css";

function parsePageFromSearch(search: string): number | undefined {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const p = Number(params.get("page"));
  return Number.isFinite(p) && p >= 1 && p <= 604 ? p : undefined;
}

export default function KuwaitMushafPage() {
  const search = useSearch();
  const initial = parsePageFromSearch(search);
  const mushaf = useKuwaitMushaf(initial);
  const { setPage, page } = mushaf;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const p = parsePageFromSearch(search);
    if (p && p !== page) setPage(p);
  }, [search, page, setPage]);

  return (
    <div className="page-shell km-mushaf-page">
      <PageHeader
        eyebrow="القرآن الكريم"
        title="المصحف الشريف (طبعة دولة الكويت)"
        subtitle={`${MUSHAF_INDEX.edition} — ${MUSHAF_INDEX.totalPages} صفحة · تجربة مصحف ورقي`}
      />
      <QuranSubnav active="mushaf" />
      {mounted ? <MushafReader mushaf={mushaf} /> : null}
    </div>
  );
}
