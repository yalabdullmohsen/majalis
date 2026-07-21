-- إضافة نوع الوسائط (صورة/فيديو/carousel) لمحتوى Instagram الموحّد —
-- الآن متاح فعليًا عبر Apify (لم يكن متاحًا من مسار OG fallback القديم
-- الذي كان يعيد صورة الملف الشخصي فقط بلا تمييز نوع).
ALTER TABLE auto_imported_content
  ADD COLUMN IF NOT EXISTS media_type TEXT;
