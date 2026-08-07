export {
  MUSHAF_FEATURES,
  MUSHAF_SOURCES,
  AYAH_PRESS_DELAY_MS,
  MUSHAF_PAGE_LINE_SLOTS,
  type MushafFeatureFlags,
  type MushafSourceAdapter,
} from "@/features/mushaf/config";
export {
  buildAyahHitRegions,
  type AyahHitRegion,
  type AyahHitRect,
} from "@/features/mushaf/ayah-hit-regions";
export { MushafLayeredPage } from "@/features/mushaf/MushafLayeredPage";
export { MushafHitLayer } from "@/features/mushaf/MushafHitLayer";
export { MushafTextLayer } from "@/features/mushaf/MushafTextLayer";
