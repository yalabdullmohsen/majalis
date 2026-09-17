# 20 — ذاكرة تشغيلية لوكيل «سُنّة»

حد أقصى تشغيلي: انسخ هذا الملف أولًا. التفاصيل في بقية `docs/project-knowledge/`.

**generatedFromCommit (HEAD):** `975505911116f6190e2d09fc97ced3dbbb02e37d`  
**origin/main عند التوليد:** `bad075588ecc66a98a864ab9274e537b0174daf4`  
**repositoryRoot الفعلي:** `/Users/alabdullmohsen/majlis-app`  
(وثائق قديمة قد تقول `majalis-correct` — اعتبر الجذر الفعلي من `git rev-parse --show-toplevel`.)

## تعريف المشروع

«سُنّة» منصة عربية RTL للعلم الشرعي (قرآن، دروس، حديث، عبادة، بحث). المنتج الإنتاجي الوحيد للمتجر والويب: **`artifacts/majalis`** (Vite + React + wouter + Tailwind v4 + Supabase + Capacitor).

## مسارات ممنوعة / مجمّدة / مرجع

| مسار | حكم |
|---|---|
| `artifacts/majalis` | عدّل هنا للمنتج |
| `artifacts/mushafi` | مرجع تسميع — **ممنوع الحذف**؛ ليس متجر 1.0.0 |
| `artifacts/majalis-mobile` | Expo مجمّد — ليس المتجر |
| `artifacts/majlisilm-flutter` | مهجور — خارج workspace |
| pitch/promo/mockup-sandbox | غير إنتاج — مستبعد من typecheck/build الجذر |
| نص قرآن / صفحات QPC / أرقام آيات | لا تغيّر byte-for-byte |
| قيم `.env` | لا تقرأ ولا تطبع أسرارًا |

## معمارية بجملة

المتصفح/Capacitor ← majalis ← Supabase مباشرة للبيانات/auth. APIs محدودة على Vercel + `api-server` لـExpo push. محتوى ثابت تحت `public/data`. إقلاع: `main.tsx` → `App.tsx` (`/`) → lazy `AppRoutes` (**364** path).

## تقنيات مفتاحية

Node 24 (CI) · pnpm 10.34.4 · TS ~5.9.3 · React 19.1 · Vite 7 · wouter · Tailwind 4 · Capacitor 8 · Supabase JS · Playwright · appId `com.yousef.majlisilm` · موقع تشغيلي `https://www.ssunnah.com`.

## أهم Routes

Bottom حي: `/` · `/quran-hub` · `/lessons` · `/prayer-times` · `/sections`  
مصحف `/mushaf` · بحث `/search` · حديث `/hadith` · فقه `/fiqh` · إعدادات `/settings` · حساب `/login` · إدارة `/admin*`  
`/fiqh-council*` → redirect `/fiqh` (منتج محذوف).

## كيانات بيانات

profiles, sheikhs, lessons*, library/books, fawaid, notifications, push_subscriptions, bookmarks/favorites, quiz/qa, admin_audit_logs, + حزم محركات. **المستضاف Unverifiable من git.** لا Runtime DDL.

## Auth

Signup/Login عبر Supabase. على الحي: تأكيد بريد → لا جلسة فورية. OAuth Google/Apple flags = false. Admin عبر `is_admin()` + RLS.

## محتوى

JSON+seeds+Supabase. build يشغّل content-guard. لا تختلق شرعيًا. لا تنشر Needs-verification. المجمع الفقهي منتجًا محذوف. فجوات: `CONTENT_GAPS_REPORT.md`.

## مصحف

604 صفحة QPC V2 · 6236 آية · `ayah-ref-normalize.ts` · بوابات mushaf-* · قياس madinah scripts.

## صلاة / إشعارات / صوت

adhan-js محلي + prefs localStorage. إشعارات صلاة = Capacitor LocalNotifications (ليس web timers وحدها). Push منفصل (api-server/Expo). تراخيص أذان/تلاوة جزئيًا معلّقة — `LICENSE_RISKS.md`. لا تدّع نجاح إشعار بلا اختبار جهاز.

## تصميم

Tokens + brand-v4 + dark/light · بوابات contrast · لا framer-motion في المنتج (بوابة native-feel).

## CI/CD

`verify:preflight` ثم `verify:ci` مرة بعد التجميد. PR واحد → main → auto-merge squash. Vercel من **main** حسب `vercel.json`/`auto-deploy.yml`.  
**تعارض:** جذر `DEPLOYMENT.md` يصف فرع `production` يدويًا — وثّق التعارض ولا تخفِه. TestFlight منفصل.

أوامر:

```bash
cd "$(git rev-parse --show-toplevel)"
corepack enable && pnpm install --frozen-lockfile
pnpm run verify:preflight
# بعد IMPLEMENTATION_FROZEN وفحص مستهدف ناجح:
pnpm run verify:ci
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
```

## قواعد Git للوكيل

- جذر monorepo فقط؛ مسارات `artifacts/majalis/...`.
- فرع من أحدث `origin/main`؛ PR واحد Ready؛ لا سلسلة PRs.
- لا إضعاف بوابات؛ لا أسرار في git.
- Targeted Read → Plan → Patch → Focused Test → Full Verify + Finalization Freeze.

## مخاطر أولوية

P0: أسرار عامة، تجاوز bundle، عبث قرآن.  
P1: drift SQL، تراخيص، إشعارات جهاز، تعارض نشر وثائقي، تأكيد بريد.  
P2: aliases/IA mismatch، OAuth ميت، lib/db وهمي.

## موافقات المالك إلزامية

SQL إنتاج، Auth/Vercel dashboard، تراخيص، Bundle ID، حذف بيانات، تغيير مصادر شرعية، سياسة نشر، analytics، MFA.

## أخطاء شائعة

1. العمل داخل `artifacts/majalis` كجذر git.  
2. نسيان `PORT`/`BASE_PATH`.  
3. سحب وحدات ثقيلة إلى entry (يكسر 120KiB).  
4. اختراع متن حديث/حكم.  
5. اعتبار Expo مسار متجر.  
6. حذف mushafi.  
7. تشغيل verify:ci مرارًا مع توسيع نطاق بعد التجميد.  
8. افتراض فرع production دون التحقق من Vercel.  
9. طباعة `.env`.  
10. تعديل generated `ios/.../public` يدويًا والالتزام به.

## مهمة آمنة — قالب

1. `git fetch` + ابدأ من `origin/main`.  
2. اقرأ الملفات الهدف كاملة + هذه الذاكرة.  
3. Scope Manifest.  
4. رقعة صغيرة مثبتة.  
5. اختبارات مستهدفة.  
6. `IMPLEMENTATION_FROZEN` → preflight → verify:ci مرة.  
7. PR واحد + مراقبة checks + نشر حسب السياسة الفعلية.  
8. أي نقص مصدر → سجّل لا تختلق.

## ملفات المعرفة

انظر `00_EXECUTIVE_SUMMARY.md` §15 و`KNOWLEDGE_INDEX.json`.
