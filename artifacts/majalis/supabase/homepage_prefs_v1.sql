-- ═══════════════════════════════════════════════════════════════════════════
-- تفضيلات تخصيص الصفحة الرئيسية — صف واحد لكل مستخدم (upsert on user_id)
-- نفس نمط user_learning_plans (smart_learning_v2.sql). قابل للتشغيل المتكرر.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_homepage_prefs (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_order   JSONB NOT NULL DEFAULT '[]',
  hidden_widgets JSONB NOT NULL DEFAULT '[]',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_homepage_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_homepage_prefs_own ON user_homepage_prefs;
CREATE POLICY user_homepage_prefs_own ON user_homepage_prefs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
