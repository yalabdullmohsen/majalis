-- Internal contact chat — threads, messages, attachments, audit
-- Idempotent. Apply via: apply-migrations?scope=contact-chat

CREATE TABLE IF NOT EXISTS contact_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text,
  guest_email text,
  subject text NOT NULL DEFAULT 'تواصل',
  message_type text NOT NULL DEFAULT 'أخرى' CHECK (message_type IN (
    'اقتراح', 'شكوى', 'بلاغ خطأ', 'تصحيح معلومة', 'طلب إضافة محتوى', 'مشكلة تقنية', 'أخرى'
  )),
  status text NOT NULL DEFAULT 'جديدة' CHECK (status IN (
    'جديدة', 'مفتوحة', 'بانتظار رد المستخدم', 'بانتظار رد الإدارة', 'مغلقة', 'مؤرشفة'
  )),
  priority text NOT NULL DEFAULT 'عادية' CHECK (priority IN ('منخفضة', 'عادية', 'عالية', 'حرجة')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  context_page_url text,
  context_page_type text,
  context_content_id text,
  context_content_title text,
  context_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  unread_user int NOT NULL DEFAULT 0,
  unread_admin int NOT NULL DEFAULT 0,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS contact_threads_access_token_idx ON contact_threads(access_token);
CREATE INDEX IF NOT EXISTS contact_threads_user_id_idx ON contact_threads(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contact_threads_status_idx ON contact_threads(status);
CREATE INDEX IF NOT EXISTS contact_threads_priority_idx ON contact_threads(priority);
CREATE INDEX IF NOT EXISTS contact_threads_message_type_idx ON contact_threads(message_type);
CREATE INDEX IF NOT EXISTS contact_threads_last_message_idx ON contact_threads(last_message_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES contact_threads(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('user', 'admin', 'system')),
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  is_internal boolean NOT NULL DEFAULT false,
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_thread_idx ON contact_messages(thread_id, created_at);

CREATE TABLE IF NOT EXISTS contact_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES contact_threads(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size int NOT NULL DEFAULT 0,
  storage_path text,
  data_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_attachments_message_idx ON contact_attachments(message_id);

CREATE TABLE IF NOT EXISTS contact_thread_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES contact_threads(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_thread_events_thread_idx ON contact_thread_events(thread_id, created_at DESC);

CREATE TABLE IF NOT EXISTS contact_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES contact_threads(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_internal_notes_thread_idx ON contact_internal_notes(thread_id, created_at DESC);

-- RLS
ALTER TABLE contact_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_thread_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_internal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_threads_service ON contact_threads;
CREATE POLICY contact_threads_service ON contact_threads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS contact_messages_service ON contact_messages;
CREATE POLICY contact_messages_service ON contact_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS contact_attachments_service ON contact_attachments;
CREATE POLICY contact_attachments_service ON contact_attachments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS contact_thread_events_service ON contact_thread_events;
CREATE POLICY contact_thread_events_service ON contact_thread_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS contact_internal_notes_service ON contact_internal_notes;
CREATE POLICY contact_internal_notes_service ON contact_internal_notes FOR ALL USING (true) WITH CHECK (true);
