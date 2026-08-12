-- =====================================================================
--  AKP RLS Policies — verified_hadith_items + import/quality tables
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS / DROP POLICY IF EXISTS)
-- =====================================================================

-- ── verified_hadith_items ────────────────────────────────────────────
ALTER TABLE verified_hadith_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verified_hadith_public_read ON verified_hadith_items;
CREATE POLICY verified_hadith_public_read
  ON verified_hadith_items FOR SELECT
  USING (verification_status = 'verified');

DROP POLICY IF EXISTS verified_hadith_admin ON verified_hadith_items;
CREATE POLICY verified_hadith_admin
  ON verified_hadith_items FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── import_operations_log ────────────────────────────────────────────
ALTER TABLE import_operations_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS import_log_admin ON import_operations_log;
CREATE POLICY import_log_admin
  ON import_operations_log FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── knowledge_quality_reports ────────────────────────────────────────
ALTER TABLE knowledge_quality_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quality_reports_admin ON knowledge_quality_reports;
CREATE POLICY quality_reports_admin
  ON knowledge_quality_reports FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
