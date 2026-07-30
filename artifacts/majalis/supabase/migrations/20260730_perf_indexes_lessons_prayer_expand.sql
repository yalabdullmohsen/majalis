-- Performance indexes (EXPANSIVE / reversible). DO NOT apply from agents.
-- Owner applies manually after EXPLAIN on a non-production clone.
-- Rollback: DROP INDEX CONCURRENTLY IF EXISTS <name>;

BEGIN;

-- Upcoming / approved lessons by status + created_at (home lists)
CREATE INDEX IF NOT EXISTS idx_lessons_status_created_at
  ON public.lessons (status, created_at DESC);

-- City/day filtering for Kuwait/upcoming widgets
CREATE INDEX IF NOT EXISTS idx_lessons_status_city_day
  ON public.lessons (status, city, day_of_week);

-- Prayer times lookup by city + date
CREATE INDEX IF NOT EXISTS idx_prayer_times_city_date
  ON public.prayer_times (city, prayer_date);

COMMIT;

-- Rollback notes (run separately, not in same txn as CREATE on prod):
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_lessons_status_created_at;
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_lessons_status_city_day;
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_prayer_times_city_date;
