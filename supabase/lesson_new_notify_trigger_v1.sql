-- ═══════════════════════════════════════════════════════════════
-- إشعار المشرفين عند إضافة أي درس جديد — trigger على جدول lessons
-- يعمل بصرف النظر عن المسار (أتمتة / يدوي / استيراد)
-- ═══════════════════════════════════════════════════════════════

-- دالة الإشعار الداخلي
CREATE OR REPLACE FUNCTION notify_admins_on_new_lesson()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id  uuid;
  v_title     text;
  v_link      text;
  v_body      text;
  v_speaker   text;
BEGIN
  -- استخراج بيانات الدرس
  v_title   := COALESCE(NULLIF(TRIM(NEW.title), ''), 'درس جديد');
  v_speaker := COALESCE(NULLIF(TRIM(NEW.speaker_name), ''), '');
  v_link    := '/lessons/' || NEW.id::text;

  v_body := CASE
    WHEN v_speaker <> '' THEN 'الشيخ: ' || v_speaker
    ELSE 'راجع الدرس من قائمة الدروس.'
  END;

  -- إدخال إشعار لكل مشرف (is_admin = true أو role في admin/editor)
  FOR v_admin_id IN
    SELECT DISTINCT id
    FROM profiles
    WHERE is_admin = true
       OR role IN ('admin', 'editor', 'super_admin')
  LOOP
    INSERT INTO notifications (user_id, title, body, type, link, is_read, created_at)
    VALUES (
      v_admin_id,
      '📚 درس جديد: ' || v_title,
      v_body,
      'lesson_added',
      v_link,
      false,
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- لا نوقف العملية الأصلية بسبب خطأ في الإشعار
  RETURN NEW;
END;
$$;

-- إزالة trigger قديم إن وجد
DROP TRIGGER IF EXISTS trg_notify_admins_new_lesson ON lessons;

-- إنشاء trigger يُطلق بعد كل INSERT
CREATE TRIGGER trg_notify_admins_new_lesson
  AFTER INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_new_lesson();

-- تعليق توضيحي
COMMENT ON FUNCTION notify_admins_on_new_lesson() IS
  'يُشعر جميع المشرفين داخل التطبيق عند إضافة أي درس جديد بصرف النظر عن المسار.';
