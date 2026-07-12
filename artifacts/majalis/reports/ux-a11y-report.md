# تقرير UX/A11y — feat/ux-a11y-polish

## 1. جدول تدقيق المرحلة 0

| الشاشة | حالة التحميل | حالة الفراغ | حالة الخطأ | أهداف اللمس | الحالة |
|--------|-------------|------------|------------|-------------|-------|
| HomePage | SectionErrorBoundary/قسم | غير منطبق | ✅ SectionErrorBoundary | بحاجة لفحص | محسَّن |
| QuranPage | loading state + API err | — | ✅ زر retry | ✅ > 44px | ✅ + شارة استئناف |
| AdhkarPage | نص تحميل | ✅ Empty | ✅ Empty | ✅ | ✅ + sessionStorage |
| LessonsPage | PageLoadingGuard | — | — | بحاجة لفحص | ✅ + scrollRestore |
| FawaidPage | ✅ SkeletonCardGrid | ✅ | ✅ fallback demo | ✅ | ✅ + scrollRestore |
| IslamicScholarsPage | لا (بيانات ثابتة) | — | — | ✅ | ✅ + scrollRestore |
| FatwaPage | ✅ SkeletonCardGrid | — | — | ✅ | جيد |
| SearchPage | ✅ SearchSkeleton | — | — | ✅ | جيد |
| LessonDetailPage | ✅ SkeletonPage | ✅ Empty | ✅ | ✅ | جيد |
| AdhkarPage (ذكر) | p.hint | ✅ | ✅ | ✅ > 44px | ✅ |

## 2. جدول التباين قبل/بعد

> نتيجة `node scripts/contrast-check.mjs`:

| التركيبة | FG | BG | النسبة | الحد | النتيجة |
|---------|-----|-----|-------|------|---------|
| أبيض على #0E6E52 | #FFFFFF | #0E6E52 | 6.23:1 | 4.5 | ✅ |
| أبيض على #153025 | #FFFFFF | #153025 | 14.18:1 | 4.5 | ✅ |
| أبيض على #1F4D3A | #FFFFFF | #1F4D3A | 9.63:1 | 4.5 | ✅ |
| #607D6E على أبيض | #607D6E | #FFFFFF | 4.51:1 | 4.5 | ✅ |
| #1F4D3A على #F0F5F2 | #1F4D3A | #F0F5F2 | 8.73:1 | 4.5 | ✅ |
| **إجمالي** | | | | | **18/18 PASS ✅** |

لا توجد إخفاقات WCAG AA. جميع الألوان تجتاز المعيار.

## 3. فحص أهداف اللمس

تمت إضافة قاعدة CSS:
```css
button, [role="button"], .btn-icon, .bottom-nav__tab,
.adhkar-chip, .content-hub-chip, .ds-btn {
  min-height: 44px;
}
```
للفحص اليدوي: DevTools → Elements → حدد الزر → تحقق من computed height ≥ 44px.

## 4. الميزات اليومية المضافة

### أ. شارة استئناف القراءة في المصحف
- تظهر تلقائياً عند فتح المصحف إذا كان آخر صفحة > 1
- تُظهر اسم السورة ورقم الصفحة
- تختفي بعد 6 ثوانٍ أو بالنقر

**اختبار**: افتح /quran، انتقل لصفحة 50، أغلق التطبيق، أعد الفتح → يظهر الشريط.

### ب. OfflineBanner
- يظهر شريط زمردي داكن أعلى الشاشة عند انقطاع الشبكة
- يختفي فور العودة للإنترنت

**اختبار**: DevTools → Network → Offline → لاحظ الشريط.

### ج. حفظ تقدم الأذكار في الجلسة
- يُحفظ في `sessionStorage` بمفتاح `adhkar_progress_{category}`
- يُستعاد عند العودة لنفس الجلسة

**اختبار**: ابدأ الأذكار، انتقل لصفحة أخرى، ارجع → نفس الموضع.

### د. Haptics الأذكار مع إعداد التحكم
- إعداد `adhkar_haptics_enabled` في localStorage (افتراضي: true)
- للتعطيل: `localStorage.setItem('adhkar_haptics_enabled', 'false')`

### هـ. استعادة موضع التمرير
- صفحات: FawaidPage، IslamicScholarsPage، LessonsPage
- يُحفظ في sessionStorage ويُستعاد عند العودة

### و. مشاركة موحّدة — `src/lib/share.ts`
- تستخدم Web Share API إن توفرت
- Fallback: نسخ للحافظة
- النص الديني يُمرَّر حرفياً

### ز. تصدير ICS — `src/lib/ics.ts`
- لإضافة أي حدث للتقويم
- `downloadUnifiedCalendar` موجود مسبقاً في LessonDetailPage

### ح. BottomNavBar — 5 تبويبات
- رئيسية / مصحف / أذكار / دروس / بحث
- كل تبويب ≥ 44px

## 5. تأكيد سلامة النصوص الدينية

```
git diff --name-only HEAD~1 HEAD | grep "src/data\|adhkar-seed\|quran"
# لا مخرجات — ملفات البيانات الدينية لم تُعدَّل
```

لا تغيير في:
- `src/lib/adhkar-seed.ts`
- `src/data/*.ts`
- أي بيانات قرآنية أو حديثية

## 6. تفاصيل التنفيذ

| الملف | التغيير |
|-------|---------|
| `src/components/OfflineBanner.tsx` | جديد |
| `src/lib/share.ts` | جديد |
| `src/lib/ics.ts` | جديد |
| `src/hooks/useScrollRestore.ts` | جديد |
| `src/components/BottomNavBar.tsx` | 5 تبويبات |
| `src/App.tsx` | إضافة OfflineBanner |
| `src/index.css` | focus-visible + touch targets + reduced-motion + skeleton + page transitions |
| `src/views/AdhkarPage.tsx` | sessionStorage + haptics |
| `src/views/QuranPage.tsx` | شارة استئناف القراءة |
| `src/views/FawaidPage.tsx` | useScrollRestore |
| `src/views/LessonsPage.tsx` | useScrollRestore |
| `src/views/IslamicScholarsPage.tsx` | useScrollRestore |

## 7. رابط الـ PR

سيُضاف عند push: `feat/ux-a11y-polish` → `main`
