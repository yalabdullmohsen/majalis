# الأبحاث الشرعية — توثيق التنفيذ

## المسارات

| المسار | الوصف |
|--------|--------|
| `/academic-research` | الصفحة الرئيسية للمكتبة |
| `/academic-research/submit` | نموذج إضافة بحث (لا نشر مباشر) |
| `/academic-research/assistant` | مساعدة الباحث (بلا كتابة بحث جاهز) |
| `/academic-research/:id` | صفحة بحث |
| `/researches`, `/sharia-research` | تحويل دائم إلى `/academic-research` |

## الجداول (Supabase)

الملف: `artifacts/majalis/supabase/researches_v1.sql`

يشمل: `researches`, `researchers`, `research_authors`, `universities`, `colleges`, `departments`, `journals`, `publishers`, `research_categories`, `research_keywords`, `research_files`, `research_sources` (عبر `import_sources`), `research_submissions`, `research_reviews`, `research_permissions`, `research_reports`, `research_views`, `research_downloads`, `saved_researches`, `saved_searches`, `import_jobs`, `import_logs`, `duplicate_candidates`, `research_audit_logs`.

يُطبَّق يدويًا في SQL Editor. يتضمن RLS: قراءة عامة للمنشور غير التجريبي فقط؛ منع تعديل/حذف العميل؛ الملفات وإثبات الإذن غير عامة.

## الواجهة البرمجية

- `POST /api/researches/submit` — استلام طلب (rate limit)، حالة ابتدائية `auto_screening` أو `awaiting_review` للشخصي.
- `GET|POST /api/cron/researches-daily-import` — كرون يومي (05:20 UTC في vercel.json). لا يجلب مصادر غير مختبرة؛ يسجّل تقريرًا صادقًا.

## الطبقة المحلية (الواجهة)

`src/lib/researches/*` — أنواع، تصنيفات، بحث عربي، توثيق، تكرار، مساعدة، خدمة تخزين محلي للطلبات في التطوير.

- `RESEARCH_PUBLISHED_SEED` فهرس وصفي (`metadata_only`/`abstract_only`) لأعمال معروفة — بلا نص كامل وبلا إحصاءات وهمية.
- `RESEARCH_DEMO_SEED` فقط في `import.meta.env.DEV` أو `VITE_RESEARCH_DEMO=1`.

## لوحة الإدارة

قسم `researches` في `/admin` — طابور مراجعة، منشور، استيراد، مكررات.

## ما يحتاج موافقات خارجية

- تفعيل مصادر DOAJ / OAI-PMH / RSS محددة بعد مراجعة شروط الاستخدام واختبار الموصل.
- مفاتيح API إن لزم.
- تخزين ملفات PDF خاص مع فحص نوع MIME وحجم وعلامة مائية.

## مخاطر متبقية

- صلاحيات الأدمن الدقيقة على الخادم تعتمد على ربط أدوار governance بعد تطبيق SQL.
- الإشعارات البريدية لتغيّر الحالة تحتاج مزوّد بريد مهيأ.
- لا يُدّعى تشغيل جلب حي من مصادر خارجية في هذه الدفعة.
