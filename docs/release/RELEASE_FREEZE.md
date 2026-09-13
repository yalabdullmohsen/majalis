# تجميد إصدار سُنّة — Release Freeze

**الحالة:** ACTIVE  
**الفرع الوحيد للإصدار:** `release/sunnah-stable-1.0`  
**أساس الحقيقة (Source of Truth):** `b0efc979d4ac08c5d16ca6432d709301c8069494`  
**تشغيل CI الأخضر على main:** [34783252522](https://github.com/yalabdullmohsen/majalis/actions/runs/34783252522)  
**ملاحظة:** التقرير السابق ذكر `42f43aff2` / run `34774534175` — هذان أقدم؛ لا يُعتمدان مع وجود green أحدث على tip الـmain.  
**الإصدار:** `1.0.0` · **Build:** `46`

## القواعد

1. لا ميزات جديدة، لا إعادة تصميم، لا تغيير بصري إضافي للمصحف/الخط/إطار السورة.
2. لا دمج إلى `main` إلا إصلاح مثبت داخل Release Candidate، صغير، مراجع، أخضر محليًا وعلى CI.
3. كل PR مفتوح خارج نطاق الاستقرار: Draft + `hold` + `no-deploy`.
4. Auto-merge معطّل عمليًا (Draft يُتخطّى في `auto-merge-to-main.yml`).
5. لا تعديل لـ Verify build / ci-required لإجبار النجاح.
6. TestFlight وApp Store من Commit الـRC فقط بعد 3× Full Release Lane خضراء.

## المسار

Stabilize → Verify → Test → Release

## رفع التجميد

فقط بعد حكم نهائي `READY FOR APP STORE SUBMISSION` أو `READY WITH MANUAL APP STORE STEPS` وموافقة المالك صراحةً.
