# Majalis Enterprise Governance — Technical Documentation

Generated: 2026-06-26T01:09:15.355Z

## Architecture

Monorepo with artifacts/majalis as deployable app; Supabase Postgres + Vercel serverless

### Layers
- **Frontend** (`src/`) — React + Vite + Wouter
- **API** (`api/`) — Vercel serverless + Express dev server
- **Business Logic** (`lib/`) — 
- **Database** (`supabase/`) — 
- **CMS** (`src/lib/cms/`) — 15 content kinds

## RBAC Roles
- **مدير عام** (`super_admin`): *
- **مدير النظام** (`system_admin`): system.*, users.manage, audit.read, backup.*, cron.run, security.*
- **مدير المحتوى** (`content_manager`): content.*, lifecycle.*, publish, archive, import, analytics.read
- **مراجع علمي** (`scientific_reviewer`): review.scientific, review.approve, review.reject, content.read, audit.read
- **محرر** (`editor`): content.edit, content.create, lifecycle.submit, review.editorial, content.read
- **مؤلف** (`author`): content.create, content.edit_own, lifecycle.draft, content.read
- **مترجم** (`translator`): content.translate, content.edit_own, lifecycle.draft, content.read
- **مشرف** (`moderator`): content.moderate, review.editorial, content.read, users.read
- **عارض التحليلات** (`analytics_viewer`): analytics.read, monitoring.read, content.read
- **قراءة فقط** (`read_only`): content.read, audit.read

## Content Lifecycle
1. مسودة (`draft`)
2. معالجة AI (`ai_processing`) [auto]
3. التحقق من المصدر (`source_verification`) [auto]
4. مراجعة تحريرية (`editorial_review`)
5. مراجعة علمية (`scientific_review`)
6. اعتماد (`approval`)
7. نشر (`publish`)
8. مراجعة دورية (`scheduled_review`) [auto]
9. أرشفة (`archive`)

## Cron Jobs
- `/api/cron/sync-data` — daily
- `/api/cron/autonomous-orchestrator` — every 6h
- `/api/cron/islamic-intelligence` — daily
- `/api/cron/global-reference-review` — weekly
- `/api/cron/governance-backup` — weekly
- `/api/cron/apply-migrations` — weekly
- `/api/cron/scholarly-verification` — daily

## Security Policies
- All write operations require RBAC permission check
- No religious text generation by AI
- API keys hashed SHA-256
- Cron protected by CRON_SECRET
- RLS on all governance tables
- Audit log for every governance action
