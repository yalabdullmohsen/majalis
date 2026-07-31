-- Performance indexes (EXPANSIVE / reversible). DO NOT apply from agents.
-- Owner applies manually after EXPLAIN on a non-production clone.
-- Rollback: DROP INDEX CONCURRENTLY IF EXISTS <name>;
--
-- Fixed 2026-07-31: prayer_times uses column `date` (not `prayer_date`).

-- Prefer CREATE INDEX CONCURRENTLY outside a transaction on production.

-- Upcoming / approved lessons by status + created_at (home lists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_status_created_at
  ON public.lessons (status, created_at DESC);

-- City/day filtering for Kuwait/upcoming widgets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_status_city_day
  ON public.lessons (status, city, day_of_week);

-- Prayer times lookup by city + governorate + date (matches API filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prayer_times_city_gov_date
  ON public.prayer_times (city, governorate, date);

-- Rollback notes:
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_lessons_status_created_at;
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_lessons_status_city_day;
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_prayer_times_city_gov_date;
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_prayer_times_city_date; -- legacy bad name if ever applied
