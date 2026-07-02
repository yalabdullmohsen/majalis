-- ═══════════════════════════════════════════════════════════════════
-- نظام رفع المحتوى من المستخدمين — مع موافقة المشرف
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. الجدول الرئيسي ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_submissions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT        NOT NULL
                               CHECK (type IN ('adhan', 'lesson')),

  -- معلومات مقدّم الطلب
  submitter_name   TEXT        NOT NULL CHECK (char_length(submitter_name) BETWEEN 2 AND 100),
  submitter_email  TEXT,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- محتوى الطلب
  title            TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 300),
  description      TEXT        CHECK (char_length(description) <= 3000),
  file_url         TEXT,       -- رابط الملف بعد الرفع على Supabase Storage
  file_name        TEXT,       -- اسم الملف الأصلي
  file_size_kb     INTEGER,    -- حجم الملف بالكيلوبايت
  file_mime        TEXT,       -- MIME type

  -- بيانات إضافية حسب النوع (JSON)
  -- أذان:  { muezzin_style, country, origin, prayer_type, has_fajr }
  -- درس:   { sheikh, duration_min, topic, source_url }
  meta             JSONB       DEFAULT '{}',

  -- حالة المراجعة
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_note    TEXT,       -- ملاحظة المشرف للمستخدم
  reviewed_at      TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. الفهارس ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_submissions_status   ON user_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_submissions_type     ON user_submissions (type, status);
CREATE INDEX IF NOT EXISTS idx_user_submissions_user_id  ON user_submissions (user_id);

-- ── 3. Trigger تحديث updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_user_submissions_updated_at ON user_submissions;
CREATE TRIGGER trg_user_submissions_updated_at
  BEFORE UPDATE ON user_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 4. RLS ──────────────────────────────────────────────────────────
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

-- أي زائر يستطيع إرسال طلب
CREATE POLICY "anyone_can_submit"
  ON user_submissions FOR INSERT
  WITH CHECK (true);

-- المستخدم يرى طلباته فقط (إذا كان مسجلاً)
CREATE POLICY "user_sees_own"
  ON user_submissions FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IS NULL   -- يُعطل المجهولين من الاطلاع عبر هذه السياسة
  );

-- الأدمن يرى ويعدّل كل الطلبات
CREATE POLICY "admin_full_access"
  ON user_submissions FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ── 5. Supabase Storage Bucket (نفّذ يدوياً في لوحة التحكم) ──────────
-- CREATE BUCKET: user-submissions
-- الإعدادات:
--   public = false
--   file_size_limit = 50MB
--   allowed_mime_types = ['audio/*', 'video/*', 'application/pdf']
--
-- Storage Policy (INSERT) — المستخدمون يرفعون:
--   bucket_id = 'user-submissions'
--   WITH CHECK (true)              -- أي أحد (تُقيّد الـ API KEY)
--
-- Storage Policy (SELECT) — الأدمن يشاهد:
--   USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')))

-- ── 6. دالة مساعدة: إحصائيات الطلبات للأدمن ─────────────────────────
CREATE OR REPLACE FUNCTION get_submission_stats()
RETURNS TABLE (
  total         BIGINT,
  pending_count BIGINT,
  approved_count BIGINT,
  rejected_count BIGINT,
  adhan_count   BIGINT,
  lesson_count  BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COUNT(*)                                         AS total,
    COUNT(*) FILTER (WHERE status = 'pending')       AS pending_count,
    COUNT(*) FILTER (WHERE status = 'approved')      AS approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected')      AS rejected_count,
    COUNT(*) FILTER (WHERE type   = 'adhan')         AS adhan_count,
    COUNT(*) FILTER (WHERE type   = 'lesson')        AS lesson_count
  FROM user_submissions;
$$;
