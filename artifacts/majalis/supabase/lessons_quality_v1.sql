-- Lesson Quality Fields Migration v1
-- Adds completeness_score and missing_fields to lessons table.

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS completeness_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missing_fields     TEXT[]      DEFAULT '{}';

-- Index for filtering incomplete lessons from admin panel
CREATE INDEX IF NOT EXISTS idx_lessons_completeness
  ON lessons (completeness_score)
  WHERE completeness_score IS NOT NULL;

-- Backfill completeness score for existing rows using SQL expression.
-- Fields weighted: title(req) + speaker(0.2) + mosque(0.2) + day(0.2) + time(0.15) + category(0.1) + city(0.15)
-- Max = 1.0 if all present.
UPDATE lessons SET
  completeness_score = (
    CASE WHEN title IS NOT NULL AND title <> '' THEN 0 ELSE 0 END
    + CASE WHEN speaker_name IS NOT NULL AND speaker_name <> '' THEN 0.2 ELSE 0 END
    + CASE WHEN mosque      IS NOT NULL AND mosque <> ''       THEN 0.2 ELSE 0 END
    + CASE WHEN day_of_week IS NOT NULL AND day_of_week <> '' THEN 0.2 ELSE 0 END
    + CASE WHEN lesson_time IS NOT NULL AND lesson_time <> '' THEN 0.15 ELSE 0 END
    + CASE WHEN category    IS NOT NULL AND category <> ''    THEN 0.1  ELSE 0 END
    + CASE WHEN city        IS NOT NULL AND city <> ''        THEN 0.15 ELSE 0 END
  ),
  missing_fields = ARRAY_REMOVE(ARRAY[
    CASE WHEN speaker_name IS NULL OR speaker_name = '' THEN 'speaker_name' END,
    CASE WHEN mosque       IS NULL OR mosque = ''       THEN 'mosque'       END,
    CASE WHEN day_of_week  IS NULL OR day_of_week = ''  THEN 'day_of_week'  END,
    CASE WHEN lesson_time  IS NULL OR lesson_time = ''  THEN 'lesson_time'  END,
    CASE WHEN category     IS NULL OR category = ''     THEN 'category'     END,
    CASE WHEN city         IS NULL OR city = ''         THEN 'city'         END
  ], NULL)
WHERE completeness_score = 0 OR completeness_score IS NULL;
