# 17 — المخاطر والدين التقني

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

## P0 Critical

| عنوان | دليل | ملف/مصدر | أثر | نطاق | توصية | اختبار قبول | موافقة مالك؟ | نوع |
|---|---|---|---|---|---|---|---|---|
| تسريب service role للعميل | إن وُضع تحت VITE_ | env patterns | اختراق | Security | أبقه خادمًا فقط | مسح bundle عن service_role | لا إن وقاية | Security |
| تجاوز bundle entry | gate | test-bundle-budget | فشل نشر | Perf | لا تسحب وحدات ثقيلة للإقلاع | budget أخضر | لا | Performance |
| تعديل نص قرآن | حوكمة | public/data/quran* | سلامة شرعية | Content | لا تلمس byte-for-byte | integrity gates | نعم لأي تغيير مصدر | Content |

## P1 High

| عنوان | دليل | أثر | موافقة؟ | نوع |
|---|---|---|---|---|
| تعارض سياسة النشر وثائقيًا | DEPLOYMENT.md vs vercel.json | ارتباك وكلاء/نشر | نعم لتحديث السياسة | CI |
| Schema drift مستضاف | docs/security + packs | RLS ناقص | نعم لتطبيق SQL | Security |
| تراخيص صوت/خطوط/كتب | LICENSE_RISKS | إيقاف متجر | نعم | Product |
| إشعارات صلاة بلا اختبار جهاز | PRAYER_TIME_DIAGNOSIS | فوات تنبيه | لا للاختبار / نعم لتغيير منهج | Native |
| تأكيد بريد يكسر توقع الدخول | AGENTS.md | UX/Auth | نعم لتغيير Auth dashboard | Auth |
| منتج مجمع بقايا مسارات | redirects+SQL | ثقة/SEO | نعم لحذف SQL مستضاف | Content |

## P2 Medium

- ازدواج IA_BOTTOM_TABS vs bottom حي  
- كثرة aliases/routes  
- api-server tokens في ملف JSON  
- OAuth معطّل مع وجود كود  
- lib/db placeholder مضلل  
- مسار جذر git قديم في docs  

## P3 Low

- تقارير generated محلية dirty  
- وثائق مكررة AUDIT*  
- تسويق artifacts غير إنتاج  

## فصل

- **مثبت:** له ملف/بوابة/وثيقة في المستودع.  
- **محتمل:** يعتمد مستضاف/جهاز.  
- **غير متحقق:** صُنّف Unknown صراحة أعلاه.
