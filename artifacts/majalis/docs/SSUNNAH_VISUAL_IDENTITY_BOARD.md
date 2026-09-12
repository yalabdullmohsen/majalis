# سُنّة — لوحة توحيد الهوية البصرية

آخر تحديث: 2026-09-12 · فرع: `cursor/ssunnah-visual-identity-ds`

## الهدف

هوية بصرية واحدة هادئة وواضحة عبر التطبيق والموقع، مع تنوّع تخطيط يخدم المحتوى (قارئ / حديث / معرفة / خط زمني / لوحة صلاة / دليل / إعدادات) دون اختلاف عشوائي في الألوان والخطوط والمسافات.

## حالة الأساس (P0)

| المحور | الحالة | ملاحظة |
|---|---|---|
| Tokens (`theme.css` → `--ss-*`) | **قوي** | توسيع أسطح/حالات/طباعة/حركة |
| مكوّنات DS المشتركة | **قوي** | AppCard / SoftCard / ScreenShell / SsText |
| حوكمة ESLint + lockdown | **قوي** | JSX بلا hex؛ allowlist محدودة |
| طبقات CSS متعارضة | **خُفِّض P0** | `sections-calm-polish` لم يعد يعيد `--mj-*` بهكس |
| دين hex في `styles/pages` | **خُفِّض** | ~2197 → ~1589 (بعد استعادة fallbacks آمنة للبوابة) مع سقف CI |
| ترحيل كل الشاشات 100% | **جزئي** | الدين المتبقي في CSS الصفحات |
| حذف Legacy بالكامل | **مؤجّل** | بعد اكتمال ترحيل الاستخدامات (P3) |

## أنماط الشاشات الرسمية

راجع `src/lib/ssunnah-screen-patterns.ts` + `docs/SSUNNAH_SCREEN_PATTERNS.md`:

ExperienceHome · Dashboard · Directory · Library · KnowledgeReader · HadithExperience · Timeline · ScriptureReader · MediaExperience · SettingsExperience · SearchExperience · DetailExperience

## تصنيف سريع (جرد)

| المنطقة | Route أمثلة | التصنيف | أولوية |
|---|---|---|---|
| المصحف | `/mushaf` | compliant (chrome) + استثناء scripture | P0 محمي |
| الرئيسية | `/` | partially_compliant | P1 |
| الحديث | `/hadith*` | partially_compliant (CSS دين) | P1 |
| الفقه/معرفة | `/fiqh` `/knowledge*` | partially_compliant | P1 |
| السيرة/تاريخ | `/seerah` `/tarikh-islami` | partially_compliant | P1 |
| الدروس | `/lessons*` | partially_compliant | P1 |
| البحث | `/search` | partially_compliant | P1 |
| الصلاة | `/prayer-times` | partially_compliant | P1 |
| الإعدادات | `/settings` | partially_compliant | P1 |
| FloatingBack | عالمي | legacy مخفّف (`DISABLED=true`) | P0 |

## بوابات

- `ssunnah-visual-identity-p0-gate.test.ts` — رموز + منع إعادة تعريف mj + سقف hex
- `visual-identity-unify-gate` / `soft-cards-system` / `ssunnah-design-system-lockdown-gate`
- `docs/ssunnah-page-hex-debt-baseline.json` — لا رفع للسقف

## قواعد صارمة أثناء الترحيل

- لا لون/خط/radius جديد داخل شاشة.
- الأخضر للهوية لا لكل عنصر.
- المصحف: geometry ثابتة؛ لا Card Layout على صفحة المصحف.
- لا حذف Legacy قبل اكتمال الاستبدال والتحقق.

## Content Safety

لا يُمسّ: نص القرآن، الرسم العثماني، متون الأحاديث، المصادر، المحتوى الشرعي.
