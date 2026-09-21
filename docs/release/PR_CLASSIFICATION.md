# تصنيف Pull Requests أثناء تجميد سُنّة 1.0

> **تحديث 2026-09-21:** التصنيف الحي لبرنامج التثبيت في  
> `docs/release/SUNNAH_STABILIZATION_PR1_TRIAGE.md` (أساس `5a0fe21a9`).

تاريخ التصنيف الأصلي: 2026-09-13 · أساس: `b0efc979d`

| PR | العنوان | التصنيف | القرار |
|---|---|---|---|
| #2013 | ملء وتحسين نصوص عرض الأقسام | POST_RELEASE | Draft+hold — محتوى غير مانع للإصدار من main الأخضر؛ visual-snapshot أحمر |
| #1992 | إزالة ركن الأطفال | POST_RELEASE | Draft+hold — ميزة/حذف قسم |
| #1982 | تفكيك الازدحام البصري | CONFLICTING + POST_RELEASE | Draft+hold — تصميم؛ متعارض |
| #1980 | بنية ودجت سُنّة | CONFLICTING + POST_RELEASE | Draft+hold — ميزة ودجت ممنوعة الآن |
| #1979 | خط أساس تنظيف سُنّة | CONFLICTING + POST_RELEASE | Draft+hold — نطاق واسع؛ راجع لاحقًا cherry-pick انتقائي إن لزم |
| #1977 | جرد وإثراء محتوى Path-C | CONFLICTING + POST_RELEASE | Draft+hold |
| #1975 | هوية بصرية / رموز | CONFLICTING + POST_RELEASE | Draft+hold — تصميم |
| #1950 | توحيد هيروات | CONFLICTING + POST_RELEASE | Draft+hold |
| #1879 | إصلاح تخطيط الحديث | CONFLICTING + POST_RELEASE | Draft+hold — بعد الإصدار |
| #1878 | جاهزية App Store (خصوصية ميكروفون) | CONFLICTING | Draft+hold — راقب كـ REQUIRED_FOR_RELEASE مرشّح بعد مراجعة cherry-pick ضيقة فقط إن ثبت نقص على main |
| #1868 | إعادة تصميم الرئيسية | CONFLICTING + CLOSE | Draft+hold — ممنوع أثناء التجميد |
| #1824 | ECC bundle | POST_RELEASE | Draft+hold |
| #1791 | Offline-First | POST_RELEASE | يبقى Draft — ميزة |

## REQUIRED_FOR_RELEASE

لا يوجد PR مفتوح مصنّف إلزاميًا الآن: نقطة الأساس `main@b0efc979d` خضراء بالكامل على بوابات CI المطلوبة.

## ALREADY_IN_MAIN

- #2014 مصحف Premium (مدموج منشور)
- #2011 / #2010 إصلاحات مصحف سابقة على السلسلة الخضراء
