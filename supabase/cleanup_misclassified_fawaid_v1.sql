-- Remove quiz/QA/test rows misclassified as fawaid (benefits).
-- Run in Supabase SQL Editor after reviewing counts.

-- Preview count
SELECT count(*) AS bad_rows
FROM fawaid
WHERE text ~ '\[import-[0-9]+\]\s*$'
   OR (
     text ~ '^فائدة:\s'
     AND text ~ ' — (من|ما|في|إلى|كم|أين|متى|هل)\s'
     AND text ~ '؟'
   )
   OR text ~* '\m(e2e|mock|placeholder|quiz|test data)\M';

-- Delete misclassified rows
DELETE FROM fawaid
WHERE text ~ '\[import-[0-9]+\]\s*$'
   OR (
     text ~ '^فائدة:\s'
     AND text ~ ' — (من|ما|في|إلى|كم|أين|متى|هل)\s'
     AND text ~ '؟'
   )
   OR text ~* '\m(e2e|mock|placeholder|quiz|test data)\M';
