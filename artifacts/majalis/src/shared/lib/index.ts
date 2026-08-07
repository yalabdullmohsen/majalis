/** مكتبات مشتركة — إعادة تصدير تدريجي من @/lib و@/shared. */
export { normalizeArabic } from "@/shared/arabic-normalize";
export { ok, err, type AppResult } from "@/shared/architecture";
export {
  loadKnowledgeGraph,
  relatedFor,
  type KnowledgeGraphDoc,
  type GraphLink,
  type GraphKind,
} from "@/shared/lib/knowledge-graph";
export {
  okData,
  errData,
  wrapAsync,
  type DataResult,
} from "@/shared/lib/data-result";
