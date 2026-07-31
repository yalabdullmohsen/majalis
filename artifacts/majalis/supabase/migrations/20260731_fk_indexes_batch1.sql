-- =============================================================================
-- 20260731_fk_indexes_batch1.sql
-- REVIEW / OWNER APPLY ONLY — دفعة صغيرة من فهارس FK الناقصة عالية الأثر.
-- استخدم CREATE INDEX CONCURRENTLY خارج معاملة على Production.
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_bookmarks_lesson_id
  ON public.lesson_bookmarks (lesson_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_lesson_id
  ON public.lesson_progress (lesson_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_background_job_attempts_job_id
  ON public.background_job_attempts (job_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prayer_times_city_gov_date
  ON public.prayer_times (city, governorate, date);

-- Rollback:
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_lesson_bookmarks_lesson_id;
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_lesson_progress_lesson_id;
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_background_job_attempts_job_id;
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_prayer_times_city_gov_date;
