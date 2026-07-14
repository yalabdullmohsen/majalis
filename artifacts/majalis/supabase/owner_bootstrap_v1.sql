-- ملاحظة: يُستخدم الرمز __OWNER_EMAIL__ بدلًا من بريد المالك الفعلي حتى لا يُخزَّن بريد شخصي في المستودع.
-- قبل التشغيل استبدله ببريد المالك، أو مرِّر MAJALIS_OWNER_EMAILS لسكربت التطبيق ليستبدله تلقائيًا.
-- =====================================================================
--  Owner bootstrap v1 — permanent super admin / owner privileges
--  Run in Supabase SQL Editor after base schema.
-- =====================================================================

-- Extend legacy enum so profiles.role can store super_admin
-- (enum value added in owner_bootstrap_enum_v1.sql — separate transaction)

-- Owner privilege columns on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_is_owner ON profiles (is_owner) WHERE is_owner = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles (is_super_admin) WHERE is_super_admin = true;

-- is_admin() — used by RLS across the platform
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'super_admin')
        OR p.is_admin = true
        OR p.is_super_admin = true
        OR p.is_owner = true
      )
  )
  OR EXISTS (
    SELECT 1 FROM governance_user_roles g
    WHERE g.user_id = auth.uid()
      AND g.role_id IN ('super_admin', 'system_admin', 'content_manager')
  );
$$;

-- Prevent non-owners from demoting protected bootstrap owners
CREATE OR REPLACE FUNCTION protect_bootstrap_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_email TEXT;
  protected_emails TEXT[] := ARRAY['__OWNER_EMAIL__'];
BEGIN
  SELECT lower(trim(u.email)) INTO owner_email
  FROM auth.users u
  WHERE u.id = COALESCE(NEW.id, OLD.id);

  IF owner_email IS NOT NULL AND owner_email = ANY(protected_emails) THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete protected platform owner: %', owner_email;
    END IF;

    NEW.role := 'super_admin';
    NEW.is_admin := true;
    NEW.is_super_admin := true;
    NEW.is_owner := true;
    NEW.status := 'active';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_owner = true AND NEW.is_owner = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE p.id = auth.uid()
        AND (
          p.is_owner = true
          OR lower(trim(u.email)) = ANY(protected_emails)
        )
    ) THEN
      RAISE EXCEPTION 'Cannot demote a platform owner';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_bootstrap_owners ON profiles;
CREATE TRIGGER trg_protect_bootstrap_owners
  BEFORE UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_bootstrap_owners();

-- Strengthen role escalation guard to respect owners
CREATE OR REPLACE FUNCTION prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_owner = true OR NEW.is_super_admin = true OR NEW.role = 'super_admin' THEN
    RETURN NEW;
  END IF;

  IF NOT is_admin() AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;

  IF NOT is_admin() AND (
    NEW.is_admin IS DISTINCT FROM OLD.is_admin
    OR NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin
    OR NEW.is_owner IS DISTINCT FROM OLD.is_owner
  ) THEN
    NEW.is_admin := OLD.is_admin;
    NEW.is_super_admin := OLD.is_super_admin;
    NEW.is_owner := OLD.is_owner;
  END IF;

  RETURN NEW;
END;
$$;

-- One-shot promotion helper (run manually or via service role)
CREATE OR REPLACE FUNCTION promote_bootstrap_owner(target_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  protected_emails TEXT[] := ARRAY['__OWNER_EMAIL__'];
  normalized TEXT := lower(trim(target_email));
BEGIN
  IF normalized IS NULL OR normalized = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  IF NOT (normalized = ANY(protected_emails)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email_not_in_bootstrap_list');
  END IF;

  SELECT id INTO uid FROM auth.users WHERE lower(trim(email)) = normalized LIMIT 1;
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found', 'email', normalized);
  END IF;

  INSERT INTO profiles (id, full_name, role, is_admin, is_super_admin, is_owner, status)
  VALUES (
    uid,
    COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = uid), split_part(normalized, '@', 1)),
    'super_admin',
    true,
    true,
    true,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_admin = true,
    is_super_admin = true,
    is_owner = true,
    status = 'active';

  INSERT INTO governance_user_roles (user_id, role_id, assigned_by, assigned_at)
  VALUES (uid, 'super_admin', 'owner_bootstrap_sql', now())
  ON CONFLICT (user_id) DO UPDATE SET
    role_id = 'super_admin',
    assigned_by = 'owner_bootstrap_sql',
    assigned_at = now();

  RETURN jsonb_build_object('ok', true, 'user_id', uid, 'email', normalized);
END;
$$;

COMMENT ON FUNCTION promote_bootstrap_owner IS 'Promote a bootstrap owner email to super_admin with full privileges';
