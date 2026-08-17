import type { HadithBookCode } from "./ids";

export type HadithCorpusGroup = "kutub_tisaa" | "mawduat" | "daif";

export type HadithGradeAttribution = {
  verdict: string;
  attributedTo: string;
  quote: string;
  source: string;
};

export type HadithRecord = {
  id: string;
  book: HadithBookCode;
  number: number;
  numberingSystem: string;
  matn: string;
  narrator?: string | null;
  chapter?: string | null;
  /** حكم منقول منسوب — إن غاب يُعرض «لم يُوثَّق حكمه» */
  grade?: HadithGradeAttribution | null;
  takhrij?: string | null;
  group: HadithCorpusGroup;
  isMawdu?: boolean;
  mawduWarning?: string;
};

export type HadithSearchHit = {
  id: string;
  book: string;
  number: number;
  narrator: string;
  matnPreview: string;
  isMawdu: boolean;
  href: string;
};
