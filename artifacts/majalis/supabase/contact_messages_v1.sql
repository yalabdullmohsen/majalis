-- Contact form messages — public submit, admin review
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT 'استفسار عام',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  user_id uuid,
  ip_hash text,
  user_agent text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public can insert only (via service role API)
CREATE POLICY contact_messages_insert_anon ON contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Admins read/update via service role only (no direct client access)
CREATE POLICY contact_messages_admin_all ON contact_messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
