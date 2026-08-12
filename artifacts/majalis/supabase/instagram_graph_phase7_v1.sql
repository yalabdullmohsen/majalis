-- Phase 7 — Instagram Graph API source linking (config on trusted sources)
-- Uses env vars for secrets; per-source handle + optional instagram_business_account_id in config JSONB.

COMMENT ON COLUMN trusted_content_sources.config IS 'JSONB: handle, instagram_business_account_id, website_url, source_subtype';

-- Example per-source link:
-- UPDATE trusted_content_sources SET config = config || '{"instagram_business_account_id":"178414..."}'::jsonb
-- WHERE url = 'https://instagram.com/alshalahi_masjid';
