# Deprecated Code

هذا المجلد يحتوي أكواد قديمة تم عزلها لمنع تعارضها مع المصحف الجديد والتسميع الجديد.

لا تستخدم هذه الملفات في routes أو providers أو main navigation.

الأكواد الفعالة يجب أن تكون:
- `lib/features/mushaf/`
- `lib/features/tasmee3/`

## المحتويات

### `legacy_mushaf/`
قارئ المصحف القديم وواجهاته:
- `legacy_mushaf_screen.dart` (`LegacyMushafScreen`)
- `quran_page_view.dart`
- `quran_toolbar.dart`
- `ayah_action_sheet.dart`
- `surah_index_screen.dart`
- `juz_index_screen.dart`

### `legacy_shell/`
شاشات الصدفة القديمة الموازية (بحث/علامات/ختمة) التي كانت تفتح المصحف القديم:
- `search_screen.dart`
- `bookmarks_screen.dart`
- `khatmah_dashboard.dart`

## قواعد

1. فصل القديم من التشغيل أولاً.
2. إصلاح imports.
3. عدم كسر build.
4. الحذف النهائي لاحقاً بعد التأكد.

لا يوجد مسار GoRouter يفتح هذه الملفات بعد تنظيف 2026-08-04.
