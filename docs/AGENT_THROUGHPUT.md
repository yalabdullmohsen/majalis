# بروتوكول تسريع الوكيل (AGENT THROUGHPUT)

يُطبَّق في كل مهمة. التفاصيل والقياس: `docs/CI_THROUGHPUT.md`. الفهرس: `docs/REPO_INDEX.md`.
**سلامة CI قبل الدمج:** `.cursor/rules/majlisilm-ci-safe.mdc` و`pnpm run verify:ci`.

## مطلق

1. **قبل الدفع إلزامي:** من جذر git شغّل `pnpm run verify:ci` (أو `verify:ci -- --changed` لتضييق المصحف). عند الفشل: لا commit ولا push.
2. بعد نجاح المحلي: ادفع → افتح/حدّث PR Ready → فعّل auto-merge squash.
3. **راقب الفحوصات الحرجة فقط** عبر `gh pr checks --watch --fail-fast` (Verify build + repo-gates + build + static-checks). لا تُبقَ الوكيل معلّقًا على فحوصات غير مطلوبة للدمج إن نجحت الحرجة.
4. عند فشل CI: `gh run view --log-failed` → أصلح محليًا → `verify:ci` → ادفع commit جديد — **لا تعطّل الفحص**.
5. الفحص المطلوب لحماية `main` = **Verify build**؛ عمليًا لا تُدمَج المهمة إلا بخضرة Verify build وrepo-gates وbuild وstatic-checks.
6. فروع متراكمة من رأس الفرع السابق عند الحاجة؛ لا تنتظر دمج السابق لبدء عمل مستقل.
7. دفعة = مرحلة كاملة (٥–١٥ إصلاحًا متجانسًا) ضمن ≤٤٠ ملفًا و≤٤٠٠ سطر حذف؛ PR بهدف واحد (لا خلط أذان+مصحف+SEO).
8. خيط بلا إغلاق خلال محاولتين أو ١٥د → `docs/DECISIONS_PENDING.md` واقفز.
9. قرار بشري (PWA/تراخيص/CSP) لا يوقف الطابور — سجّل واقفز.

## استكشاف

- ابدأ من `REPO_INDEX.md`؛ ممنوع مسح الشجرة كاملًا.
- `rg` محدد + قراءة نطاق أسطر؛ لا إعادة قراءة ملف في نفس الجلسة بلا سبب.
- قبل أي حذف مسار: `rg` على الكود وsitemap وprerender؛ ما في sitemap/prerender لا يُحذف بلا حذف مدخله في نفس الـcommit.
- مسارات iOS/أصوات: `find` أو glob مقتبس — لا `adhan-short*.caf` عاريًا في zsh.

## تحقق محلي

- أثناء العمل: اختبارات المرحلة + `tsc` تزايدي إن لزم.
- نهاية الدفعة / قبل الدفع: **`pnpm run verify:ci`** (يشمل typecheck + lint + test:ci-unit + build + بوابات المستودع).
- pitch/promo/mockup مستبعدة أصلًا من typecheck/build الجذري.

## إخراج

- التقارير في `docs/` عند الحاجة؛ رسالة المحادثة موجزة: الملفات · الأوامر · الفشل/الإصلاح · رابط PR · هل دُمج؟ · هل نُشر؟
