# Global Knowledge Engine (GKE)

**Version:** 1.0.0 · **Phase:** 1 (Architecture)

Central knowledge layer for Majalis Al-Ilm — transforms the platform into a scalable global knowledge system without duplicating existing AKE/MKE/CMS infrastructure.

## Principles

- Architecture First
- Single Source of Truth (`knowledge_items` + CMS tables)
- Zero Duplication (delegates to existing modules)
- Event Driven (`events.mjs`)
- AI Assisted (classification only — no fabrication)
- Modular layers — each independent

## Pipeline Flow

```
External Sources
       ↓
Source Registry      ← Phase 2
       ↓
Fetch Engine         ← Phase 3
       ↓
Parser Engine
       ↓
Normalization Engine
       ↓
AI Classification    ← Phase 4
       ↓
Deduplication        ← Phase 5
       ↓
Quality Engine
       ↓
Review Queue
       ↓
Smart CMS            ← Phase 6
       ↓
Search Index         ← Phase 7
       ↓
Frontend
```

## Directory Structure

```
lib/global-knowledge-engine/
  config.mjs          — version, layers, delegates
  types.mjs           — JSDoc contracts
  events.mjs          — event bus
  pipeline.mjs        — layer order + validation
  orchestrator.mjs    — central orchestrator
  monitoring.mjs      — health dashboard
  layers/             — independent layer modules
  adapters/           — bridges to AKE/MKE/CMS/search
  index.mjs           — public API
```

## Delegates (no duplication)

| GKE Layer | Existing Module |
|-----------|-----------------|
| Fetch | `auto-knowledge-engine/connectors` |
| Parse/Normalize | `content-pipeline/stages` |
| AI | `knowledge-engine/ai-analyzer` |
| Dedup | `auto-knowledge-engine/v2/unified-dedup` |
| Quality | `auto-knowledge-engine/quality-gate` |
| CMS | `knowledge-engine/publisher` + `cms/content-registry` |
| Search | `knowledge-engine/indexer` + `scholarly-intelligence` |
| Orchestration | AKE continuous cycle + MKE orchestrator |

## Admin

- Dashboard: `/admin/knowledge-engine`
- API: `GET/POST /api/admin/global-knowledge-engine?action=dashboard`

## Phase Roadmap

1. ✅ Architecture (this phase)
2. Source Registry — unify `ake_connectors`, `lesson_sources`, `mke_source_plugins`
3. Fetch Engine — connector plugin registry
4. Quality Engine — full scoring + review queue
5. Dedup Engine — semantic similarity
6. Smart CMS Integration — auto-routing
7. Knowledge Search Integration — central index
8. Automation & Monitoring — orchestrator workers

## Usage

```js
import { getDashboard, runPipelineDryRun, validateArchitecture } from "./global-knowledge-engine/index.mjs";

const dashboard = await getDashboard();
const dryRun = await runPipelineDryRun({ title: "درس الزكاة", content_kind: "lesson" });
```
