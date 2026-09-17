# 18 — خارطة طريق مبنية على الأدلة

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d` · بلا مدد زمنية تخمينية.

## Stabilize

- توحيد وثائق النشر مع السلوك الآلي.  
- الإبقاء على verify:preflight→verify:ci وpath-lane.  
- حماية bundle + mushaf gates.  
**اكتمال:** وثائق متطابقة + بوابات خضراء على main.

## Launch blockers

- حسم LICENSE_RISKS (أذان، QPC، كتب).  
- تطبيق SQL الأمني بموافقة (`REQUIRES_EXPLICIT_APPROVAL`).  
- اختبار جهاز للصلاة/الإشعارات.  
- Auth MFA/leaked password في لوحة Supabase.  
**اكتمال:** قائمة LICENSE بلا بنود حجب متجر + checklist مالك.

## Product quality

- مواءمة التنقل IA مع الشريط الحي أو حذف المرجع المضلل.  
- تقليل سطح admin غير المستخدم بعد جرد استخدام مستضاف.  
**ملفات متوقعة:** navigation, ia-final-structure, Admin routes.

## Content quality

- إكمال مصادر المكتبة أو Empty States.  
- الإبقاء على pending rulings غير منشورة حتى التوثيق.  
- استمرار بوابات content-quality / hadith / ayah.  
**مرجع:** CONTENT_GAPS_REPORT, LICENSE_RISKS.

## Mobile release

- Capacitor sync من dist.  
- TestFlight عبر workflow الوسوم — منفصل عن كل merge ويب.  
- لا مسار Expo للمتجر.

## Post-launch / Future 1.1

- دمج قدرات التسميع من `artifacts/mushafi` داخل سُنّة حسب `PLATFORMS.md` فقط.  
- لا تطبيق متجر منفصل من mushafi لـ1.0.0.

## لكل مبادرة — قالب

السبب ← مخرجات ← تبعيات ← مخاطر ← اختبارات ← معيار اكتمال ← ملفات متوقعة (كما أعلاه).
