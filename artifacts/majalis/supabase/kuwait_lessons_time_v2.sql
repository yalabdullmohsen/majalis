-- Lesson time integrity — prayer rank, normalized times, repair audit log
-- Run after kuwait_lessons_extend.sql

ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS prayer_rank TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS prayer_rank_override TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS time_period TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS time_repair_log JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS lessons_prayer_rank_idx ON lessons(prayer_rank);
CREATE INDEX IF NOT EXISTS lessons_start_time_idx ON lessons(start_time);

COMMENT ON COLUMN lessons.start_time IS 'Normalized 24h HH:MM (Asia/Kuwait)';
COMMENT ON COLUMN lessons.end_time IS 'Normalized end HH:MM when range specified';
COMMENT ON COLUMN lessons.prayer_rank IS 'Auto-classified prayer window (مرتبة الصلاة)';
COMMENT ON COLUMN lessons.prayer_rank_override IS 'Admin manual override — wins over prayer_rank';
COMMENT ON COLUMN lessons.time_period IS 'صباحاً or مساءً';
COMMENT ON COLUMN lessons.time_repair_log IS 'Audit trail of automatic time repairs';
