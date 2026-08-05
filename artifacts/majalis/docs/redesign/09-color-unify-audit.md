# تدقيق توحيد الألوان والهوية — fix/unify-color-system-and-geometric-layout

## الألوان المتكررة (قبل الضبط)

| لون | أين | مشكلة |
|---|---|---|
| `#2BB5A3` / `#1F9B8A` | m2030 home/pages hardcoded | Teal صارخ، خارج الرموز |
| `#143F35` / `#226A56` | final-release fallbacks, elite archive | هوية قديمة في fallbacks |
| Cream/Ivory متباينة | brand + more-sheet | أسطح غير موحّدة |
| نص ثانوي باهت | بعض البطاقات/الوصف | hierarchy ضعيف |

## ألوان غير متناسقة

- Hero/أزرار تستخدم hex صلبة بينما باقي الواجهة `--brand`.
- Dark mode كان يعتمد Teal ساطعًا يختلف عن Primary العميق في Light.
- Badges «قريبًا» قد تختفي أو تتسطح في Dark.

## Hardcoded (عُولج في هذه المهمة)

- `m2030/home.css` و`pages.css`: استبدال hex بـ `var(--em-*)` / `var(--brand)`.
- `more-bottom-sheet.css`: إزالة fallbacks `#226A56` / `#12362a`.

## مشاكل الوضع الليلي (المستهدفة)

- خلفية أقرب للفحم الأخضر `#0B1613` بدل الأسود الصافي.
- Text Primary دافئ `#EDF2F0`، Secondary/Muted مقروءان.
- Primary `#2E8B6F` واضح غير صارخ ويتحمل نصًا فاتحًا على الأزرار.
- Badges/choices النشطة تستخدم `--brand-soft` + `--text-brand-deep`.

## Contrast

- عناوين: `--text-title` على `--bg` / `--surface`.
- أزرار Primary: `--text-on-brand` على `--brand`.
- نصوص فوق Hero الداكن: `--text-on-dark` بتدرجات شفافية مضبوطة.

## صفحات تحتاج ضبطًا أكبر (بعد الطبقة العامة)

1. الرئيسية (Hero/كثافة) — ضُبطت
2. المزيد / الإعدادات / الفلاتر — طبقة `interactions.css`
3. الصلاة / الدروس / الاختبارات — `pages.css`
4. صفحات محتوى نادرة بـ hex صلبة داخل CSS الصفحة — مؤجلة تدريجيًا

## تغيير التسمية

- BottomNav: «التعلّم» → «الدروس» (route يبقى `/lessons`)
