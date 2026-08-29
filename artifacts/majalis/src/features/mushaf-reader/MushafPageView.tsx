import { memo, useMemo, useRef } from "react";
import type { MushafPageLayout, QpcWord } from "@/lib/quran-data/qpc-page-data";
import { toArabicIndicDigits as toArabicDigits, toArabicPageDigits } from "@/lib/numerals";
import { MushafDecorFrame } from "./MushafDecorFrame";
import { MushafSurahBanner } from "./MushafSurahBanner";
import { MushafBasmalaView, MushafVerseLayer } from "./MushafVerseLayer";
import { useNewMushafFontFit } from "./useNewMushafFontFit";

type Props = {
  layout: MushafPageLayout;
  fontFamily: string;
  displayPageNumber?: number;
  onSelectVerse?: (verseKey: string) => void;
};

type SlotCell =
  | { kind: "banner"; nameArabic: string }
  | { kind: "basmala" }
  | { kind: "line"; words: QpcWord[] };

function buildSlots(layout: MushafPageLayout): Map<number, SlotCell> {
  const raw = new Map<number, SlotCell>();
  for (const row of layout.rows) {
    if (row.kind === "surah-header") {
      const needsVisualBasmala = row.surah.bismillahPre === true;
      raw.set(row.bannerSlot, { kind: "banner", nameArabic: row.surah.nameArabic });
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

/** عرض صفحة مصحف واحدة — خلفية عاجية، إطار، شبكة ١٥، بلا كروت */
export const MushafPageView = memo(function MushafPageView({
  layout,
  fontFamily,
  displayPageNumber,
  onSelectVerse,
}: Props) {
  const isOpeningP1 = layout.pageNumber === 1;
  const isFlexBody = layout.pageNumber === 1 || layout.pageNumber === 2;
  const surahStart = !isFlexBody && layout.surahsStartingOnPage.length > 0;
  const pageType = isOpeningP1
    ? "opening"
    : layout.pageNumber === 2
      ? "lead"
      : surahStart
        ? "surah-start"
        : "normal";

  const slots = useMemo(() => buildSlots(layout), [layout]);
  const slotOrder = useMemo(
    () => (isFlexBody ? filledSlots(slots) : Array.from({ length: 15 }, (_, i) => i + 1)),
    [isFlexBody, slots],
  );

  const pageRef = useRef<HTMLElement | null>(null);
  useNewMushafFontFit(pageRef, true, layout.pageNumber, fontFamily);

  const footerPage = displayPageNumber ?? layout.pageNumber;
  const hizbLabel =
    layout.hizbStartingOnPage != null
      ? `الحزب ${toArabicDigits(layout.hizbStartingOnPage)}`
      : layout.hizbNumber
        ? `الحزب ${toArabicDigits(layout.hizbNumber)}`
        : "";

  const onSelectFatiha = useMemo(
    () => (onSelectVerse ? () => onSelectVerse("1:1") : undefined),
    [onSelectVerse],
  );

  return (
    <article
      ref={pageRef}
      className={`nm-page${isOpeningP1 ? " nm-page--opening" : ""}${isFlexBody ? " nm-page--flex" : ""}`}
      data-page={footerPage}
      data-page-type={pageType}
      data-testid="mushaf-page"
      data-opening={isFlexBody ? "1" : "0"}
      data-mm-fit="0"
      style={{ ["--nm-qpc-family" as string]: `"${fontFamily}"` }}
      aria-label={`صفحة المصحف ${footerPage}`}
    >
      <header className="nm-page__header">
        <span className="nm-page__header-juz">{`الجزء ${toArabicDigits(layout.juzNumber)}`}</span>
        <span className="nm-page__header-surah">{layout.headerSurahName}</span>
      </header>

      <div className="nm-page__stage" data-testid="mushaf-page-frame">
        <MushafDecorFrame />
        <div
          className={`nm-page__body${isOpeningP1 ? " nm-page__body--opening" : ""}${isFlexBody ? " nm-page__body--flex" : ""}`}
        >
          {slotOrder.map((slot) => {
            const cell = slots.get(slot);
            return (
              <div key={slot} className="nm-slot" data-slot={slot} data-kind={cell?.kind ?? "empty"}>
                {cell?.kind === "banner" ? (
                  <div className="nm-slot__banner">
                    <MushafSurahBanner nameArabic={cell.nameArabic} />
                  </div>
                ) : null}
                {cell?.kind === "basmala" ? <MushafBasmalaView /> : null}
                {cell?.kind === "line" ? (
                  cell.words.length > 0 && cell.words.every((w) => w.verseKey === "1:1") ? (
                    <MushafBasmalaView
                      words={cell.words}
                      numbered
                      onSelect={onSelectFatiha}
                    />
                  ) : (
                    <MushafVerseLayer
                      words={cell.words}
                      centered={isFlexBody || isLastSurahLine(cell.words, layout)}
                      onSelectVerse={onSelectVerse}
                    />
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <footer className="nm-page__footer">
        <span className="nm-page__footer-hizb">{hizbLabel}</span>
        <span className="nm-page__footer-num">{toArabicPageDigits(footerPage)}</span>
        <span className="nm-page__footer-spacer" aria-hidden="true" />
      </footer>
    </article>
  );
});
