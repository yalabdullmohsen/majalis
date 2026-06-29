/**
 * GKE Adapters — bridge to existing stacks without duplication.
 */
export async function getAkeAdapter() {
  return import("../auto-knowledge-engine/orchestrator.mjs");
}

export async function getMkeAdapter() {
  return import("../majlis-knowledge-engine/index.mjs");
}

export async function getCmsRegistry() {
  return import("../cms/content-registry.mjs");
}

export async function getUnifiedSearch() {
  return import("../scholarly-intelligence/unified-search.mjs");
}

export async function getKnowledgePublisher() {
  return import("../knowledge-engine/publisher.mjs");
}
