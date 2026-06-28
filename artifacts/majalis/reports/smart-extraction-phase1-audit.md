# Phase 1 — Smart Extraction System Analysis

**Date:** 2026-06-28T19:43:16.317Z

## Image Entry Points (9)

- **Admin lesson-from-image API** — `lib/api-handlers/admin/lesson-from-image.js`
- **Smart CMS image upload** — `lib/api-handlers/admin/smart-cms.js`
- **Instagram manual assist** — `lib/cms/instagram-manual-assist.mjs`
- **AI source pipeline** — `lib/cms/ai-source-pipeline.mjs`
- **URL import (OG images)** — `lib/cms/url-import-service.mjs`
- **Lesson intelligence extractors** — `lib/cms/lesson-intelligence/extractors/index.mjs`
- **Vision intelligence MKM** — `lib/majlis-knowledge-engine/vision-intelligence.mjs`
- **UI: Lesson import image** — `src/views/admin/LessonImportImagePage.tsx`
- **UI: Smart CMS** — `src/views/admin/SmartCmsSection.tsx`

## Claude Call Sites (28)

- `lib/ai/smart-extraction/field-definitions.mjs`
- `lib/ai/smart-extraction/monitoring.mjs`
- `lib/ai/smart-extraction/multi-provider-ai.mjs`
- `lib/ai/vision-provider-fallback.mjs`
- `lib/api/_security.mjs`
- `lib/api/anthropic-config.mjs`
- `lib/api-dispatch.mjs`
- `lib/api-handlers/admin/ai-status.js`
- `lib/api-handlers/assistant/health.js`
- `lib/api-handlers/assistant.js`
- `lib/api-handlers/fiqh-research-assistant.js`
- `lib/api-handlers/test-anthropic.js`
- `lib/api-handlers/transcribe.js`
- `lib/auto-content/auto-content-sync.mjs`
- `lib/autonomous-ai/observability.mjs`
- `lib/cms/lesson-extractor.mjs`
- `lib/cms/lesson-import-actions.mjs`
- `lib/content-engines/ai-extractors.mjs`
- `lib/env-config.mjs`
- `lib/fiqh-research-engine.mjs`
- `lib/governance/monitoring.mjs`
- `lib/knowledge-engine/ai-analyzer.mjs`
- `lib/majlis-knowledge-engine/self-healing.mjs`
- `lib/platform-health.mjs`
- `lib/reasoning-engine/answer.mjs`

## OpenAI Call Sites (25)

- `lib/ai/smart-extraction/multi-provider-ai.mjs`
- `lib/ai/vision-provider-fallback.mjs`
- `lib/auto-content/auto-content-sync.mjs`
- `lib/auto-content/auto-content-utils.mjs`
- `lib/auto-knowledge-engine/monitoring/rules.mjs`
- `lib/autonomous-ai/observability.mjs`
- `lib/autonomous-platform/dedup.mjs`
- `lib/autonomous-platform/monitoring.mjs`
- `lib/autonomous-platform/publisher.mjs`
- `lib/autonomous-platform/v3/infra-guides.mjs`
- `lib/autonomous-platform/v3/production-health.mjs`
- `lib/digital-learning/ai-lesson.mjs`
- `lib/env-config.mjs`
- `lib/global-reference/ai-assist.mjs`
- `lib/global-reference/dashboard.mjs`
- `lib/governance/monitoring.mjs`
- `lib/knowledge-engine/indexer.mjs`
- `lib/majlis-knowledge-engine/metrics.mjs`
- `lib/majlis-knowledge-engine/search-intelligence.mjs`
- `lib/majlis-knowledge-engine/self-healing.mjs`
- `lib/majlis-knowledge-engine/vision-intelligence.mjs`
- `lib/platform-health.mjs`
- `lib/release-gate.mjs`
- `lib/scholarly-verification/ai-suggest.mjs`
- `lib/service-guard.mjs`

## OCR Call Sites (31)

- `lib/ai/local-ocr.mjs`
- `lib/ai/smart-extraction/confidence-engine.mjs`
- `lib/ai/smart-extraction/decision-engine.mjs`
- `lib/ai/smart-extraction/monitoring.mjs`
- `lib/ai/smart-extraction/multi-provider-ai.mjs`
- `lib/ai/smart-extraction/pipeline.mjs`
- `lib/ai/smart-extraction/rule-engine.mjs`
- `lib/ai/smart-extraction/smart-ocr.mjs`
- `lib/ai/vision-provider-fallback.mjs`
- `lib/api-handlers/admin/ai-status.js`
- `lib/auto-knowledge-engine/quality-gate.mjs`
- `lib/auto-knowledge-engine/v2/extraction-service.mjs`
- `lib/cms/lesson-extractor-shared.mjs`
- `lib/cms/lesson-extractor.mjs`
- `lib/cms/lesson-import-actions.mjs`
- `lib/cms/lesson-intelligence/extractors/index.mjs`
- `lib/cms/publish-lesson.mjs`
- `lib/cms/url-import-service.mjs`
- `lib/content-pipeline/runner.mjs`
- `lib/majlis-knowledge-engine/config.mjs`

## Duplication (before refactor)

- lesson-extractor.mjs was calling Claude directly AND vision-provider-fallback (FIXED → smart pipeline only)
- local-ocr.mjs and rule-engine.mjs both had entity extraction regex (CONSOLIDATED → rule-engine primary)
- vision-intelligence.mjs duplicates lesson-extractor entry (LEGACY — still calls extractLessonFromImage)

## Latency Points

- Direct Claude vision call before OCR (REMOVED)
- Sequential enrich prompt after vision (REMOVED for rule-sufficient cases)
- Connector health batched 5/check (unchanged)
- Tesseract optional cold start (mitigated by rules-first path)

## Failure Points

- Anthropic billing exhaustion → manual review (handled)
- Missing API keys → rules/OCR/manual (handled)
- OCR empty on image-only without tesseract → AI or manual (handled)
- Invalid date → validation rejection (handled)

## New Pipeline

`lib/ai/smart-extraction/pipeline.mjs`

Image → Preprocess → OCR → Rule Engine → Confidence → Decision → AI (optional) → Validation → Publishing
