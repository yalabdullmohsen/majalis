# قائمة تحقق النشر — مجالس العلم
## الخطوات اليدوية المتبقية بعد قبول الحسابات

---

## ⚠️ تنبيه حرج: keystore Android
> **احفظ ثلاث نسخ من ملف keystore الأندرويد في أماكن منفصلة.**
> فقدانه = استحالة تحديث التطبيق إلى الأبد.
> النسخ المنصوح بها: محرك USB، Google Drive مُشفَّر، بريد إلكتروني شخصي.

---

## 1. إعداد حسابات المطورين (مرة واحدة)
- [ ] إنشاء حساب Apple Developer: developer.apple.com ($99/سنة)
- [ ] إنشاء حساب Google Play Console: play.google.com/console ($25 مرة واحدة)
- [ ] إنشاء App Store Connect record لـ "مجالس العلم" (Bundle: com.majlisilm.app)
- [ ] إنشاء Google Play app listing

---

## 2. إعداد بيئة البناء المحلية
- [ ] تثبيت Android Studio (للأندرويد)
- [ ] تثبيت Xcode 15+ (للـ iOS) — Mac فقط
- [ ] تثبيت Java 17+ (مطلوب لـ Gradle)
- [ ] إعداد ANDROID_HOME و PATH
- [ ] تثبيت pnpm: `npm install -g pnpm`

---

## 3. توليد أيقونات وشاشة البداية
```bash
cd artifacts/majalis
# ضع ملف icon-1024.png وsplash-2732.png في مجلد resources/
npx @capacitor/assets generate --iconBackgroundColor "#153025" --splashBackgroundColor "#153025"
```
- [ ] التحقق من الأيقونات في: android/app/src/main/res/mipmap-*/
- [ ] التحقق من الأيقونات في: ios/App/App/Assets.xcassets/

---

## 4. بناء Android (APK/AAB)
```bash
cd artifacts/majalis
npm run mobile:sync
# ثم في Android Studio:
# Build > Generate Signed Bundle/APK
# اختر Android App Bundle (AAB) للـ Play Store
```
- [ ] إنشاء keystore جديد: `keytool -genkey -v -keystore majalisilm-release.keystore -alias majalisilm -keyalg RSA -keysize 2048 -validity 10000`
- [ ] **حفظ ثلاث نسخ من keystore** (تنبيه حرج أعلاه)
- [ ] توقيع AAB بـ release keystore
- [ ] اختبار AAB على جهاز حقيقي

---

## 5. بناء iOS (IPA)
```bash
cd artifacts/majalis
npm run mobile:sync
# ثم افتح Xcode:
npx cap open ios
# في Xcode: Product > Archive > Distribute App
```
- [ ] إنشاء App ID في Apple Developer Console
- [ ] إنشاء Provisioning Profile (Distribution)
- [ ] إنشاء Certificate (Distribution)
- [ ] اختبار على TestFlight قبل النشر الرسمي

---

## 6. بيانات المتجر
- [ ] رفع وصف التطبيق من store-assets/description-ar.txt
- [ ] رفع الكلمات المفتاحية من store-assets/keywords.txt
- [ ] تصوير 5 لقطات شاشة لـ iPhone (1290×2796 للـ Plus أو 1242×2688)
- [ ] تصوير 5 لقطات شاشة لـ Android (1080×1920 أو 1440×2960)
- [ ] رفع الأيقونة 1024×1024
- [ ] ملء نموذج تصنيف المحتوى (IARC لـ Play — 4+ لـ App Store)
- [ ] إدخال رابط سياسة الخصوصية: https://majlisilm.com/privacy
- [ ] إدخال رابط حذف الحساب: https://majlisilm.com/account-deletion (مطلوب Play)

---

## 7. المراجعة والنشر
- [ ] **Android**: رفع AAB في Internal Testing أولاً، ثم Production
- [ ] **iOS**: رفع IPA عبر Transporter، ثم إرسال للمراجعة في App Store Connect
- [ ] الانتظار: Android 2-3 أيام / iOS 1-7 أيام
- [ ] بعد القبول: اختبار التحديث التلقائي (cap sync)

---

## 8. بعد النشر الأول
- [ ] تفعيل Google Play App Signing (لا يمكن التراجع — فعّله منذ البداية)
- [ ] إعداد Firebase Crashlytics (اختياري لتتبع الأخطاء)
- [ ] إعداد App Store Connect Analytics
- [ ] إعداد Google Play Reviews notifications
- [ ] مراجعة ربع سنوية لتحديث الإصدار: `npm version patch && npm run mobile:sync`

---

## 🔄 سكربتات الإصدار الدوري
```bash
# تحديث صغير (1.0.0 → 1.0.1)
npm version patch
npm run mobile:sync
# ثم build في Android Studio / Xcode

# تحديث متوسط (1.0.0 → 1.1.0)
npm version minor
npm run mobile:sync
```

---

## 📞 روابط مفيدة
- Apple Developer: https://developer.apple.com
- Google Play Console: https://play.google.com/console
- Capacitor Docs: https://capacitorjs.com/docs
- Supabase Dashboard: https://app.supabase.com
