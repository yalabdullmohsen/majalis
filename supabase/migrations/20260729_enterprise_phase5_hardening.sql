-- =====================================================================
-- Enterprise Phase 5 — Supabase hardening (MANUAL APPLY ONLY)
-- =====================================================================
-- DO NOT wire this file to CI push/bootstrap/cron.
-- Apply via Supabase SQL Editor or workflow_dispatch bootstrap after review.
--
-- Goals:
-- 1) Replace overly-permissive USING (true) policies on open_* tables
-- 2) Ensure hot-path indexes for lessons / registrations / content_views
-- 3) Keep RLS enabled on core public tables
-- =====================================================================

BEGIN;

-- ── Open platform policies: service_role only ─────────────────────────
DROP POLICY IF EXISTS "Service role open_api_keys" ON public.open_api_keys;
DROP POLICY IF EXISTS "Service role open_api_audit_logs" ON public.open_api_audit_logs;
DROP POLICY IF EXISTS "Service role open_webhooks" ON public.open_webhooks;
DROP POLICY IF EXISTS "Service role open_webhook_deliveries" ON public.open_webhook_deliveries;

CREATE POLICY "service_role_open_api_keys"
  ON public.open_api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_open_api_audit_logs"
  ON public.open_api_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_open_webhooks"
  ON public.open_webhooks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_open_webhook_deliveries"
  ON public.open_webhook_deliveries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Owners may read their own API keys (no secret plaintext assumed in row)
DROP POLICY IF EXISTS "owner_read_open_api_keys" ON public.open_api_keys;
CREATE POLICY "owner_read_open_api_keys"
  ON public.open_api_keys
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- NOTE: governance_v1.sql / islamic_intelligence_v1.sql / auto_engine_production_complete.sql
-- source definitions were corrected to TO service_role. Re-apply those files (or recreate
-- their service policies) on live DB after review — do not rely on silent CI migrate.

-- ── Hot filter indexes (idempotent) ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lessons_status_created
  ON public.lessons (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lessons_status_category_city
  ON public.lessons (status, category, city);

CREATE INDEX IF NOT EXISTS idx_lessons_sheikh_status
  ON public.lessons (sheikh_id, status);

CREATE INDEX IF NOT EXISTS idx_lesson_registrations_user
  ON public.lesson_registrations (user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_registrations_lesson
  ON public.lesson_registrations (lesson_id);

CREATE INDEX IF NOT EXISTS idx_content_views_lesson
  ON public.content_views (content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_fawaid_status_created
  ON public.fawaid (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);

COMMIT;
