-- ═══════════════════════════════════════════════════════════════════════════
-- دالة زيادة عداد مشاهدات عنصر المجمع الفقهي — كانت مُستدعاة من الكود
-- (src/lib/fiqh-council-service.ts: incrementFiqhCouncilViews) بلا أن تكون
-- موجودة إطلاقًا في قاعدة البيانات، فكانت تفشل بصمت في try/catch على كل
-- فتح لعنصر فقهي. SECURITY DEFINER يسمح لعميل anon (الذي لا يملك صلاحية
-- UPDATE مباشرة على fiqh_council_items حسب RLS الحالية) بزيادة العدّاد
-- فقط دون فتح أي صلاحية كتابة أوسع.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_fiqh_item_views(item_slug TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE fiqh_council_items
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE slug = item_slug;
$$;

GRANT EXECUTE ON FUNCTION increment_fiqh_item_views(TEXT) TO anon, authenticated;
