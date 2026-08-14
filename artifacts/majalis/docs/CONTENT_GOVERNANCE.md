# حوكمة المحتوى

كل مادة تعليمية/فتوى/كتاب يجب أن تحمل عند العرض:
- نوع المحتوى · المصدر · الشيخ/المؤلف · تاريخ آخر مراجعة · المراجع · تنبيه عدم الإفتاء في النوازل الخاصة

مكوّن: `src/components/content-trust/ContentTrustBox.tsx` — موصول على تفاصيل الأحكام (`RulingDetailView`) مع تنبيه «الفتوى العامة لا تنطبق بالضرورة…».

حالات: `published` | `under_review` — المحتوى غير المكتمل لا يُفهرس.

في طبقة المعرفة (`public/data/knowledge`): `review_status: verified | needs_review`.
`needs_review` لا يُعرض كحقيقة قطعية؛ الطابور الحي: `docs/CONTENT_REVIEW_QUEUE.md`.

## بوابات التدقيق (إلزامية في البناء)

`pnpm run test:content-gates` يشغّل بالترتيب:

1. schema — مخطط موحّد + مصادر book/author + updated_at
2. ayah — evidences + اقتباسات ﴿ ﴾ مقابل المصحف المحلي
3. hadith — ref/grade/graded_by ورفض الضعيف في verified
4. dupes — تكرار معرّفات/أجسام
5. links — related صالح
6. quality — حدود كلمات حسب القسم
7. lang — إملاء وترقيم
8. **audit** — تطابق المانيفست والجرد وسلامة المصادر والمعرّفات

تحديث التقارير: `pnpm run generate:content-audit` → يحدّث `manifest.json` و`CONTENT_REVIEW_QUEUE.md` و`CONTENT_AUDIT_LATEST.md` (مع إشارات ناعمة للكتل المكررة/قصر المقالات).

المساعد العلمي: يرشد إلى محتوى موثّق داخل المنصة ولا يصدر فتوى مستقلة (يُراجع نص التنبيه في واجهة المساعد).
