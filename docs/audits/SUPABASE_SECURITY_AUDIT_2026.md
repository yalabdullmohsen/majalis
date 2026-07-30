# تدقيق أمني Supabase — 2026 (قراءة فقط)

**المشروع:** `ngmvmlulzacrlicuagyp`  
**الفرع:** `security/supabase-hardening-audit`  
**SHA قاعدة main عند البدء:** `15ac9edbc`  
**التاريخ:** 2026-07-30  
**قيود:** لم يُطبَّق أي SQL. لا تعديل Auth/RLS على Production من الوكيل. لا DROP.

---

## 0) طريقة الفحص وحدوده

| المصدر | الحالة |
|---|---|
| اتصال Postgres مباشر (`DATABASE_URL` / service role) إلى Production | **غير متوفر** في بيئة الوكيل |
| مفتاح `VITE_SUPABASE_ANON_KEY` + URL | متاح — فحص PostgREST / Auth / Storage **حي** |
| OpenAPI `/rest/v1/` | مرفوض (يتطلب secret key) |
| `pg_catalog` (RLS flags، نص السياسات، grants الدقيقة، `prosecdef`, `proconfig`, extensions) | **NOT MEASURED** مباشرة |
| Auth settings العامة | **حي** عبر `/auth/v1/settings` |
| Storage buckets list | **حي** عبر `/storage/v1/bucket` → `[]` |
| مقارنة مع ملفات SQL في المستودع | نعم |

**الخلاصة المنهجية:** النتائج الحية أدناه هي سلوك **عميل anon** عبر PostgREST (ما يراه المتصفح فعليًا). استنتاجات RLS/GRANT مبنية على رموز HTTP (`401 permission denied` / `42501 RLS` / `200`/`206` مع صفوف). لا تُخترع قوائم سياسات من `pg_policies`.

---

## 1) نطاق الجداول المفحوصة حيًا

| المقياس | العدد |
|---|---|
| مرشّحات من ملفات SQL + قوائم lockdown | 347 |
| استُبعدت كأسماء زائفة (`IF`/`if`) | 2 |
| فُحصت عبر `GET /rest/v1/<table>?select=*&limit=1` | **300** |
| تُرجع صفوفًا لـ anon (`readable_with_rows`) | 62 |
| تُرجع 200/فارغ (`readable_empty` — GRANT SELECT موجود غالبًا + RLS يحجب الصفوف أو الجدول فارغ) | 191 |
| `401 permission denied` (REVOKE فعّال) | 45 |
| غير موجودة في schema cache | 45 |
| استجابة أخرى | 2 |

---

## 2) تصنيف الجداول (مستهدف + حالة حية مختصرة)

### public read (محتوى عام — متوقع ظهور صفوف)
أمثلة حية بصفوف: `lessons`, `sheikhs`, `qa_*`, `fiqh_council_items`, `prayer_times`, `universities`, `islamic_stories`, `prophet_stories`, `sharia_rulings`, `verified_adhkar_*`, `search_index`, `fawaid` (المعتمدة)، …

### user-owned
مستهدف: `profiles`, `family_links`, `user_submissions`, `bookmarks`, `user_*`  
حي: معظمها `readable_empty` لـ anon (لا جلسة) — لم يُثبت نص السياسة بدون `pg_policies`.

### authenticated shared / admin-only
`governance_user_roles`, `governance_*`, `admin_audit_logs` — حاليًا `200` فارغ لـ anon (ليس `401`) ⇒ **GRANT SELECT واسع** مع RLS على الأرجح.

### service-role-only / internal operational
**مقفلة جيدًا (401):** مجموعة `rls_lockdown_v1` (~45) مثل `content_import_jobs`, `autonomous_*`, `schema_migrations`, `kg_*`, …

**مكشوفة خطأ (SELECT لـ anon مع صفوف):**
- `ake_connectors` (24) — يشمل `api_config`, cursors, etag, health
- `knowledge_official_sources` (8) — يشمل `api_config`

**مكشوفة على مستوى الـ GRANT (200 فارغ — يجب أن تكون 401):**  
~90 جدولًا تشغيليًا منها: `background_jobs`, `background_job_attempts`, `background_job_dead_letters`, `ai_provider_circuit`, `ake_job_queue`, `akp_*`, `mke_*`, `open_api_keys`, `open_webhooks`, `admin_audit_logs`, `governance_security_audits`, …

### audit/log / secrets/config
- `open_api_keys`, `open_webhooks`, `admin_audit_logs`, `governance_audit_log`: SELECT anon → 200 فارغ (يجب service-only).
- `ai_spend_ledger`, `ai_request_dedup`, `ai_content_cache`: **غير موجودة** في schema cache (404).

---

## 3) الجداول الحساسة — نتائج حية

| الجدول | SELECT anon | INSERT anon | ملاحظات |
|---|---|---|---|
| `background_jobs` | 200 فارغ | 42501 RLS | GRANT موجود؛ RLS يمنع الإدراج — دفاع واحد فقط |
| `background_job_attempts` | 200 فارغ | — | نفس النمط |
| `background_job_dead_letters` | 200 فارغ | — | نفس النمط |
| `ai_provider_circuit` | 200 فارغ | 42501 RLS | UPDATE يعيد 200[] (لا صفوف) — GRANT UPDATE موجود |
| `ai_spend_ledger` | 404 | — | غير منشور على Production |
| `open_api_keys` | 200 فارغ | 42501 RLS | جدول مفاتيح — يجب ألا يظهر في PostgREST لـ anon أصلًا |
| `open_webhooks` / deliveries | 200 فارغ | — | تشغيلي |
| `admin_audit_logs` / `governance_security_audits` | 200 فارغ | — | سجلات |
| `ake_connectors` | **206 / 24 صفًا** | — | **تسريب تشغيلي** |
| `knowledge_official_sources` | **206 / 8** | — | `api_config` ظاهر |
| `auto_imported_content` | 206 / 21 | — | حقول داخلية (`ai_analysis`, `error_details`) ضمن الصفوف العامة |

---

## 4) SECURITY DEFINER (حي + مستودع)

### حي عبر `/rest/v1/rpc`
| الدالة | نتيجة anon | تقييم |
|---|---|---|
| `is_admin()` | **200 `false`** | EXECUTE متاح لـ anon بلا حاجة — يجب REVOKE |
| `record_lesson_view(uuid)` | 204 | مقصود للعدّادات؛ لا `user_id` |
| `increment_fiqh_item_views(text)` | 204 | مقصود؛ لا `user_id` |
| `accept_family_invite` / `get_similar_users` / `upsert_user_interest` | 404 | غير موجودة أو غير معرّضة بالاسم المُجرَّب |

### من المستودع (لم تُفحص `prosecdef` حيًا)
دوال DEFINER كثيرة في SQL (`owner_bootstrap_*`, search/RAG, knowledge engine, recommendations, …).  
ملف سابق `function_search_path_hardening_v1.sql` يذكر **42** دالة بلا `search_path` وقت كتابته — **لم يُؤكد العدد حيًا**.

أسئلة لم تُجب حيًا لكل DEFINER: هل `search_path` مثبت؟ هل يتحقق من `auth.uid()`؟ هل يقبل `user_id` لمستخدم آخر؟ — تحتاج استعلام `pg_proc` بمفتاح خدمة.

---

## 5) Auth (حي)

من `/auth/v1/settings`:
- `external.email = true`, باقي OAuth = false
- `anonymous_users = false`
- `disable_signup = false`
- `mailer_autoconfirm = false` (تأكيد البريد مطلوب — متسق مع سلوك التطبيق)
- `passkeys_enabled = false`, `saml_enabled = false`

إعدادات Leaked Password / MFA / JWT expiry **غير ظاهرة** في هذا الـ endpoint العام → **NOT MEASURED**.

---

## 6) Storage (حي)

- `GET /storage/v1/bucket` → `[]` (لا buckets ظاهرة لـ anon أو لا buckets)
- `POST /storage/v1/object/list/sheikhs` → `[]`
- نص سياسات `storage.objects` → **NOT MEASURED** (يتطلب SQL)

---

## 7) Extensions داخل public

**NOT MEASURED** (لا اتصال `pg_extension` / `pg_namespace`).  
GraphQL: `/graphql/v1` → `pg_graphql extension is not enabled`.

---

## 8) أخطر 10 نتائج

1. **`ake_connectors` مقروء بالكامل لـ anon** (24 صفًا) بما فيها `api_config` وحالة المزامنة.
2. **`knowledge_official_sources` مقروء لـ anon** مع `api_config`.
3. **~90 جدولًا تشغيليًا** (طوابير، مفاتيح، سجلات، دوائر AI) ترد `200` بدل `401` — اعتماد على RLS فقط.
4. **`background_jobs` / `ai_provider_circuit`**: INSERT يصل إلى فحص RLS (`42501`) ⇒ GRANT INSERT لـ anon ما زال قائمًا.
5. **`open_api_keys` / `open_webhooks` ظاهرة في PostgREST لـ anon**.
6. **`is_admin()` قابلة للتنفيذ من anon**.
7. **`platform_hardening_security_v1.sql` / REVOKE الشامل** غير مطبَّقين بالكامل (وإلا لكانت الجداول الحساسة `401`).
8. **`auto_imported_content`** يعرض حقول تحليل/أخطاء داخلية مع المحتوى.
9. **جداول P2** (`ai_spend_ledger`, cache/dedup) غير موجودة — فجوة حوكمة تكلفة (ليست تسريبًا مباشرًا).
10. **لا اتصال قراءة لـ `pg_catalog`** ⇒ لا إثبات حي لـ FORCE RLS / نص السياسات / DEFAULT PRIVILEGES الحالي.

---

## 9) ما نجح من الإغلاقات السابقة

- ~45 جدولًا من `rls_lockdown_v1` تعطي **permission denied** لـ anon.
- إدراج `background_jobs` / `ai_provider_circuit` / `open_api_keys` يفشل بـ RLS (ليس مفتوحًا بالكامل).
- المحتوى العام الأساسي متاح كما هو متوقع للمنصة.

---

## 10) الحزمة المقترحة

`artifacts/majalis/supabase/SUPABASE_SECURITY_HARDENING_PACK.md`  
**لم تُطبَّق.** للمراجعة اليدوية بعد Preflight SQL Editor فقط.
