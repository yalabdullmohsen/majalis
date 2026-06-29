-- CMS Platform v6 — admin notifications for Smart CMS hub
CREATE TABLE IF NOT EXISTS cms_admin_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL CHECK (type IN (
    'new_content', 'import_failed', 'duplicate_detected',
    'cron_completed', 'cron_failed', 'review_needed'
  )),
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  content_kind  TEXT,
  record_id     UUID,
  metadata      JSONB NOT NULL DEFAULT '{}',
  read          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cms_admin_notifications_unread_idx
  ON cms_admin_notifications (read, created_at DESC);

ALTER TABLE cms_admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cms_admin_notifications_admin ON cms_admin_notifications;
CREATE POLICY cms_admin_notifications_admin ON cms_admin_notifications
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON TABLE cms_admin_notifications IS 'تنبيهات لوحة إدارة المحتوى الذكية';
