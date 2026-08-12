-- Security hardening (apply in Supabase SQL Editor)

-- Prevent non-admins from changing their own role to admin
CREATE OR REPLACE FUNCTION prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_role_escalation();

-- Sheikh images: restrict extensions on upload
DROP POLICY IF EXISTS "admin_upload_sheikh_images" ON storage.objects;
CREATE POLICY "admin_upload_sheikh_images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'sheikhs'
    AND is_admin()
    AND (storage.extension(name) IN ('png', 'jpg', 'jpeg', 'webp'))
  );

DROP POLICY IF EXISTS "admin_update_sheikh_images" ON storage.objects;
CREATE POLICY "admin_update_sheikh_images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'sheikhs' AND is_admin());
