# تصنيف PRs المفتوحة — 2026-07-31 (stabilize/platform-hardening)

**المصدر:** `main` @ `940e062f` (أحدث من SHA المذكور 381b8f7a — يتضمن #668/#669).  
**#668:** مدموج مسبقًا؛ رُاجع وشُدِّد في هذا الفرع (بوابات فحص مسماة + منع Auth/SQL/iOS/Cron).

## ملخص سريع

| الفئة | العدد التقريبي | الإجراء |
|---|---|---|
| متعارضة (CONFLICTING) | ~33 | لا دمج — أرشفة أو إعادة تأسيس انتقائية |
| Draft | 1 (#618) | لا دمج |
| قابلة للمراجعة (صغيرة) | #670 محتوى | خارج نطاق harden (content-runner) |
| خطرة/ضخمة | #602 (934 ملف) | استخراج فقط إن لزم — **لم ندمج** |

## PRs المستهدفة بالاستخراج (#602/#618/#620/#626)

| PR | الحالة | ماذا استُخرج إلى هذا الفرع |
|---|---|---|
| #626 | CONFLICTING — أغلب بوابات CI موجودة على main | لا شيء إضافي (متوفر) |
| #620 | CONFLICTING — auto-merge الآمن على main | لا شيء إضافي |
| #618 | Draft + CONFLICTING | نمط enqueue لـ cron الثقيل (أُعيد تطبيقه نظيفًا) |
| #602 | CONFLICTING + 934 ملفًا | **لم يُدمَج** — ضخم ومتعارض |

## قرار Release Train

يبقى مجدولًا 06:00/18:00 الكويت، لكن **لا يدمج** إلا مع:

- `release-train-ready` + domain label  
- غير Draft / غير متعارض / ليس `CHANGES_REQUESTED`  
- Verify build أخضر  
- preview-smoke ليس fail/pending  
- postgres-integration عند مسارات SQL  
- xcodebuild-simulator عند iOS  
- Level C (SQL/Auth/iOS/Cron/vercel.json/>40 ملف) → استبعاد + تعليق
