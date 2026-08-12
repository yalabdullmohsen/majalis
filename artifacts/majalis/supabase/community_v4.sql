-- ═══════════════════════════════════════════════════════════════
--  المرحلة 4 — مجتمع وتفاعل
--  community_v4.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── متابعة العلماء ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scholar_follows (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sheikh_id   UUID        NOT NULL,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sheikh_id)
);

CREATE INDEX IF NOT EXISTS idx_scholar_follows_sheikh
  ON scholar_follows (sheikh_id);

ALTER TABLE scholar_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sf_own ON scholar_follows;
CREATE POLICY sf_own ON scholar_follows
  FOR ALL USING (auth.uid() = user_id);

-- ─── جلسات الدراسة ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INT        NOT NULL,
  goal            TEXT,
  completed       BOOLEAN     NOT NULL DEFAULT true,
  session_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date
  ON study_sessions (user_id, session_date DESC);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ss_own ON study_sessions;
CREATE POLICY ss_own ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ─── الوضع العائلي ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_links (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_code TEXT        NOT NULL UNIQUE,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','active','revoked')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_links_parent  ON family_links (parent_id);
CREATE INDEX IF NOT EXISTS idx_family_links_child   ON family_links (child_id);
CREATE INDEX IF NOT EXISTS idx_family_links_code    ON family_links (invite_code);

ALTER TABLE family_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fl_parent ON family_links;
CREATE POLICY fl_parent ON family_links
  FOR ALL USING (auth.uid() = parent_id OR auth.uid() = child_id);
