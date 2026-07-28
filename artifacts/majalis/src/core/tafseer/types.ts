/**
 * Tafseer core types — interpretation sources + cached ayah payload.
 */
export type TafseerSourceId =
  | "ar.muyassar"
  | "ar.jalalayn"
  | "ar.sadi"
  | "en.ibnukathir"
  | "ar.baghawi"
  | "ar.qurtubi"
  | string;

export type TafseerSource = {
  id: TafseerSourceId;
  label: string;
  author: string;
  lang: "ar" | "en";
  level?: string;
  caution?: string;
};

export type TafseerAyahResult = {
  surah: number;
  ayah: number;
  edition: TafseerSourceId;
  text: string;
  sourceLabel: string;
  /** true when served from IndexedDB / memory (no network). */
  fromCache: boolean;
};

export type TafseerFetchState =
  | { status: "idle" }
  | { status: "loading"; edition: TafseerSourceId }
  | { status: "ready"; result: TafseerAyahResult }
  | { status: "empty"; edition: TafseerSourceId }
  | { status: "error"; edition: TafseerSourceId; message: string };
