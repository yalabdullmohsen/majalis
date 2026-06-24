-- =====================================================================
--  مجالس العلم — المفضلة، التقييمات، البلاغات، الإشعارات، المشاهدات
--  نفّذ في Supabase SQL Editor
-- =====================================================================

-- المفضلة
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('lesson','book','benefit','qa','scholar')),
  content_id UUID NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_bookmarks" ON bookmarks;
CREATE POLICY "users_own_bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- التقييمات والإبلاغ
CREATE TABLE IF NOT EXISTS content_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_ratings" ON content_ratings;
CREATE POLICY "users_own_ratings" ON content_ratings FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL,
  content_id UUID,
  report_type TEXT CHECK (report_type IN ('خطأ_علمي','خطأ_إملائي','محتوى_غير_لائق','رابط_مكسور','أخرى')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_submit_reports" ON error_reports;
DROP POLICY IF EXISTS "admin_view_reports" ON error_reports;
DROP POLICY IF EXISTS "admin_manage_reports" ON error_reports;
CREATE POLICY "users_submit_reports" ON error_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_view_reports" ON error_reports FOR SELECT USING (is_admin());
CREATE POLICY "admin_manage_reports" ON error_reports FOR UPDATE USING (is_admin());

-- الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','lesson','qa','system','alert')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_notifications" ON notifications;
CREATE POLICY "users_own_notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- إحصائيات مشاهدات المحتوى
CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_insert_views" ON content_views;
DROP POLICY IF EXISTS "admin_read_views" ON content_views;
CREATE POLICY "anyone_insert_views" ON content_views FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_views" ON content_views FOR SELECT USING (is_admin());
