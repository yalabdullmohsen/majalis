# أرشيف موسوعة الأحكام الشرعية

**تاريخ الأرشفة:** 2026-08-17

## السبب

أُزيلت واجهة المستخدم العامة لمسار `/rulings` (موسوعة «الأحكام الشرعية») لأن كل السجلات كانت في حالة `pending_review` وتعرض للزائر رسالة «قيد المراجعة» دون محتوى منشور فعلي. البوابة الفقهية `/fiqh` وباقي أبواب الفقه (القواعد، المذاهب، النوازل، المجمع، العبادات) بقيت نشطة.

## ما يحتويه هذا الأرشيف

| المسار | الوصف |
|--------|--------|
| `data/` | JSON الموسوعة التي كانت تُخدم من `public/data/rulings-encyclopedia/` (manifest + chunks) |
| `source/` | ملفات المصدر: `curriculum-topics.json`، `import-template.csv` |
| `seeds/` | `rulings-seed.ts` و`rulings-encyclopedia-seed.generated.ts` المستخدمة سابقًا في الواجهة والتوليد |

## ما لم يُمس

- **جدول Supabase `sharia_rulings`** — البيانات في قاعدة الإنتاج محفوظة؛ لم تُحذف أي سجلات.
- **ملفات SQL والهجرة** — بقيت في مكانها، منها:
  - `supabase/sharia_rulings_content_type_v1.sql`
  - `lib/rulings-db-seed.mjs` (بذرة قاعدة البيانات للأدمن/التشغيل)
- **مكونات الأدمن** (`RulingsSection`، إلخ) — قد تُعاد تفعيلها عند اكتمال المراجعة ونشر أحكام معتمدة.

## إعادة التفعيل (مستقبلًا)

1. استكمال المراجعة الشرعية وتحديث `verification_status` إلى `approved` في Supabase.
2. إعادة توليد البيانات: `pnpm --filter @workspace/majalis run generate:rulings`
3. استعادة المسارات في `App.tsx` و`fiqh-hub-topics.ts` وإزالة إعادة التوجيه إلى `/fiqh`.
4. نقل `data/` مرة أخرى إلى `public/data/rulings-encyclopedia/` أو الاعتماد على Supabase فقط.

## إعادة التوجيه الحالية

- `/rulings` و`/rulings/:id` و`/fatwa/:id` → `/fiqh` (إشارات مرجعية قديمة)
