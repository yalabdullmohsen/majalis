-- Add image_url column for sheikh profile photos
ALTER TABLE sheikhs
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Public storage bucket for sheikh photos (admin upload from dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('sheikhs', 'sheikhs', true, 5242880)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_sheikh_images" ON storage.objects;
CREATE POLICY "public_read_sheikh_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'sheikhs');

DROP POLICY IF EXISTS "admin_upload_sheikh_images" ON storage.objects;
CREATE POLICY "admin_upload_sheikh_images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sheikhs' AND is_admin());

DROP POLICY IF EXISTS "admin_update_sheikh_images" ON storage.objects;
CREATE POLICY "admin_update_sheikh_images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'sheikhs' AND is_admin());

DROP POLICY IF EXISTS "admin_delete_sheikh_images" ON storage.objects;
CREATE POLICY "admin_delete_sheikh_images" ON storage.objects
  FOR DELETE USING (bucket_id = 'sheikhs' AND is_admin());
