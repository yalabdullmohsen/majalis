import { useRef } from "react";
import type { MushafPageLayout, QpcWord } from "@/lib/quran-data/qpc-page-data";
import { MushafAyahLine } from "./MushafAyahLine";
import { MushafBasmala } from "./MushafBasmala";
import { MushafPageFooter } from "./MushafPageFooter";
import { MushafPageHeader } from "./MushafPageHeader";
import { MushafSurahOrnament } from "./MushafSurahOrnament";
import { useMushafPageFontFit } from "./useMushafPageFontFit";

type Props = {
  layout: MushafPageLayout;
  fontFamily: string;
  selectedVerseKey?: string | null;
  playingVerseKey?: string | null;
  onSelectVerse?: (verseKey: string) => void;
};

/** صفحة مصحف واحدة — شبكة ١٥ خانة من بيانات QPC. */
export function MushafPage({
  layout,
  fontFamily,
  selectedVerseKey = null,
  playingVerseKey = null,
  onSelectVerse,
}: Props) {
  const opening = layout.pageNumber === 1 || layout.pageNumber === 2;
  const slots = buildSlots(layout);
  const pageRef = useRef<HTMLElement | null>(null);
  useMushafPageFontFit(pageRef, true, layout.pageNumber, fontFamily, selectedVerseKey);

  return (
    <article
      ref={pageRef}
      className={`mm-page${opening ? " mm-page--opening" : ""}`}
      data-page={layout.pageNumber}
      data-testid="mushaf-page"
      data-opening={opening ? "1" : "0"}
      style={{ ["--mm-qpc-family" as string]: fontFamily }}
      aria-label={`صفحة المصحف ${layout.pageNumber}`}
    >
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
                    selectedVerseKey={selectedVerseKey}
                    playingVerseKey={playingVerseKey}
                    onSelectVerse={onSelectVerse}
                  />
                )
              ) : null}
            </div>
          );
        })}
      </div>
      <MushafPageFooter pageNumber={layout.pageNumber} hizbStartingOnPage={layout.hizbStartingOnPage} />
    </article>
  );
}

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
