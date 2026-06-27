# Majlis Autonomous Platform v2.0 — System Audit Report

**Date:** 2026-06-26  
**Engine:** Majlis Knowledge Engine (MKE) v1 → v2 upgrade path  
**Constraint:** Integrative extension only — no architecture rewrite

---

## 1. Executive Summary

The platform has **MKE v1** as the intended orchestration facade, but **six parallel automation stacks** still coexist (Phase 5/6 CMS, AKE v13, Reasoning Engine, Autonomous AI, AI Agents, Scholarly Intelligence). v2 consolidates intelligence layers **inside MKE** while delegating execution to existing engines.

| Area | Strength | Weakness |
|------|----------|----------|
| Source ingestion | 25+ declared types, DB plugin registry | YouTube/Telegram/X use WebConnector fallback |
| Vision/OCR | Claude Sonnet primary, entity heuristics | Google/OpenAI vision configured but not primary |
| Decision | Auto-publish gates + trust scoring | Single-stage decision; no weighted multi-score |
| Quality | Hadith markers, draft validation | No structured rejection reports table |
| Graph | kg_nodes/edges + graph-linker on publish | Not used for recommendations at scale |
| Search | FTS + optional pgvector embeddings | Degraded without OPENAI_API_KEY |
| Queue | DB-backed mke_queue_jobs | Handlers were stubs (notify, vision, graph) |
| Cron | 22 Vercel schedules | No self-heal on cron/connector failure |
| Admin | MKE dashboard + Phase 5/6 UIs | Overlapping dashboards, fragmented metrics |
| Notifications | In-app + Expo API server | MKE publish → push not wired |

---

## 2. Subsystem Inventory

### APIs (via `lib/api-dispatch.mjs`)
- **MKE:** `/api/admin/majlis-knowledge-engine`, `/api/cron/majlis-knowledge-engine`
- **Automation:** lesson-automation, smart-cms, source-monitor, lesson-intelligence
- **Knowledge:** auto-knowledge-engine, knowledge-pipeline, knowledge-reasoning, knowledge-search
- **Platform:** autonomous-ai, ai-agents, islamic-intelligence, governance, verified-knowledge

### Cron (vercel.json)
- MKE: `5,35 * * * *`
- Lesson intelligence + source monitor: `*/15 * * * *`
- AKE sync: `30 2 * * *`
- Autonomous orchestrator: `15 8 * * *`

### Database (automation-related)
- `mke_*` — MKE v1 audit (runs, decisions, vision, graph links, change log, quality flags, queue)
- `lesson_sources`, `lesson_import_drafts`, `lesson_intelligence_*` — Phase 6
- `knowledge_items`, `ake_job_queue` — AKE v13
- `kg_nodes`, `kg_edges` — Knowledge Graph Phase 4
- `automation_step_logs`, `lesson_automation_audit` — Phase 5

### AI Providers
- Anthropic Claude (vision/OCR primary)
- OpenAI (embeddings, optional)
- No automatic provider failover before v2

---

## 3. Bottlenecks

1. **60s Vercel function limit** — long source scans block completion
2. **Sequential source processing** in orchestrator
3. **No Redis** — all queues are PostgreSQL polling
4. **Duplicate orchestrators** — cron overlap between MKE, lesson-intelligence, AKE
5. **Manual SQL migrations** — schema drift risk across envs

---

## 4. Duplication & Dead Code

| Duplicate | Locations |
|-----------|-----------|
| Source lists | lesson_sources, trusted_sources, mke_source_plugins |
| Quality gates | MKE quality-control, AKE quality-gate, auto-publish-engine |
| Search | knowledge-search, intelligent-search, scholarly-search, open-platform v1/v2/v3 |
| Admin UIs | MKE page, AutomationDashboard, AutomationCenter, KnowledgeEngineSection (AKE) |

**Unused / partial:** `mke_queue_jobs` vision/graph handlers (stub), `lesson-source-monitor` cron not in vercel.json

---

## 5. Technical Debt

- Drizzle schema empty; all runtime via Supabase client
- Local dev server missing MKE routes (Vercel-only dispatch)
- `MAJALIS_AUTO_PUBLISH=0` kill switch forces human review
- Embedding stub in dedup engine
- No formal self-healing module

---

## 6. v2 Remediation Plan (This PR)

| Intelligence Layer | v2 Module | Action |
|--------------------|-----------|--------|
| Source Intelligence | source-registry (extended) + v2 SQL | DB-only new sources |
| Discovery Intelligence | `discovery-intelligence.mjs` | Priority queue + adaptive crawl |
| Vision Intelligence 2 | `vision-intelligence-v2.mjs` | Extended fields + validation |
| Quality Intelligence | `quality-engine.mjs` | Structured rejection reports |
| Decision Intelligence | `decision-engine-v2.mjs` | Multi-stage weighted scores |
| Publishing Intelligence | publish-pipeline (unchanged) | Queue handlers wired |
| Monitoring Intelligence | `monitoring-intelligence.mjs` | Unified health |
| Self Healing | `self-healing.mjs` | Cron/queue/connector/AI failover |
| Search Intelligence | `search-intelligence.mjs` | Semantic wrapper |
| Recommendations | `recommendation-engine.mjs` | Graph-based suggestions |
| Notifications | `notification-platform.mjs` | Multi-channel jobs |

---

## 7. Performance Targets (v2)

| Metric | Target | v2 Approach |
|--------|--------|-------------|
| TTFB | <150ms | Request-time cache hints, lazy admin metrics |
| Lighthouse | >95 | Existing Vite split; no blocking cron in user path |
| DB load | Low | Batch limits, adaptive crawl intervals |
| Queue | Optimized | Priority ordering, parallel batch (concurrency cap) |

---

## 8. Security (v2 additions)

- Audit log table for self-heal actions
- Webhook signature verification helper
- Rate limit hooks on admin MKE actions (existing admin-auth)
- Structured quality rejection (no publish on blocker)

---

*This document is the internal audit required before v2 implementation. All v2 code extends `lib/majlis-knowledge-engine/` without replacing v1 modules.*
