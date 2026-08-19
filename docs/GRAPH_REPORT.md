# GRAPH_REPORT.md

## الملخص
- nodes: 23
- links: 38
- addedLinks(autoReverse reverse completion): 4
- isolated nodes (no links): 0
- broken links (routing/targets): 0

## تفاصيل سريعة
- تم تعديل: `/Users/alabdullmohsen/majlis-app/artifacts/majalis/public/data/graph/links.json`

## مرحلة ٢ (ملاحظة صريحة — غير مُصلَحة الآن)
- **عدم تطابق `slug` في صفحة المكتبة**:
  - `GraphRelatedRail` داخل `src/pages/library/ui/LibraryDetailView.tsx` يمرّر `slug={String(item.id)}`.
  - بينما عقدة الرسم الحالية لـ`kind="book"` في `links.json` تستخدم `slug` بصيغة `book-*` (مثال: `book-mughni`).
  - النتيجة: قد لا تُنتج `GraphRelatedRail` روابط “انظر أيضاً” على صفحات المكتبة بسبب اختلاف المعرّف (مرحلة لاحقة ستربط `item.id` إلى slug الصحيح عبر طبقة تعيين).

