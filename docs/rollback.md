# الرجوع السريع (Rollback) — سُنّة

دليل عملي لاستعادة إصدار مستقر بعد فشل smoke أو عطل في الإنتاج. **لا يوجد rollback تلقائي** في هذا المستودع — القرار بشري دائمًا.

## 1) كيف نعرف آخر نشر مستقر؟

1. افتح [Vercel — majalis-majalis](https://vercel.com/yousef88/majalis-majalis/deployments) وابحث عن آخر نشر **Production** بحالة Ready.
2. تحقق من `https://www.ssunnah.com/version.json` — الحقل `shortCommit` يطابق الـ deployment المستقر.
3. راجع `reports/release-report.md` من آخر `pnpm run release:check` ناجح (إن وُجد محليًا).
4. على GitHub: آخر commit على `main` نجح فيه **Verify build** و**postdeploy-smoke** (إن شُغّل).

## 2) الرجوع من Vercel Dashboard

1. **Deployments** → اختر النشر المستقر السابق.
2. **⋯** → **Promote to Production** (أو **Redeploy** لنفس الـ commit إن لزم).
3. انتظر اكتمال البناء (عادة 3–5 دقائق).
4. لا تغيّر DNS من هنا — الرجوع على مستوى التطبيق فقط.

## 3) الرجوع من Vercel CLI (اختياري)

```bash
cd artifacts/majalis
npx vercel ls --prod
# انسخ deployment URL للإصدار المستقر
npx vercel promote <deployment-url> --yes
```

## 4) التحقق بعد الرجوع

```bash
pnpm run guard:postdeploy
# أو
node scripts/postdeploy-smoke.mjs
```

يجب أن ينجح:

- `https://www.ssunnah.com` → 200
- `/api/healthz` → `{"ok":true,...}` بلا أسماء قديمة
- `/sitemap.xml` → 200 بلا `/admin` أو `/search`
- `/mushaf` و`/lessons` → 200

ثم تحقق من `version.json` — `shortCommit` يطابق الإصدار المتوقع.

## 5) مسح كاش Service Worker (عند بقاء واجهة قديمة)

**لا تحذف PWA بالكامل.** اتبع الترتيب:

1. تأكد أن `sw.js` و`sw-version.js` على الإنتاج محدَّثان (`Cache-Control: no-cache`).
2. من المتصفح (Chrome): DevTools → Application → Service Workers → **Unregister** (للاختبار فقط).
3. للمستخدمين: تحديث التطبيق المثبّت يحدث تلقائيًا عند تغيّر `SW_BUILD_ID` — الكود يحذف بادئات `majlisilm-v*` و`majalis-*` عند `activate`.
4. إن لزم دعم يدوي: اطلب من المستخدم **إغلاق التبويب بالكامل** ثم فتح `https://www.ssunnah.com` من جديد (ليس refresh فقط).

لا تعدّل `public/sw.js` لمسح كاش عدواني يكسر القراءة دون اتصال.

## 6) متى لا نرجع؟

- فشل smoke بسبب **محتوى** (ليس بنية) — أصلح المحتوى وادفع commit جديد.
- فشل **apex** (`ssunnah.com` 502) — غالبًا DNS/Vercel Domains، راجع `docs/domain-checklist.md` لا rollback تطبيق.

## 7) بعد الاستقرار

1. سجّل سبب الرجوع في PR أو issue.
2. أصلح السبب الجذري على فرع جديد.
3. شغّل `pnpm run release:check` محليًا قبل الدمج.
