# تجميد إصدار سُنّة — Release Freeze

**الحالة:** `STORE_RC_ACTIVE` (تجميد مرشّح المتجر) · **ليس** حظرًا مطلقًا على `main` أثناء برنامج الإصلاح  
**آخر مزامنة حقيقة:** 2026-09-21 · `docs/release/CURRENT_PROJECT_STATUS.md`  
**Tip `origin/main` عند المزامنة:** `5e99cd7cf53244444916b0ecd7b55b3a8953cfd8`  
**إنتاج `www.ssunnah.com`:** `5e99cd7c` (متطابق مع الـtip) · pin التاريخي `3ba020f2` = STALE

## فصل السياسات (إصلاح تعارض التقرير)

| مسار | السياسة |
|---|---|
| **Store Release Candidate** | تجميد صارم: لا ميزات جديدة داخل ثنائي المتجر؛ Archive/AAB من **pin صريح** يسجّله المالك؛ TestFlight بعد 3× Full Release Lane خضراء على ذلك الـpin |
| **`main` / Vercel production web** | يُسمح بدمج موجات Stabilization + Full Remediation فقط، خضراء محليًا وعلى CI، بدون تخفيف بوابات، وبدون ادعاء GO للمتجر |

**ملاحظة تاريخية:** وثيقة سابقة ثبّتت SoT على `b0efc979…` وrun CI قديم. ذلك الـpin **لم يعد tip** — لا يُستخدم كمصدر حقيقة للويب الحي. أي بناء متجر يجب أن يعيد تثبيت الـpin صراحةً.

**فرع RC المقترح (إن وُجد):** `release/sunnah-stable-1.0`  
**الإصدار المستهدف:** `1.0.0` (Build رقم المتجر يحدّده المالك عند الأرشفة)

## قواعد Store RC

1. لا إعادة تصميم المصحف/الخط/إطار السورة داخل ثنائي المتجر.  
2. لا إدخال أصل `approvedForProduction: false` أو `rights_uncertain` / `rejected`.  
3. PRs خارج نطاق RC: تبقى على `main` عبر برنامج الإصلاح؛ لا تُخلط مع Archive دون pin جديد.  
4. لا تعديل لـ Verify build / ci-required لإجبار النجاح.  
5. TestFlight وApp Store من Commit الـRC المسجّل فقط.

## قواعد main (برنامج الإصلاح)

1. PR واحد لكل موجة Remediation/Stabilization المتبقية.  
2. لا ادعاء `STORE GO` أو `SUNNAH_*_COMPLETE` من نجاح CI وحده.  
3. OWNER_ONLY و DEVICE_REQUIRED تُوثَّق ولا تُنفَّذ آليًا.

## رفع تجميد المتجر

فقط بعد حكم نهائي `READY FOR APP STORE SUBMISSION` أو `READY WITH MANUAL APP STORE STEPS` وموافقة المالك صراحةً — انظر `docs/release/OWNER_ACTIONS_CURRENT.md`.
