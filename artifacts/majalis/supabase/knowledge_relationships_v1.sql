-- Knowledge Relationships v1
-- Simple polymorphic relationship table linking existing content
-- (sheikhs, lessons, library_items, fatwas, fawaid, quiz_questions)
-- All relationships require admin verification before display.

CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('scholar','lesson','book','fatwa','fawaid','question')),
  source_id   TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('scholar','lesson','book','fatwa','fawaid','question')),
  target_id   TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'شيخ_تلميذ',
    'مؤلف_كتاب',
    'شرح_لكتاب',
    'فتوى_في_باب',
    'درس_عن_كتاب',
    'مرتبط'
  )),
  label         TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  source_reference TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, target_type, target_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_kr_source ON knowledge_relationships(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_kr_target ON knowledge_relationships(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_kr_verified ON knowledge_relationships(is_verified);
CREATE INDEX IF NOT EXISTS idx_kr_rel_type ON knowledge_relationships(relationship_type);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_kr_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_kr_updated_at ON knowledge_relationships;
CREATE TRIGGER trg_kr_updated_at
  BEFORE UPDATE ON knowledge_relationships
  FOR EACH ROW EXECUTE FUNCTION set_kr_updated_at();

-- RLS: public read for verified, admin write
ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kr_public_read ON knowledge_relationships;
CREATE POLICY kr_public_read ON knowledge_relationships
  FOR SELECT USING (is_verified = true);

DROP POLICY IF EXISTS kr_admin_all ON knowledge_relationships;
CREATE POLICY kr_admin_all ON knowledge_relationships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','super_admin')
    )
  );

SELECT count(*) AS total_relationships FROM knowledge_relationships;
