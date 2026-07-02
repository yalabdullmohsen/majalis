-- =====================================================================
--  دوال مساعدة لنظام التوصيات (recommendations_functions_v1.sql)
-- =====================================================================

-- دالة upsert_user_interest: تحديث نقطة اهتمام مستخدم بشكل ذري
CREATE OR REPLACE FUNCTION upsert_user_interest(
  p_user_id UUID,
  p_tag_id  UUID,
  p_delta   NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_interest_profiles (user_id, tag_id, interest_score, event_count, last_updated)
  VALUES (p_user_id, p_tag_id, GREATEST(0, p_delta), 1, now())
  ON CONFLICT (user_id, tag_id) DO UPDATE
    SET interest_score = GREATEST(0, user_interest_profiles.interest_score + p_delta),
        event_count    = user_interest_profiles.event_count + 1,
        last_updated   = now();
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION upsert_user_interest TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_interest TO service_role;
GRANT EXECUTE ON FUNCTION get_related_content   TO anon;
GRANT EXECUTE ON FUNCTION get_related_content   TO authenticated;
GRANT EXECUTE ON FUNCTION get_similar_users     TO authenticated;
GRANT EXECUTE ON FUNCTION get_similar_users     TO service_role;
