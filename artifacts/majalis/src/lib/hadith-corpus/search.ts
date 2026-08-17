import { normalizeArabic, toWesternDigits } from "@/shared/arabic-normalize";
import { parseHadithId, formatHadithId, hadithHref } from "./ids";
import type { HadithSearchHit } from "./types";
import sample50 from "../../../content/hadith-corpus/sample-50.json";

type IndexRow = {
  id: string;
  book: string;
  number: number;
  narrator: string;
  matnPreview: string;
  isMawdu: boolean;
  href: string;
  normMatn: string;
  normNarrator: string;
};

const INDEX: IndexRow[] = (sample50 as Array<{
  id: string;
  book: string;
  number: number;
  narrator?: string | null;
  matn: string;
  isMawdu?: boolean;
}>).map((r) => ({
  id: r.id,
  book: r.book,
  number: r.number,
  narrator: r.narrator || "",
  matnPreview: r.matn.slice(0, 180),
  isMawdu: !!r.isMawdu,
  href: hadithHref(r.id),
  normMatn: normalizeArabic(r.matn),
  normNarrator: normalizeArabic(r.narrator || ""),
}));

export function searchHadithCorpus(rawQuery: string, limit = 24): HadithSearchHit[] {
  const q0 = toWesternDigits(rawQuery.trim());
  if (!q0) return [];

  const idHit = parseHadithId(q0);
  if (idHit) {
    const id = formatHadithId(idHit.book, idHit.number);
    const row = INDEX.find((r) => r.id === id);
    if (row) {
      return [
        {
          id: row.id,
          book: row.book,
          number: row.number,
          narrator: row.narrator,
          matnPreview: row.matnPreview,
          isMawdu: row.isMawdu,
          href: row.href,
        },
      ];
    }
  }

  const numOnly = q0.match(/^\d{1,5}$/);
  const q = normalizeArabic(q0);
  const scored: Array<{ row: IndexRow; rank: number }> = [];

  for (const row of INDEX) {
    if (numOnly && String(row.number) === numOnly[0]) {
      scored.push({ row, rank: 0 });
      continue;
    }
    if (row.id === q0.toLowerCase()) {
      scored.push({ row, rank: 0 });
      continue;
    }
    if (q.length >= 2 && row.normNarrator.includes(q)) {
      scored.push({ row, rank: 1 });
      continue;
    }
    if (q.length >= 2 && row.normMatn.includes(q)) {
      scored.push({ row, rank: 2 });
    }
  }

  scored.sort((a, b) => a.rank - b.rank || a.row.number - b.row.number);
  return scored.slice(0, limit).map(({ row }) => ({
    id: row.id,
    book: row.book,
    number: row.number,
    narrator: row.narrator,
    matnPreview: row.matnPreview,
    isMawdu: row.isMawdu,
    href: row.href,
  }));
}
