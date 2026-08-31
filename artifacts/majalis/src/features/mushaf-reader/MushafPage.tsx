import { memo, useMemo, useRef, type CSSProperties } from "react";
import type { MushafPageLayout, QpcWord } from "@/lib/quran-data/qpc-page-data";
import { toArabicIndicDigits as toArabicDigits, toArabicPageDigits } from "@/lib/numerals";
import { MushafSurahBanner } from "./MushafSurahBanner";
import { MushafBasmalaView, MushafVerseLayer } from "./MushafVerseLayer";
import { AyahSelectionOverlay } from "./AyahSelectionOverlay";

type Props = {
  layout: MushafPageLayout;
  fontFamily: string;
  displayPageNumber?: number;
  onSelectVerse?: (verseKey: string) => void;
  /** قياس التحديد بعد استقرار القلب فقط */
  selectionEnabled?: boolean;
  /** فتح انتقال الصفحة عند الضغط على رقم الصفحة */
  onPageNumberPress?: () => void;
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

/**
 * MushafPage — صفحة ثابتة القياس من أول إطار.
 * شبكة ١٥ سطرًا لكل الصفحات (نفس bodyTop) — بلا توسيط flex يقفز النص.
 */
export const MushafPage = memo(function MushafPage({
  layout,
  fontFamily,
  displayPageNumber,
  onSelectVerse,
  selectionEnabled = true,
  onPageNumberPress,
}: Props) {
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const isOpeningP1 = layout.pageNumber === 1;
  const isLeadP2 = layout.pageNumber === 2;
  const surahStart = !isOpeningP1 && !isLeadP2 && layout.surahsStartingOnPage.length > 0;
  const pageType = isOpeningP1
    ? "opening"
    : isLeadP2
      ? "lead"
      : surahStart
        ? "surah-start"
        : "normal";

  const slots = useMemo(() => buildSlots(layout), [layout]);
  const slotOrder = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 1), []);

  const footerPage = displayPageNumber ?? layout.pageNumber;
  const hizbLabel =
    layout.hizbStartingOnPage != null
      ? `الحزب ${toArabicDigits(layout.hizbStartingOnPage)}`
      : "";

  const onSelectFatiha = useMemo(
    () => (onSelectVerse ? () => onSelectVerse("1:1") : undefined),
    [onSelectVerse],
  );

  return (
    <article
      className={`nm-page${isOpeningP1 ? " nm-page--opening" : ""}${isLeadP2 ? " nm-page--lead" : ""}`}
      data-page={footerPage}
      data-page-type={pageType}
      data-layout="pageShell"
      data-testid="mushaf-page"
      data-opening={isOpeningP1 || isLeadP2 ? "1" : "0"}
      data-mm-fit="1"
      style={
        {
          ["--nm-qpc-family"]: fontFamily,
          ["--mm-qpc-family"]: fontFamily,
        } as CSSProperties
      }
      aria-label={`صفحة المصحف ${footerPage}`}
    >
      <header
        className="nm-page__header"
        data-layout="pageHeader"
        style={{ height: "var(--mushaf-header-height, 36px)", minHeight: "var(--mushaf-header-height, 36px)" }}
      >
        <span className="nm-page__header-surah">{layout.headerSurahName}</span>
        <span className="nm-page__header-juz">{`الجزء ${toArabicDigits(layout.juzNumber)}`}</span>
      </header>

      <div className="nm-page__stage" data-testid="mushaf-page-frame">
        <div
          ref={bodyRef}
          className="nm-page__body"
          data-layout="pageBody"
        >
          <AyahSelectionOverlay containerRef={bodyRef} enabled={selectionEnabled} />
          {slotOrder.map((slot) => {
            const cell = slots.get(slot);
            return (
              <div
                key={slot}
                className="nm-slot"
                data-slot={slot}
                data-kind={cell?.kind ?? "empty"}
                data-layout="lineBlock"
              >
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
                      centered={isOpeningP1 || isLeadP2 || isLastSurahLine(cell.words, layout)}
                      onSelectVerse={onSelectVerse}
                    />
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <footer
        className="nm-page__footer"
        data-layout="pageFooter"
        style={{ height: "var(--mushaf-footer-height, 32px)", minHeight: "var(--mushaf-footer-height, 32px)" }}
      >
        <span className="nm-page__footer-hizb">{hizbLabel}</span>
        <button
          type="button"
          className="nm-page__footer-num"
          data-testid="mushaf-page-number"
          disabled={!onPageNumberPress}
          aria-label={
            onPageNumberPress
              ? `الصفحة ${footerPage} — انتقال إلى صفحة`
              : `الصفحة ${footerPage}`
          }
          onClick={(e) => {
            e.stopPropagation();
            onPageNumberPress?.();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {toArabicPageDigits(footerPage)}
        </button>
        <span className="nm-page__footer-spacer" aria-hidden="true" />
      </footer>
    </article>
  );
});

/** توافق مع الاسم السابق */
export const MushafPageView = MushafPage;
