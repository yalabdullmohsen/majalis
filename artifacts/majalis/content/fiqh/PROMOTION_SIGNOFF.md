# ورقة توقيع ترقية فقهية (داخلية)

> للمراجعة البشرية فقط.
> «اكمل» **ليست** توقيعًا ولا تشغّل الإدراج في `books.json`.

## الحالة
- الكتالوج العام مكتمل (1103)
- المرشّحان داخل `deferred-nawazil.json` فقط
- `promotionApproved=false` · `insertedIntoBooksJson=false`
- أداة التطبيق: `scripts/apply-fiqh-promotion.mjs` (ترفض افتراضيًا)

---

## 1) لباس الشهرة المعاصر
- Topic: `libas-shuhra-muasir`
- Final id: `libas-shuhra-dawabit`
- Target: `libas` / `libas-haram`
- أمر الاعتماد الحرفي:
```
اعتمد ترقية لباس الشهرة إلى books.json
```
- بعد تحديث التوقيع في JSON:
```bash
node scripts/apply-fiqh-promotion.mjs \
  --topic=libas-shuhra-muasir \
  --approve='اعتمد ترقية لباس الشهرة إلى books.json' \
  --dry-run
```

### قائمة التوقيع
- [ ] الضابط (عرف معتدل + مقصد ظاهر) مقبول للعرض العام
- [ ] لا أسماء ماركات/أزياء معاصرة في النص المنقول
- [ ] الفصل واضح عن محرمات اللباس الأصلية
- [ ] صيغة «ليس فتوى شخصية» كافية
- [ ] الموافقة على insert_new_lesson في libas-haram

المراجع: __________ التاريخ: __________

---

## 2) زيارة النساء للقبور
- Topic: `ziyarat-nisa-qubur`
- Final id: `janaza-ziyara-nisa-taalim`
- Target: `janaza` / `ziyarat-qubur`
- المسار المفضّل: `align_existing`
- أمر الاعتماد الحرفي:
```
اعتمد ترقية زيارة النساء للقبور إلى books.json
```
- بعد تحديث التوقيع في JSON:
```bash
node scripts/apply-fiqh-promotion.mjs \
  --topic=ziyarat-nisa-qubur \
  --approve='اعتمد ترقية زيارة النساء للقبور إلى books.json' \
  --dry-run
```

### قائمة التوقيع
- [ ] الموافقة على محاذاة المعتمد المنشور (كراهة زيارة النساء)
- [ ] صيغة الخلاف لا تنقض عرض الكتالوج
- [ ] تحريم الغلو بارز وكافٍ
- [ ] قرار الوضع: align_existing أو insert_new_lesson
- [ ] اعتماد بشري صريح قبل أي تعديل على books.json

المراجع: __________ التاريخ: __________

---

## hold (لا ترقية الآن)
- الشبهات الغذائية المعاصرة
- نوازل الجهاد المعاصرة
