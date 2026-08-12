-- ═══════════════════════════════════════════════════════════════════════════
-- ربط عنصر التعلم من نوع "assessment" بسجل assessments المحدَّد له —
-- كانت learning_items.item_type يمكن أن يكون 'assessment' بلا أي طريقة
-- لمعرفة أي سجل assessments بالتحديد يخصّه. إضافة آمنة (عمود جديد قابل للـ
-- NULL، لا يمس بيانات موجودة).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE learning_items
  ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_learning_items_assessment ON learning_items(assessment_id) WHERE assessment_id IS NOT NULL;
