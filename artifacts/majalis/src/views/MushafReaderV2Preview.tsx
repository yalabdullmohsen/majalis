import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { loadMushafPage, prefetchMushafPage, type MushafPageLayout } from "@/lib/mushaf-v2-data";
import { MushafPageV2 } from "@/components/quran/MushafPageV2";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/mushaf-v2.css";

const TOTAL_PAGES = 604;

/**
 * صفحة معاينة داخلية فقط لـPhase 3 (رندرة الصفحة المطابقة) — ليست
 * مُوجَّهة للمستخدم النهائي بعد، ولا تستبدل /mushaf الحيّ. تُستخدَم
 * للتحقق البصري (بوابة القبول 3) قبل استبدال المسار الفعلي في مرحلة لاحقة.
 */
export default function MushafReaderV2Preview() {
  const [pageNumber, setPageNumber] = useState(1);
  const [layout, setLayout] = useState<MushafPageLayout | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLayout(null);
    setError(false);
    loadMushafPage(pageNumber)
      .then((l) => { if (!cancelled) setLayout(l); })
      .catch(() => { if (!cancelled) setError(true); });
    prefetchMushafPage(pageNumber - 1);
    prefetchMushafPage(pageNumber + 1);
    return () => { cancelled = true; };
  }, [pageNumber]);

  return (
    <div style={{ minHeight: "100dvh", background: "#F3EFE6", padding: "1rem 0" }} dir="rtl">
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 1rem 1rem" }}>
        <button type="button" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1} aria-label="السابقة">
          <ChevronRight />
        </button>
        <span style={{ fontFamily: "var(--font-body)" }}>
          صفحة {toArabicDigits(pageNumber)} من {toArabicDigits(TOTAL_PAGES)}
          {layout ? ` · الجزء ${toArabicDigits(layout.juzNumber)}` : ""}
        </span>
        <button type="button" onClick={() => setPageNumber((p) => Math.min(TOTAL_PAGES, p + 1))} disabled={pageNumber >= TOTAL_PAGES} aria-label="التالية">
          <ChevronLeft />
        </button>
      </div>
      {error ? (
        <p style={{ textAlign: "center" }}>تعذّر تحميل الصفحة.</p>
      ) : (
        <MushafPageV2 layout={layout} />
      )}
      <div style={{ maxWidth: 720, margin: "1rem auto", padding: "0 1rem" }}>
        <input
          type="number"
          min={1}
          max={TOTAL_PAGES}
          defaultValue={pageNumber}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const n = Number((e.target as HTMLInputElement).value);
              if (n >= 1 && n <= TOTAL_PAGES) setPageNumber(n);
            }
          }}
          style={{ width: "100%", padding: ".5rem" }}
          placeholder="اذهب لصفحة (Enter)"
        />
      </div>
    </div>
  );
}
