/**
 * Global Knowledge Engine (GKE) — Public API
 *
 * Central knowledge layer for Majalis Al-Ilm.
 * Frontend and admin MUST use GKE — never talk to raw sources directly.
 */
export { GKE_VERSION, GKE_PHASE, GKE_LAYERS, GKE_FETCH_TYPES, GKE_CMS_KINDS, GKE_DELEGATES, GKE_QUALITY_THRESHOLD, GKE_SHADOW_MODE, GKE_INTEGRATION_PHASES, GKE_AUTO_PUBLISH_MIN_REPUTATION } from "./config.mjs";
export { PIPELINE_FLOW, getLayerDefinitions, validatePipelineWiring, layersForPhase } from "./pipeline.mjs";
export { on, off, emit, GKE_EVENTS, resetEventBus } from "./events.mjs";
export { getHealthDashboard, getLayerHealth, getSubsystemSnapshot } from "./monitoring.mjs";
export { validateArchitecture, runPipelineDryRun, recordGkeRun, getDashboard } from "./orchestrator.mjs";
export { LAYER_MODULES } from "./layers/index.mjs";
export { getAcquisitionDashboard, runShadowAcquisitionForSource, initializeAcquisition, checkProductionReadiness } from "./acquisition-orchestrator.mjs";
export { isShadowMode, getShadowModeConfig, processShadowItem } from "./shadow-mode.mjs";
export { computeReputation, canAutoPublish, getBestSources, getWorstSources } from "./reputation-engine.mjs";
export { getTrustedSourcesSeed, SOURCE_CATEGORY_TYPES } from "./trusted-sources/registry.mjs";
export { listSources, syncSourcesToDatabase, getSourceBySlug } from "./layers/source-registry.mjs";
