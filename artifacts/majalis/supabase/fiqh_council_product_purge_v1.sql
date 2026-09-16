-- fiqh_council_product_purge_v1.sql
-- MANUAL_OWNER_ACTION — لا يُنفَّذ تلقائيًا من CI/PR.
-- الغرض: إزالة بقايا منتج المجمع الفقهي / القرارات من القاعدة المستضافة.
-- Idempotent: آمن لإعادة التشغيل.
-- Rollback: انظر التعليقات أسفل الملف (لا يُعاد إنشاء المنتج في الواجهة).

BEGIN;

-- أرشفة صفوف منشورة إن وُجدت الجداول (لا حذف صلب قبل نسخة احتياطية يدوية للمالك)
DO $$
BEGIN
  IF to_regclass('public.fiqh_council_items') IS NOT NULL THEN
    UPDATE public.fiqh_council_items
    SET status = 'archived',
        archived_at = COALESCE(archived_at, now())
    WHERE status = 'published'
       OR status IS DISTINCT FROM 'archived';
  END IF;

  IF to_regclass('public.fiqh_council_issues') IS NOT NULL THEN
    UPDATE public.fiqh_council_issues
    SET status = 'archived'
    WHERE status = 'published';
  END IF;

  IF to_regclass('public.fiqh_council_sessions') IS NOT NULL THEN
    UPDATE public.fiqh_council_sessions
    SET status = 'archived'
    WHERE COALESCE(status, 'published') = 'published';
  END IF;
END $$;

-- إسقاط دوال البحث الخاصة بالمجمع إن وُجدت
DROP FUNCTION IF EXISTS public.search_fiqh_council_advanced(
  text, text, text, text, text, integer, text[], text, text, integer
);

COMMIT;

-- ── Rollback (يدوي، لا يعيد المنتج العام) ──
-- استعادة الصفوف من نسخة احتياطية قبل التشغيل فقط.
-- لا تُعاد جداول/دوال المجمع إلى أسطح البحث/sitemap/الواجهة.
