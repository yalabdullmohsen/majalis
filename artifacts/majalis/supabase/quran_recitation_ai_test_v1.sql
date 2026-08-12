-- ═══════════════════════════════════════════════════════════════════════════
--  اختبار التسميع بالذكاء الاصطناعي — quran_recitation_ai_test_v1.sql
--  ميزة خلف Feature Flag "quran_recitation_ai_test" (معطّل افتراضيًا في
--  الإنتاج — راجع src/lib/feature-flags.ts). هذه الهجرة إضافية بحتة: لا
--  تُعدّل أي جدول قائم، ولا تمسّ نص القرآن (يبقى مصدره public/data/quran/
--  عبر src/lib/quran-api.ts دون تغيير).
--
--  خصوصية: لا يُخزَّن أي صوت هنا إطلاقًا. الحقول النصية (expected_norm/
--  heard_norm) تخزّن الصور المطبَّعة (بعد إزالة التشكيل) لأغراض التقرير
--  فقط، لا النص القرآني المعروض (يُجلب دومًا من المصدر الموثَّق).
--
--  مراجعة المقاطع (SM-2): لا يُنشأ جدول مراجعة منفصل — يُعاد استخدام
--  flashcard_reviews القائم (card_type='quran_recitation_segment' جديد؛
--  العمود TEXT بلا CHECK constraint فيقبل القيمة الجديدة بلا هجرة إضافية)
--  عبر src/lib/spaced-repetition.ts (sm2) القائم أصلًا، بلا نظام موازٍ.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── جلسات التسميع ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recitation_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  range_type       TEXT        NOT NULL CHECK (range_type IN ('surah','ayah_range','page','juz','hizb','rub')),
  surah_number     INT,
  ayah_from        INT,
  ayah_to          INT,
  page_number      INT,
  juz_number       INT,
  mode             TEXT        NOT NULL CHECK (mode IN ('full_hide','assisted','word_follow','interactive_mushaf','teacher_test')),
  precision_level  TEXT        NOT NULL DEFAULT 'hifz' CHECK (precision_level IN ('hifz','tajweed')),
  provider_id      TEXT        NOT NULL,  -- 'on-device' | 'server' | 'mock'
  alert_level      TEXT        NOT NULL DEFAULT 'gentle' CHECK (alert_level IN ('gentle','medium','immediate')),
  duration_seconds INT         NOT NULL DEFAULT 0,
  verses_count     INT         NOT NULL DEFAULT 0,
  words_total      INT         NOT NULL DEFAULT 0,
  words_correct    INT         NOT NULL DEFAULT 0,
  accuracy_pct     NUMERIC(5,2),
  tajweed_score    NUMERIC(5,2),          -- NULL دومًا ما لم يُفعَّل مستوى الإتقان بمزود قادر فعليًا
  confidence_pct   NUMERIC(5,2),
  hints_used       INT         NOT NULL DEFAULT 0,
  status           TEXT        NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned','queued_offline')),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recitation_sessions_user
  ON recitation_sessions (user_id, started_at DESC);

ALTER TABLE recitation_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rs_own ON recitation_sessions;
CREATE POLICY rs_own ON recitation_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ─── أخطاء/ملاحظات كل جلسة ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recitation_errors (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID        NOT NULL REFERENCES recitation_sessions(id) ON DELETE CASCADE,
  ayah_key       TEXT        NOT NULL,   -- "surah:ayah" مثال "2:255"
  word_index     INT         NOT NULL,
  error_type     TEXT        NOT NULL CHECK (error_type IN
                   ('wrong_word','missing_word','extra_word','out_of_order',
                    'wrong_ayah_jump','repetition','long_pause','wrong_start')),
  -- النصان أدناه مطبَّعان (بلا تشكيل) لغرض عرض تقرير المقارنة فقط —
  -- لا يُستخدَمان كبديل لنص القرآن المعروض في أي مكان آخر من المنصة.
  expected_norm  TEXT,
  heard_norm     TEXT,
  confidence_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_tajweed     BOOLEAN     NOT NULL DEFAULT false,
  tajweed_rule   TEXT,        -- مثال: 'madd_lazim' | 'ghunnah' | 'idgham' ... (NULL لأخطاء الحفظ)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recitation_errors_session
  ON recitation_errors (session_id);
CREATE INDEX IF NOT EXISTS idx_recitation_errors_ayah
  ON recitation_errors (ayah_key);

ALTER TABLE recitation_errors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS re_own ON recitation_errors;
CREATE POLICY re_own ON recitation_errors
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM recitation_sessions WHERE id = session_id)
  );

-- ─── تفضيلات المستخدم المحفوظة (آخر إعداد) ───────────────────────────────
CREATE TABLE IF NOT EXISTS recitation_settings (
  user_id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_mode      TEXT        NOT NULL DEFAULT 'word_follow',
  precision_level   TEXT        NOT NULL DEFAULT 'hifz',
  alert_level       TEXT        NOT NULL DEFAULT 'gentle',
  hint_style        TEXT        NOT NULL DEFAULT 'progressive' CHECK (hint_style IN ('progressive','off')),
  reveal_granularity TEXT       NOT NULL DEFAULT 'word' CHECK (reveal_granularity IN ('word','ayah')),
  save_recordings   BOOLEAN     NOT NULL DEFAULT false,
  show_error_count  BOOLEAN     NOT NULL DEFAULT true,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recitation_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rset_own ON recitation_settings;
CREATE POLICY rset_own ON recitation_settings
  FOR ALL USING (auth.uid() = user_id);

-- ─── طابور التحليل المؤجَّل (بلا اتصال أثناء الجلسة) ─────────────────────
-- بنفس نمط ake_job_queue القائم (status/attempts/scheduled_at/result JSONB)
-- لكن بصلاحية مستخدم مالك لا مشرف فقط. لا صوت يُخزَّن هنا: audio_ref يشير
-- لملف مؤقت على الجهاز نفسه (IndexedDB) لا Supabase Storage.
CREATE TABLE IF NOT EXISTS recitation_deferred_jobs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    UUID        REFERENCES recitation_sessions(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  attempts      INT         NOT NULL DEFAULT 0,
  last_error    TEXT,
  result        JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recitation_deferred_jobs_user
  ON recitation_deferred_jobs (user_id, status);

ALTER TABLE recitation_deferred_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rdj_own ON recitation_deferred_jobs;
CREATE POLICY rdj_own ON recitation_deferred_jobs
  FOR ALL USING (auth.uid() = user_id);
