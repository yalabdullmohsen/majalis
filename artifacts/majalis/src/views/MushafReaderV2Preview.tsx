import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronLeft, Mic2 } from "lucide-react";
import { loadMushafPage, prefetchMushafPage, getAyahTextFromLayout, type MushafPageLayout } from "@/lib/mushaf-v2-data";
import { MushafPageV2 } from "@/components/quran/MushafPageV2";
import { PageAyahActionSheet } from "@/components/quran/PageAyahActionSheet";
import { useAyahPlayer } from "@/hooks/useAyahPlayer";
import { getSurahMeta } from "@/lib/quran-api";
import { RECITERS } from "@/lib/quran-audio";
import { applyPageSeo } from "@/lib/seo";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/mushaf-v2.css";

const TOTAL_PAGES = 604;

/**
 * صفحة معاينة داخلية لقارئ المصحف المطابق لمصحف المدينة (Phase 4: صوت
 * القرّاء + التفاعل مع الآية + التفسير) — لا تزال غير مُوجَّهة للمستخدم
 * النهائي ولا تستبدل /mushaf الحيّ، راجع docs/mushaf-rebuild-inventory.md.
 * الصوت والتفسير والإجراءات (إشارة مرجعية/ملاحظة/مشاركة) تُعاد استخدامها
 * حرفيًا من useAyahPlayer + PageAyahActionSheet القائمين فعليًا في
 * MushafPageView.tsx — لا بنية صوتية جديدة.
 */
export default function MushafReaderV2Preview() {
  const [pageNumber, setPageNumber] = useState(1);
  const [layout, setLayout] = useState<MushafPageLayout | null>(null);
  const [error, setError] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<{ surah: number; ayah: number } | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/mushaf-v2-preview",
      title: "معاينة المصحف المطابق لمصحف المدينة | المجلس العلمي",
      description: "معاينة داخلية لقارئ مصحف مطابق لرسم مصحف المدينة (خطوط QPC V2) مع صوت القرّاء والتفسير.",
      robots: "noindex, nofollow",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLayout(null);
    setError(false);
    setSelectedAyah(null);
    loadMushafPage(pageNumber)
      .then((l) => { if (!cancelled) setLayout(l); })
      .catch(() => { if (!cancelled) setError(true); });
    prefetchMushafPage(pageNumber - 1);
    prefetchMushafPage(pageNumber + 1);
    return () => { cancelled = true; };
  }, [pageNumber]);

  // مشغّل الصوت مربوط بأول سورة على الصفحة فقط (نفس قيد MushafPageView.tsx
  // القائم فعليًا — الصفحات النادرة التي تضم سورتين، الاستماع يعمل للسورة
  // الأولى فقط)، لا قيد جديد أخترعه هنا.
  const primarySurahNum = layout?.surahsOnPage[0]?.id ?? 1;
  const primarySurahAyahs = layout ? getSurahMeta(primarySurahNum).ayahs : 0;
  const { currentAyah, playerState, reciterId, setReciterId, togglePlayAyah } =
    useAyahPlayer(primarySurahNum, primarySurahAyahs);

  const activeAyahKey = useMemo(() => {
    if (currentAyah === null || playerState !== "playing") return null;
    return `${primarySurahNum}:${currentAyah}`;
  }, [currentAyah, playerState, primarySurahNum]);

  const selectedAyahText = useMemo(() => {
    if (!selectedAyah || !layout) return "";
    return getAyahTextFromLayout(layout, `${selectedAyah.surah}:${selectedAyah.ayah}`);
  }, [selectedAyah, layout]);

  const selectedSurahName = selectedAyah ? getSurahMeta(selectedAyah.surah).name : "";
  const canPlaySelected = selectedAyah?.surah === primarySurahNum;
  const isPlayingSelected = canPlaySelected && currentAyah === selectedAyah?.ayah && playerState === "playing";

  const handleAyahPress = (verseKey: string) => {
    const [surahStr, ayahStr] = verseKey.split(":");
    setSelectedAyah({ surah: Number(surahStr), ayah: Number(ayahStr) });
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F3EFE6", padding: "1rem 0" }} dir="rtl">
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 1rem 1rem", gap: "0.5rem" }}>
        <button type="button" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1} aria-label="السابقة">
          <ChevronRight />
        </button>
        <span style={{ fontFamily: "var(--font-body)", fontSize: ".85rem", textAlign: "center" }}>
          صفحة {toArabicDigits(pageNumber)} من {toArabicDigits(TOTAL_PAGES)}
          {layout ? ` · الجزء ${toArabicDigits(layout.juzNumber)}` : ""}
          <br />
          <span style={{ display: "inline-flex", alignItems: "center", gap: ".25rem", fontSize: ".78rem", color: "#5A6660" }}>
            <Mic2 size={12} aria-hidden="true" />
            {RECITERS.find((r) => r.id === reciterId)?.nameAr ?? RECITERS[0].nameAr}
          </span>
        </span>
        <button type="button" onClick={() => setPageNumber((p) => Math.min(TOTAL_PAGES, p + 1))} disabled={pageNumber >= TOTAL_PAGES} aria-label="التالية">
          <ChevronLeft />
        </button>
      </div>
      {error ? (
        <p style={{ textAlign: "center" }}>تعذّر تحميل الصفحة.</p>
      ) : (
        <MushafPageV2 layout={layout} activeAyahKey={activeAyahKey} onAyahPress={handleAyahPress} />
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

      {selectedAyah && (
        <PageAyahActionSheet
          surahNum={selectedAyah.surah}
          surahName={selectedSurahName}
          ayahNum={selectedAyah.ayah}
          ayahText={selectedAyahText}
          isPlaying={isPlayingSelected}
          canPlay={canPlaySelected}
          onTogglePlay={() => togglePlayAyah(selectedAyah.ayah)}
          reciterId={reciterId}
          onSetReciter={setReciterId}
          onClose={() => setSelectedAyah(null)}
        />
      )}
    </div>
  );
}
