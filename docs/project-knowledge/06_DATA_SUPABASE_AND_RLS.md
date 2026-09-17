# 06 — البيانات وSupabase وRLS

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

## CONFLICTS_AND_UNKNOWNS

- **حالة المشروع المستضاف Unverifiable** من git وحده.
- تداخل packs SQL لنفس الجدول في أكثر من ملف.
- وثائق drift تحت `docs/security/` تشير لاحتمال اختلاف.

## مواقع schema

| موقع | دور |
|---|---|
| `artifacts/majalis/supabase/` | الحزمة الأكبر للتطبيق (~400+ SQL) |
| `supabase/` | منصة/توسعات/migrations جذر |
| `.migration-backup/01_schema.sql` | لقطة مبكرة |
| `artifacts/supabase/apply.sql` | RLS لـ`islamic_stories` فقط |
| `lib/db` | **placeholder Drizzle — ليس المصدر الحي** |

## كيانات أساسية (من SQL + استخدام العميل)

| كيان | غرض | قراءة/كتابة من التطبيق | RLS في المستودع | حساس؟ |
|---|---|---|---|---|
| `profiles` | ملف المستخدم | auth + profiles | سياسات عامة/مالك/admin | نعم (PII) |
| `sheikhs` / معلمون | علماء | getSheikhs + seeds | عادة قراءة عامة | لا |
| `lessons`, `lesson_*` | دروس وتفاعل | CRUD مشرف / قراءة عامة | نعم | متوسط |
| `lesson_series` / courses | سلاسل | مشابه | نعم | لا |
| `library_items` / `books` | مكتبة | قراءة | نعم | لا |
| `fawaid` | فوائد | معتمدة/مشرف | نعم | لا |
| `notifications` | إشعارات مستخدم | مالك الصف | نعم | نعم |
| `push_subscriptions` | Web Push | service role كتابة | RLS بلا anon policies | نعم (endpoints) |
| `bookmarks` / `user_favorites` | مفضلة | المستخدم | نعم | نعم |
| `prayer_times` | صفوف مواقيت DB اختيارية | getPrayerTimesFromDb | حسب pack | لا |
| `qa_*` / `quiz_questions` | أسئلة | قراءة | نعم | لا |
| `fatwas` / `sharia_rulings` / `fiqh_council_*` | فقه/مجمع | منتج المجلس يُصفَّى؛ جداول قد تبقى في SQL | نعم | محتوى حساس |
| `admin_audit_logs` | تدقيق | admin | admin | نعم |
| `search_index` | بحث | قراءة | حسب | لا |
| جداول `ake_*` / `mke_*` / `autonomous_*` / `ai_*` | محركات/أتمتة | admin/jobs | متفاوت | نعم إن مفاتيح |

**عدد CREATE TABLE الفريد عبر المستودع:** استكشاف ≈ **353** اسمًا (مع تكرار تعريفات). لا تُعامل كجرد مستضاف.

## RLS

- مئات `CREATE POLICY` عبر الملفات (استكشاف ≈800+ عبارة مع تكرار الملفات).
- أمثلة: قراءة عامة للملفات، `users_own_notifications`, `is_admin()` للإدارة.
- `push_subscriptions`: تفعيل RLS بدون سياسات anon — كتابة service role فقط.

## Migrations

- مجلدات `supabase/migrations/`, `artifacts/majalis/supabase/migrations/`, ملفات `*_ROLLBACK.sql`.
- تطبيق CLI موثّق خلف موافقة: `docs/REQUIRES_EXPLICIT_APPROVAL.md` + `MAJALIS_ALLOW_CLI_MIGRATIONS=1`.
- Workflow `supabase-migrations.yml`: list على push؛ apply عبر dispatch فقط.

## فصل مهم

| في المستودع | على المستضاف |
|---|---|
| SQL packs كاملة | Unknown إن طُبقت كلها |
| بذور JSON في `public/data` | تُنشر مع الويب Confirmed |
| خدمة role key | يجب أن تبقى خادمًا فقط — لا `VITE_` |

لا تُطبع بيانات مستخدمين أو أسرار.
