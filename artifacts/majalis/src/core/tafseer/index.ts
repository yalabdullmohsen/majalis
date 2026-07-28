/**
 * Tafseer core — interpretation fetch/cache (no UI).
 */
export {
  TafseerService,
  getTafseerService,
  TAFSEER_SOURCES,
  __resetTafseerServiceForTests,
} from "@/core/tafseer/TafseerService";
export type {
  TafseerSourceId,
  TafseerSource,
  TafseerAyahResult,
  TafseerFetchState,
} from "@/core/tafseer/types";
