-- =====================================================================
--  مجالس العلم — جدول تفريغ المحاضرات (transcriptions)
--  نفّذ في Supabase SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT CHECK (file_type IN ('audio', 'video', 'youtube')),
  source_url TEXT,
  transcript_text TEXT,
  summary TEXT,
  benefits JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'error')),
  duration_seconds INT,
  language TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_transcriptions" ON transcriptions;
CREATE POLICY "users_own_transcriptions" ON transcriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_transcriptions" ON transcriptions;
CREATE POLICY "admin_all_transcriptions" ON transcriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Storage bucket للملفات الصوتية/المرئية ──
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('transcriptions', 'transcriptions', false, 524288000)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 524288000;

DROP POLICY IF EXISTS "users_upload_own_transcriptions" ON storage.objects;
CREATE POLICY "users_upload_own_transcriptions" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'transcriptions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_read_own_transcriptions" ON storage.objects;
CREATE POLICY "users_read_own_transcriptions" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'transcriptions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_delete_own_transcriptions" ON storage.objects;
CREATE POLICY "users_delete_own_transcriptions" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'transcriptions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
