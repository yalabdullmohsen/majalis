"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { MushafReader } from "@/components/mushaf/MushafReader";
import { useKuwaitMushaf, type KuwaitMushafInit } from "@/hooks/useKuwaitMushaf";
import { MUSHAF_INDEX } from "@/lib/mushaf/kuwait-mushaf-data";
import "@/styles/kuwait-mushaf.css";

function parseMushafSearch(search: string): KuwaitMushafInit {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const init: KuwaitMushafInit = {};
  const p = Number(params.get("page"));
  if (Number.isFinite(p) && p >= 1 && p <= 604) init.page = p;
  const s = Number(params.get("surah"));
  const a = Number(params.get("ayah"));
  if (Number.isFinite(s) && s >= 1 && s <= 114) init.surah = s;
  if (Number.isFinite(a) && a >= 1) init.ayah = a;
  return init;
}

export default function KuwaitMushafPage() {
  const search = useSearch();
  const parsed = useMemo(() => parseMushafSearch(search), [search]);
  const mushaf = useKuwaitMushaf(parsed);
  const { setPage, page, prefs } = mushaf;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const incoming = parseMushafSearch(search);
    if (incoming.page && incoming.page !== page) setPage(incoming.page);
  }, [search, page, setPage]);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    const next = `/quran/mushaf?${params.toString()}`;
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [page]);

  return (
    <div className={`page-shell km-mushaf-page${prefs.readingMode ? " km-mushaf-page--reading" : ""}`}>
      {!prefs.readingMode && (
        <>
          <PageHeader
            eyebrow="القرآن الكريم"
            title="المصحف الشريف (طبعة دولة الكويت)"
            subtitle={`${MUSHAF_INDEX.edition} — ${MUSHAF_INDEX.totalPages} صفحة · تجربة مصحف ورقي`}
          />
          <QuranSubnav active="mushaf" />
        </>
      )}
      {mounted ? <MushafReader mushaf={mushaf} /> : null}
    </div>
  );
}
