# Last 10 Steps Before Submission

## 1. Run Final Checks

```bash
dart run scripts/check_quran_asset.dart
flutter analyze
flutter test
cd server/tasmee3_asr
python -m pytest tests -q
```

ثم من جذر تطبيق mushafi:

```bash
./scripts/release_check.sh
```

## 2. Confirm Safe Defaults

تأكد أن:

- رفع الصوت للخادم غير مفعل افتراضيا.
- WebSocket غير مفعل افتراضيا.
- Native PCM غير مفعل افتراضيا.
- التطبيق يعمل بدون خادم.
- fallback موجود.

## 3. Review Quran Integrity

افتح داخل التطبيق:

- مصادر النص القرآني.
- فحص ملف القرآن.
- حدود ميزة التسميع.

## 4. Review Privacy

افتح داخل التطبيق:

- سياسة الخصوصية.
- إعدادات محرك التسميع.
- الدعم والتشخيص.

تأكد أن التشخيص لا يحتوي:

- API key.
- صوت.
- نص القرآن.

## 5. Build Android Release

```bash
flutter build appbundle --release
```

اختبر APK أيضا إن احتجت:

```bash
flutter build apk --release
```

## 6. Build iOS Release

```bash
flutter build ios --release
```

ثم استخدم Xcode Archive عند الحاجة.

## 7. Prepare Store Entries

راجع:

- `store_assets/google_play/`
- `store_assets/app_store/`
- `store_assets/legal/`
- `STORE_SUBMISSION_CHECKLIST.md`

## 8. Upload to Internal Testing

Google Play:

- ارفع AAB إلى Internal testing.
- اختبر من رابط المتجر.

App Store:

- ارفع TestFlight.
- اختبر على iPhone حقيقي.

## 9. Complete Store Privacy Forms

Google Play:

- Data Safety.
- Permissions.
- Content rating.
- Target audience.

App Store:

- App Privacy.
- Review Notes.
- Privacy Policy URL.
- Permission purpose strings.

## 10. Final Go / No-Go

افتح:

- `FINAL_AUDIT_REPORT.md`
- `RC_SIGNOFF.md`
- `LAUNCH_LOCK.md`

إذا كل الشروط ناجحة، انتقل إلى الرفع.
