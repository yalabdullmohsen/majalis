export { buildGlobalRef, parseGlobalRef, identityFromItem, resolveGlobalRef, registerGlobalRef, getRefVersionHistory } from "./ids.mjs";
export { getAllSources, getSourceBySlug, getSourceTrust, auditAllSources, checkSourceConnection } from "./sources.mjs";
export { createRelation, getRelations, autoLinkRelations, getRelationGraph, getRelationStats, RELATION_TYPES } from "./relations.mjs";
export { recordContentChange, getVersionHistory, diffVersions } from "./versioning.mjs";
export { scoreContent, getQualityStats } from "./quality.mjs";
export { runReviewCycle, getReviewHistory } from "./review.mjs";
export { aiAnalyzeReference, aiSuggestRelations, AI_CONSTRAINTS } from "./ai-assist.mjs";
export { getReferenceDashboard } from "./dashboard.mjs";
export { generateGlobalReferenceReport, buildThreeYearRoadmap } from "./report.mjs";

export async function registerAndLink(admin, item) {
  const { registerGlobalRef } = await import("./ids.mjs");
  const { autoLinkRelations } = await import("./relations.mjs");
  const { scoreContent } = await import("./quality.mjs");

  const reg = await registerGlobalRef(admin, item);
  const ref = reg.ref;
  const linkResult = await autoLinkRelations(admin, { ...item, ref_id: ref.ref_id });
  const scores = await scoreContent(admin, { ...ref, ref_id: ref.ref_id }, { relationCount: linkResult.created });

  return { ref, relations: linkResult, scores };
}
