import { useMemo } from "react";
import type { MushafPageLayout } from "@/lib/mushaf-v2-data";

type Props = {
  layout: MushafPageLayout | null;
};

type AyahText = { verseKey: string; text: string };

function collectAyahTexts(layout: MushafPageLayout): AyahText[] {
  const map = new Map<string, string[]>();
  for (const row of layout.rows) {
    if (row.kind !== "line") continue;
    for (const w of row.words) {
      if (w.charType === "end") continue;
      const parts = map.get(w.verseKey) ?? [];
      parts.push(w.textUthmani || w.textQpcHafs);
      map.set(w.verseKey, parts);
    }
  }
  return [...map.entries()].map(([verseKey, parts]) => ({
    verseKey,
    text: parts.join(" "),
  }));
}

/**
 * طبقة النص: عثماني للبحث/النسخ/قارئ الشاشة — مخفي بصريًا.
 * المفتاح الموحّد: surah:ayah + page.
 */
export function MushafTextLayer({ layout }: Props) {
  const ayahs = useMemo(
    () => (layout ? collectAyahTexts(layout) : []),
    [layout],
  );

  if (!layout || !ayahs.length) return null;

  return (
    <div className="mfl-text" aria-label={`نص صفحة ${layout.pageNumber}`}>
      {ayahs.map((a) => (
        <p
          key={a.verseKey}
          data-verse={a.verseKey}
          data-page={layout.pageNumber}
          data-key={`${a.verseKey}@${layout.pageNumber}`}
        >
          <span className="mfl-text__ref">{a.verseKey}</span>
          {" "}
          {a.text}
        </p>
      ))}
    </div>
  );
}
