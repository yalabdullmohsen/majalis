import type { MushafPageLayout, QpcWord } from "@/lib/quran-data/qpc-page-data";
import { MushafAyahLine } from "./MushafAyahLine";
import { MushafPageFooter } from "./MushafPageFooter";
import { MushafPageHeader } from "./MushafPageHeader";
import { MushafSurahOrnament } from "./MushafSurahOrnament";

const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

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
  const slots = buildSlots(layout, opening);

  return (
    <article
      className={`mm-page${opening ? " mm-page--opening" : ""}`}
      data-page={layout.pageNumber}
      data-testid="mushaf-page"
      style={{ ["--mm-qpc-family" as string]: fontFamily }}
      aria-label={`صفحة المصحف ${layout.pageNumber}`}
    >
      <MushafPageHeader
        juzNumber={layout.juzNumber}
        surahNames={layout.surahsOnPage.map((s) => s.nameArabic)}
      />
      <div className="mm-page__body" data-testid="mushaf-page-frame">
        {Array.from({ length: 15 }, (_, i) => {
          const slot = i + 1;
          const cell = slots.get(slot);
          return (
            <div key={slot} className="mm-slot" data-slot={slot}>
              {cell?.kind === "banner" ? (
                <MushafSurahOrnament nameArabic={cell.nameArabic} />
              ) : null}
              {cell?.kind === "basmala" ? (
                <div className="mm-basmala" dir="rtl" lang="ar">
                  {BASMALA}
                </div>
              ) : null}
              {cell?.kind === "line" ? (
                <MushafAyahLine
                  words={cell.words}
                  centered={opening}
                  selectedVerseKey={selectedVerseKey}
                  playingVerseKey={playingVerseKey}
                  onSelectVerse={onSelectVerse}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <MushafPageFooter pageNumber={layout.pageNumber} />
    </article>
  );
}

type SlotCell =
  | { kind: "banner"; nameArabic: string }
  | { kind: "basmala" }
  | { kind: "line"; words: QpcWord[] };

function buildSlots(layout: MushafPageLayout, opening: boolean): Map<number, SlotCell> {
  const raw = new Map<number, SlotCell>();
  for (const row of layout.rows) {
    if (row.kind === "surah-header") {
      raw.set(row.bannerSlot, { kind: "banner", nameArabic: row.surah.nameArabic });
      if (row.basmalaSlot != null) {
        raw.set(row.basmalaSlot, { kind: "basmala" });
      }
    } else {
      raw.set(row.gridSlot, { kind: "line", words: row.words });
    }
  }
  if (!opening || raw.size === 0) return raw;

  const keys = [...raw.keys()].sort((a, b) => a - b);
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  const span = last - first + 1;
  const targetStart = Math.max(1, Math.floor((15 - span) / 2) + 1);
  const delta = targetStart - first;
  if (delta === 0) return raw;
  const centered = new Map<number, SlotCell>();
  for (const [slot, cell] of raw) {
    centered.set(slot + delta, cell);
  }
  return centered;
}
