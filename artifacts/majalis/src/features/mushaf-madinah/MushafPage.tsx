import { memo, useMemo, useRef, useState } from "react";
import type { MushafPageLayout, QpcWord } from "@/lib/quran-data/qpc-page-data";
import { MushafAyahHighlight } from "./MushafAyahHighlight";
import { MushafAyahLine } from "./MushafAyahLine";
import {
  useMushafAyahWordPlaying,
  useMushafAyahWordSelected,
} from "./mushaf-ayah-sync-store";
import { MushafBasmala } from "./MushafBasmala";
import { MushafPageFooter } from "./MushafPageFooter";
import { MushafPageHeader } from "./MushafPageHeader";
import { MushafSurahOrnament } from "./MushafSurahOrnament";
import type { MushafHideLevel } from "./MushafSettingsSheet";
import { useMushafPageFontFit } from "./useMushafPageFontFit";

type Props = {
  layout: MushafPageLayout;
  fontFamily: string;
  /** رقم العرض الفوري عند التقليب — لا ينتظر اكتمال تخطيط النص. */
  displayPageNumber?: number;
  onSelectVerse?: (verseKey: string) => void;
  onLongPressVerse?: (verseKey: string) => void;
  hideLevel?: MushafHideLevel;
  revealedVerses?: ReadonlySet<string>;
  onToggleReveal?: (verseKey: string) => void;
};

const FatihaBasmala = memo(function FatihaBasmala({
  words,
  onSelect,
}: {
  words: QpcWord[];
  onSelect?: () => void;
}) {
  const selected = useMushafAyahWordSelected("1:1");
  const playing = useMushafAyahWordPlaying("1:1");
  return (
    <MushafBasmala words={words} numbered selected={selected} playing={playing} onSelect={onSelect} />
  );
});

/** صفحة مصحف واحدة — شبكة ١٥ خانة من بيانات QPC. */
export const MushafPage = memo(function MushafPage({
  layout,
  fontFamily,
  displayPageNumber,
  onSelectVerse,
  onLongPressVerse,
  hideLevel = 0,
  revealedVerses,
  onToggleReveal,
}: Props) {
  /** ص١: كتلة موسّطة بشارة علوية — ص٢: بداية البقرة من هامش القراءة العادي */
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
  const [pageEl, setPageEl] = useState<HTMLElement | null>(null);
  useMushafPageFontFit(pageRef, true, layout.pageNumber, fontFamily);
  const footerPage = displayPageNumber ?? layout.pageNumber;
  const onSelectFatiha = useMemo(
    () => (onSelectVerse ? () => onSelectVerse("1:1") : undefined),
    [onSelectVerse],
  );

  return (
    <article
      ref={(el) => {
        pageRef.current = el;
        if (pageEl !== el) setPageEl(el);
      }}
      className={`mm-page${isOpeningP1 ? " mm-page--opening" : ""}${isFlexBody ? " mm-page--flex" : ""}${surahStart ? " mm-page--surah-start" : ""}`}
      data-page={footerPage}
      data-page-type={pageType}
      data-testid="mushaf-page"
      data-opening={isFlexBody ? "1" : "0"}
      data-mm-fit="0"
      style={{ ["--mm-qpc-family" as string]: fontFamily }}
      aria-label={`صفحة المصحف ${footerPage}`}
    >
      <MushafAyahHighlight container={pageEl} />
      <MushafPageHeader juzNumber={layout.juzNumber} surahName={layout.headerSurahName} />
      <div
        className={`mm-page__body${isOpeningP1 ? " mm-page__body--opening" : ""}${isFlexBody ? " mm-page__body--flex" : ""}`}
        data-testid="mushaf-page-frame"
      >
        {slotOrder.map((slot) => {
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
                  <FatihaBasmala words={cell.words} onSelect={onSelectFatiha} />
                ) : (
                  <MushafAyahLine
                    words={cell.words}
                    centered={isFlexBody || isLastSurahLine(cell.words, layout)}
                    onSelectVerse={onSelectVerse}
                    onLongPressVerse={onLongPressVerse}
                    hideLevel={hideLevel}
                    revealedVerses={revealedVerses}
                    onToggleReveal={onToggleReveal}
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
