# Mushaf and Tasmee3 Cleanup

## الهدف

إزالة التعارض بين المصحف القديم والتسميع القديم بالذكاء الاصطناعي وبين النسخ الجديدة.

## النسخ الفعالة

- المصحف الجديد:
  `lib/features/mushaf/`

- التسميع الجديد:
  `lib/features/tasmee3/`

- شاشة الدخول (هيكل فقط):
  `lib/features/quran/presentation/screens/home_shell.dart`

## النسخ المعزولة

### مصحف قديم (معزول في `lib/deprecated/legacy_mushaf/`)

- `legacy_mushaf_screen.dart` — كان `MushafScreen` القديم في `features/quran`
- `quran_page_view.dart`
- `quran_toolbar.dart`
- `ayah_action_sheet.dart`
- `surah_index_screen.dart`
- `juz_index_screen.dart`

### صدفة قديمة موازية (معزولة في `lib/deprecated/legacy_shell/`)

- `search_screen.dart` — استُبدل بـ `MushafSearchScreen`
- `bookmarks_screen.dart` — استُبدل بـ `MushafBookmarksScreen`
- `khatmah_dashboard.dart` — استُبدل بـ `MushafKhatmahScreen`

### ما بقي في مكانه لكن خارج navigation للمصحف/التسميع

- `lib/features/quran/data` و `domain` و `quran_providers.dart` — لازمة لإعدادات الثيم/`SharedPreferences` وبعض الاختبارات؛ لا تفتح قارئاً قديماً.
- `lib/features/audio` — مرتبط بالقارئ القديم؛ غير مربوط من HomeShell/GoRouter بعد التنظيف.
- `lib/features/bookmarks/data` و `lib/features/khatmah/data` — طبقة بيانات قديمة للاختبارات؛ الواجهة القديمة معزولة.

### تسميع AI قديم

لم يُعثر على مجلد منفصل مثل `features/ai` أو `AiRecitationService`.
مسارات التسميع الفعالة كلها من `lib/features/tasmee3/`.
أُعيد توجيه `/ai-recitation` و `/tasmee3-dashboard` إلى `/tasmee3` (`Tasmee3EntryScreen`).
مزود `legacyTasmee3AsrSettingsProvider` داخل التسميع الجديد للتوافق مع `--dart-define` فقط — ليس شاشة تسميع قديمة.

## Routes الفعالة

| المسار | الوجهة |
|---|---|
| `/` | `HomeShell` |
| `/mushaf-home` | `MushafHomeScreen` |
| `/mushaf` | `features/mushaf` → `MushafScreen` |
| `/tasmee3` | `Tasmee3EntryScreen` → dashboard/onboarding الجديد |
| `/search` | `MushafSearchScreen` |
| `/surahs` | `MushafIndexScreen` |
| `/bookmarks` | `MushafBookmarksScreen` |
| `/khatmah` | `MushafKhatmahScreen` |
| `/juz` | redirect → `/mushaf-home` |
| `/tasmee3-dashboard` | redirect → `/tasmee3` |
| `/ai-recitation` | redirect → `/tasmee3` |
| `/old-mushaf` | redirect → `/mushaf-home` |

## قواعد مهمة

- لا يتم توليد نص القرآن بالذكاء الاصطناعي.
- لا يتم تعديل النص القرآني الأصلي.
- لا يتم استخدام التسميع القديم.
- لا يتم استخدام المصحف القديم.
- أي كود قديم يجب أن يبقى خارج navigation.

## شارات التحقق البصري

- `MushafHomeScreen`: شارة «المصحف الجديد»
- `Tasmee3DashboardScreen`: شارة «التسميع الجديد»
- `HomeShell`: شارة «الجديد» على زري المصحف والتسميع
