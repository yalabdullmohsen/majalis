# Hotfix Plan

## متى نعمل Hotfix؟

اعمل Hotfix إذا ظهر:

- Crash عند فتح التطبيق.
- Crash عند بدء التسميع.
- مشكلة تمنع استخدام الميكروفون.
- مشكلة في ملف القرآن داخل الإصدار.
- مشكلة خصوصية.
- مشكلة تمنع فتح Dashboard.
- مشكلة تؤثر على عدد كبير من المستخدمين.

## خطوات Hotfix

1. أنشئ branch:
   `hotfix/v1.0.1`

2. أصلح المشكلة فقط.
   لا تضف ميزات جديدة.

3. شغل:

   ```bash
   dart run scripts/check_quran_asset.dart
   flutter analyze
   flutter test
   cd server/tasmee3_asr
   python -m pytest tests -q
   ```

4. حدّث version:

   ```yaml
   version: 1.0.1+2
   ```

5. حدّث CHANGELOG.md.

6. ابنِ Android:

   ```bash
   flutter build appbundle --release
   ```

7. ابنِ iOS إذا مطلوب:

   ```bash
   flutter build ios --release
   ```

8. اختبر Smoke Test سريع.

9. ارفع للمتاجر مع Release Notes واضحة.

## ممنوع في Hotfix

- إضافة WebSocket behavior جديد.
- تغيير SRS جذري.
- تغيير ملف القرآن.
- تغيير privacy behavior بدون تحديث الإفصاحات.
