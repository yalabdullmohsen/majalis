# 13 — لوحة الإدارة والعمليات

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

## Routes (من AppRoutes)

أمثلة: `/admin`, `/admin/dashboard`, `/admin/content`, `/admin/users`, `/admin/sources`, `/admin/review-*`, `/admin/automation/*`, `/admin/fiqh-review`, `/admin/fiqh-quality`, `/admin/import`, `/admin/content-import/*`, `/admin/integrations/instagram`, `/admin/auto-content`, `/admin/feature-status`, `/admin/universities`, …

الوصول: `AdminLazyRoute` + تحقق مشرف (عميل + RLS). **لا توسّع صلاحيات دون ضرورة مثبتة.**

## قدرات

| مجال | ملاحظات |
|---|---|
| Content CRUD | helpers `admin*` في `supabase.ts` + لوحات |
| Publishing | يعتمد حالة الصف في الجداول |
| Users | `/admin/users` |
| Import | URL/image import + pipelines |
| Automation | مراكز أتمتة متعددة — فعالية المستضاف Unknown |
| Fiqh review | لوحات مراجعة؛ لا إعادة منتج المجمع |
| Audit | `admin_audit_logs` في SQL |
| Preview/Validation | متفاوت حسب اللوحة — راجع الكود قبل الاعتماد |

## مخاطر إعادة الأخطاء

الإدارة قد تعيد إن لم تُقيَّد:

- محتوى محذوف/غير موثّق  
- تصنيف/slug قديم (`fiqh-council`)  
- Placeholder  
- صوت بلا ترخيص  
- نشر بلا مصدر  

بوابات المحتوى وRLS تخفف لكن **لا تغني عن حذر المشغل**.
