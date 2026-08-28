# أصول متجر App Store / Play — سُنّة

مسار العمل: Capacitor حول `artifacts/majalis` فقط.

## مطلوب قبل الإرسال

| أصل | المواصفات | الحالة |
|---|---|---|
| أيقونة 1024×1024 | بلا شفافية، من هوية سُنّة | توليد عبر `pnpm --filter @workspace/majalis run assets:generate` ثم مراجعة يدوية |
| لقطات 6.7" | iPhone | يولّدها المالك من TestFlight / محاكي |
| لقطات 6.5" | iPhone | كذلك |
| لقطات iPad | 12.9" أو الحجم المطلوب في App Store Connect | كذلك |
| وصف عربي | قصير + كامل | مسودة عند المالك |
| وصف إنجليزي | قصير + كامل | مسودة عند المالك |
| كلمات مفتاحية | App Store | عند المالك |
| تصنيف عمري | 4+ متوقع (محتوى ديني تعليمي بلا عنف) | تأكيد المالك |

## روابط قانونية ثابتة (مربوطة من الإعدادات)

- خصوصية: `https://majlisilm.com/privacy`
- شروط: `https://majlisilm.com/terms`
- دعم: `https://majlisilm.com/support`
- مصادر: `https://majlisilm.com/sources`
- حذف الحساب: داخل التطبيق `/account-deletion`

## Sign in with Apple

يُفعَّل مع أي دخول اجتماعي (`APPLE_OAUTH_ENABLED` + مزوّد Supabase). حالياً Google وApple معطّلان في الواجهة.
