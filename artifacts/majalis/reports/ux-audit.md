# تدقيق UX/A11y — المرحلة 0

## الشاشات المُدقَّقة

| الشاشة | حالة التحميل | حالة الفراغ | حالة الخطأ | أهداف اللمس | ملاحظات |
|--------|-------------|------------|------------|-------------|---------|
| HomePage | لا سكيلتون (قسم كل مكوّن مستقل) | غير منطبق | SectionErrorBoundary | روابط الوصول السريع صغيرة | الأزرار بعضها < 44px |
| QuranPage | نص "جارٍ التحميل" | — | زر إعادة المحاولة موجود | أزرار الصفحة قد تكون صغيرة | localStorage موجود للصفحة والعلامات |
| AdhkarPage | نص "جارٍ تحميل الأذكار…" | Empty text | Empty text | أزرار العداد بحاجة فحص | navigator.vibrate موجود |
| LessonsPage | PageLoadingGuard + نص | — | — | أزرار الفلترة بحاجة فحص | بحاجة لسكيلتون |
| FawaidPage | SkeletonCardGrid ✓ | Empty text | يسقط على demo content | — | جيد نسبياً |
| IslamicScholarsPage | لا loading state | — | — | بطاقات العلماء قد تكون صغيرة | بيانات ثابتة |
| FatwaPage | SkeletonCardGrid ✓ | — | — | — | جيد |
| SearchPage | SearchSkeleton ✓ | — | — | — | جيد |
| LessonDetailPage | SkeletonPage ✓ | Empty ✓ | — | — | جيد |
| AdhkarPage (تفاصيل) | p.adhkar-loading-hint | Empty ✓ | Empty ✓ | زر الإغلاق في الـ sheet | — |

## بنود الشدة العالية

1. **لا focus-visible عام**: بعض العناصر لها `outline: none` بلا بديل
2. **أهداف اللمس**: بعض الأزرار أصغر من 44px
3. **لا OfflineBanner**: لا إشعار عند انقطاع الشبكة
4. **BottomNavBar**: 3 تبويبات فقط + 2 إضافية، بحاجة لـ 5 تبويبات واضحة
5. **AdhkarPage**: لا حفظ تقدم الجلسة
6. **QuranPage**: لا زر "استئناف القراءة" رغم وجود localStorage

## بنود الشدة المتوسطة

1. **IslamicScholarsPage**: لا حالة تحميل (بيانات ثابتة لذا مقبول لكن يُذكر)
2. **AdhkarPage**: haptics via `navigator.vibrate` موجود لكن لا Capacitor Haptics
3. **Share**: لا مشاركة موحدة في الأذكار والفوائد
4. **Calendar (ICS)**: غير موجود في تفاصيل الدرس
5. **Page transitions**: لا انتقالات بين الصفحات
6. **prefers-reduced-motion**: جزئي، يحتاج تغطية كاملة للـ skeleton
