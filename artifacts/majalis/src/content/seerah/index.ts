export type {
  SeerahDateCertainty,
  SeerahEvent,
  SeerahPhase,
  SeerahReviewKind,
  SeerahReviewQueueItem,
  SeerahSource,
  SeerahSourceWork,
} from "./types";

export { SEERAH_EVENTS, filterSeerahEvents, getSeerahEvent } from "./events";
export type { SeerahEventFilter } from "./events";

export { SEERAH_REVIEW_QUEUE } from "./review-queue";

import type { SeerahPhase, SeerahSourceWork } from "./types";

/** تسميات عربية لمراحل السيرة (RTL). */
export const SEERAH_PHASE_LABELS: Record<SeerahPhase, string> = {
  pre_prophethood: "ما قبل البعثة",
  makki: "المرحلة المكية",
  madani: "المرحلة المدنية",
};

export const SEERAH_SOURCE_LABELS: Record<SeerahSourceWork, string> = {
  ibn_hisham: "سيرة ابن هشام",
  ibn_saad: "الطبقات الكبرى — ابن سعد",
  ibn_al_qayyim_zad: "زاد المعاد — ابن القيم",
  ibn_kathir_bidayah: "البداية والنهاية — ابن كثير",
  al_dhahabi_seerah: "السيرة النبوية — الذهبي",
  qadi_iyad_shifa: "الشفا — القاضي عياض",
  akram_diya_umari: "السيرة النبوية الصحيحة — أكرم ضياء العمري",
  faruq_hamada: "مصادر السيرة وتقويمها — فاروق حمادة",
  mahdi_rizqallah: "السيرة في ضوء المصادر الأصلية — مهدي رزق الله",
  mubarakfuri_rahiq: "الرحيق المختوم — المباركفوري",
  sahih_bukhari: "صحيح البخاري",
  sahih_muslim: "صحيح مسلم",
};
