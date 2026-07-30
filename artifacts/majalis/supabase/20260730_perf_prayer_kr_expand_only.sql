-- EXPAND-ONLY — do NOT apply from agents / runtime.
-- Owner applies on a clone after EXPLAIN (ANALYZE, BUFFERS), then Production with approval.
--
-- Background (Production symptoms):
--   prayer_times lookups by (city, governorate, date) ~3–4s
--   knowledge_relationships verified OR source/target scans ~3–4s
--
-- Prior drafts used nonexistent column prayer_date — DO NOT recreate that mistake.

-- ── Expected EXPLAIN (before) ─────────────────────────────────────────────
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT date, fajr, sunrise, dhuhr, asr, maghrib, isha
-- FROM public.prayer_times
-- WHERE city = 'الكويت' AND governorate = 'العاصمة' AND date = CURRENT_DATE;
-- Expect: Seq Scan or wrong index → high buffers read.
--
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT id FROM public.knowledge_relationships
-- WHERE is_verified = true
--   AND (
--     (source_type = 'lesson' AND source_id = 'x')
--     OR (target_type = 'lesson' AND target_id = 'x')
--   )
-- LIMIT 20;
-- Expect: Seq Scan / Bitmap without verified composites on large tables.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prayer_times_city_gov_date
  ON public.prayer_times (city, governorate, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kr_verified_source
  ON public.knowledge_relationships (is_verified, source_type, source_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kr_verified_target
  ON public.knowledge_relationships (is_verified, target_type, target_id);

-- ── Expected EXPLAIN (after) ──────────────────────────────────────────────
-- prayer_times: Index Scan / Index Only Scan using idx_prayer_times_city_gov_date
--   (or unique constraint if present on the same columns)
-- knowledge_relationships: BitmapOr / Index Scan on idx_kr_verified_source|target
