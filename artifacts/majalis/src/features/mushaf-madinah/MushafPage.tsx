import { memo, useEffect, useRef, useState } from "react";
import type { MushafPageLayout, QpcWord } from "@/lib/quran-data/qpc-page-data";
import { MushafAyahHighlight } from "./MushafAyahHighlight";
import { MushafAyahLine } from "./MushafAyahLine";
import { setMushafAyahSyncKeys } from "./mushaf-ayah-sync-store";
import { MushafBasmala } from "./MushafBasmala";
import { MushafPageFooter } from "./MushafPageFooter";
import { MushafPageHeader } from "./MushafPageHeader";
import { MushafSurahOrnament } from "./MushafSurahOrnament";
import { useMushafPageFontFit } from "./useMushafPageFontFit";

type Props = {
  layout: MushafPageLayout;
  fontFamily: string;
  /** رقم العرض الفوري عند التقليب — لا ينتظر اكتمال تخطيط النص. */
  displayPageNumber?: number;
  selectedVerseKey?: string | null;
  playingVerseKey?: string | null;
  onSelectVerse?: (verseKey: string) => void;
  onLongPressVerse?: (verseKey: string) => void;
};

/** صفحة مصحف واحدة — شبكة ١٥ خانة من بيانات QPC. */
export const MushafPage = memo(function MushafPage({
  layout,
  fontFamily,
  displayPageNumber,
  selectedVerseKey = null,
  playingVerseKey = null,
  onSelectVerse,
  onLongPressVerse,
}: Props) {
  const opening = layout.pageNumber === 1 || layout.pageNumber === 2;
  const surahStart = !opening && layout.surahsStartingOnPage.length > 0;
  const pageType = opening ? "opening" : surahStart ? "surah-start" : "normal";
  const slots = buildSlots(layout);
  const pageRef = useRef<HTMLElement | null>(null);
  const [pageEl, setPageEl] = useState<HTMLElement | null>(null);
  useMushafPageFontFit(pageRef, true, layout.pageNumber, fontFamily, null);
  const footerPage = displayPageNumber ?? layout.pageNumber;

  useEffect(() => {
    setMushafAyahSyncKeys(selectedVerseKey ?? null, playingVerseKey ?? null);
    return () => setMushafAyahSyncKeys(null, null);
  }, [selectedVerseKey, playingVerseKey]);

  return (
    <article
      ref={(el) => {
        pageRef.current = el;
        if (pageEl !== el) setPageEl(el);
      }}
      className={`mm-page${opening ? " mm-page--opening" : ""}${surahStart ? " mm-page--surah-start" : ""}`}
      data-page={footerPage}
      data-page-type={pageType}
      data-testid="mushaf-page"
      data-opening={opening ? "1" : "0"}
      data-mm-fit="0"
      style={{ ["--mm-qpc-family" as string]: fontFamily }}
      aria-label={`صفحة المصحف ${footerPage}`}
    >
      <MushafAyahHighlight
        container={pageEl}
        verseKey={selectedVerseKey}
        playingKey={playingVerseKey}
      />
      <MushafPageHeader juzNumber={layout.juzNumber} surahName={layout.headerSurahName} />
      <div
        className={`mm-page__body${opening ? " mm-page__body--opening" : ""}`}
        data-testid="mushaf-page-frame"
      >
        {(opening ? filledSlots(slots) : Array.from({ length: 15 }, (_, i) => i + 1)).map((slot) => {
          const cell = slots.get(slot);
          return (
            <div key={slot} className="mm-slot" data-slot={slot} data-kind={cell?.kind ?? "empty"}>
              {cell?.kind === "banner" ? (
                <div className="mm-slot__banner">
                  <MushafSurahOrnament nameArabic={cell.nameArabic} />
                </div>
              ) : null}
              {cell?.kind === "basmala" ? <MushafBasmala /> : null}
              {cell?.kind === "line" ? (
                cell.words.length > 0 && cell.words.every((w) => w.verseKey === "1:1") ? (
                  <MushafBasmala
                    words={cell.words}
                    numbered
                    selected={selectedVerseKey === "1:1"}
                    playing={playingVerseKey === "1:1"}
                    onSelect={onSelectVerse ? () => onSelectVerse("1:1") : undefined}
                  />
                ) : (
                  <MushafAyahLine
                    words={cell.words}
                    centered={opening || isLastSurahLine(cell.words, layout)}
                    onSelectVerse={onSelectVerse}
                    onLongPressVerse={onLongPressVerse}
                  />
                )
              ) : null}
            </div>
          );
        })}
      </div>
      <MushafPageFooter pageNumber={footerPage} hizbStartingOnPage={layout.hizbStartingOnPage} />
    </article>
  );
});

type SlotCell =
  | { kind: "banner"; nameArabic: string }
  | { kind: "basmala" }
  | { kind: "line"; words: QpcWord[] };

/** آخر سطر سورة (غير ممتلئ في الورقي) يُوسَّط — إن ختم الآية الأخيرة من السورة. */
function isLastSurahLine(words: QpcWord[], layout: MushafPageLayout): boolean {
  if (words.length === 0) return false;
  const last = words.reduce((a, b) => (a.id >= b.id ? a : b));
  if (last.charType !== "end") return false;
  const colon = last.verseKey.indexOf(":");
  if (colon < 0) return false;
  const surah = Number(last.verseKey.slice(0, colon));
  const ayah = Number(last.verseKey.slice(colon + 1));
  const chapter =
    layout.surahsOnPage.find((s) => s.id === surah) ||
    layout.surahsStartingOnPage.find((s) => s.id === surah);
  return !!chapter && ayah === chapter.versesCount;
}

function buildSlots(layout: MushafPageLayout): Map<number, SlotCell> {
  const raw = new Map<number, SlotCell>();
  for (const row of layout.rows) {
    if (row.kind === "surah-header") {
      /* التوبة: bismillahPre=false → لا بسملة.
       * الفاتحة: البسملة آية QPC (لا زخرفة منفصلة).
       * النمل وغيرها: بسملة افتتاحية زخرفية — آية 30 تبقى ضمن نص الآية دون خلط. */
      const needsVisualBasmala = row.surah.bismillahPre === true;
      raw.set(row.bannerSlot, {
        kind: "banner",
        nameArabic: row.surah.nameArabic,
      });
      if (needsVisualBasmala && row.basmalaSlot != null) {
        raw.set(row.basmalaSlot, { kind: "basmala" });
      }
    } else {
      raw.set(row.gridSlot, { kind: "line", words: row.words });
    }
  }
  return raw;
}

function filledSlots(slots: Map<number, SlotCell>): number[] {
  return [...slots.keys()].sort((a, b) => a - b);
}
