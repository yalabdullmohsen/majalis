# دليل بناء ونشر مجالس العلم — الجوّال

دليل عربي خطوة بخطوة لبناء ورفع نسخة جديدة لكل متجر.

---

## المتطلبات الأولية (مرة واحدة)

| الأداة | الإصدار | الرابط |
|--------|---------|--------|
| Node.js | 20+ | nodejs.org |
| pnpm | 9+ | `npm i -g pnpm` |
| Android Studio | أحدث | developer.android.com |
| Xcode | 15+ | Mac App Store |
| Java | 17+ | adoptium.net |

---

## بناء ونشر إصدار جديد

### الخطوة 1 — رفع رقم الإصدار
```bash
cd /Users/alabdullmohsen/majalis-correct/artifacts/majalis

# تحديث صغير (bug fix): 1.0.0 → 1.0.1
npm version patch

# تحديث متوسط (ميزة جديدة): 1.0.0 → 1.1.0
npm version minor

# تحديث رئيسي: 1.0.0 → 2.0.0
npm version major
```

> بعد `npm version`، حدّث `versionCode` في `android/app/build.gradle` يدوياً (أضف 1 لكل إصدار).

### الخطوة 2 — بناء ومزامنة
```bash
npm run mobile:sync
# يبني web ثم يزامن Capacitor مع android/ و ios/
```

### الخطوة 3 — بناء Android (AAB)
```bash
npx cap open android
```
ثم في Android Studio:
1. `Build > Generate Signed Bundle/APK`
2. اختر **Android App Bundle**
3. اختر keystore من `majalisilm-release.keystore`
4. الإصدار: **release**
5. الملف الناتج: `android/app/release/app-release.aab`

### الخطوة 4 — رفع Android
1. افتح [Google Play Console](https://play.google.com/console)
2. التطبيق > الإصدارات > Production > إنشاء إصدار جديد
3. ارفع ملف `.aab`
4. راجع وأرسل للنشر

### الخطوة 5 — بناء iOS (IPA)
```bash
npx cap open ios
```
ثم في Xcode:
1. اختر الجهاز الحقيقي (أو Any iOS Device)
2. `Product > Archive`
3. في نافذة Organizer: **Distribute App > App Store Connect**
4. اتبع الخطوات حتى الرفع

### الخطوة 6 — رفع iOS
1. افتح [App Store Connect](https://appstoreconnect.apple.com)
2. تطبيقاتي > مجالس العلم > TestFlight أو App Store
3. أضف إصداراً جديداً، اختر البنية المرفوعة
4. احفظ وأرسل للمراجعة

---

## تحديث سريع (web فقط — بدون متاجر)
```bash
npm run build && npx cap sync
# كافٍ عند تغيير محتوى JS/HTML فقط
# Android: npx cap open android > Run
# iOS: npx cap open ios > Run
```

---

## ملفات مهمة
| الملف | الغرض |
|-------|--------|
| `capacitor.config.ts` | إعدادات Capacitor (appId, plugins) |
| `android/app/build.gradle` | versionCode / versionName |
| `package.json` | version (المصدر الرئيسي) |
| `store-assets/checklist-ar.md` | قائمة تحقق كاملة |
| `store-assets/description-ar.txt` | نصوص المتاجر |
| `store-assets/keywords.txt` | الكلمات المفتاحية |

---

## حل المشكلات الشائعة

**`cap sync` يفشل:**
```bash
npm run build  # تأكد من نجاح البناء أولاً
npx cap sync --verbose
```

**Gradle build يفشل:**
```bash
cd android && ./gradlew clean && cd ..
npx cap sync
```

**iOS Signing error:**
- تأكد من تحديد Team صحيح في Xcode > Signing & Capabilities
- تحقق من Provisioning Profile لم تنتهِ صلاحيته

---

## ⚠️ تذكير: keystore Android
احفظ `majalisilm-release.keystore` في **ثلاثة أماكن منفصلة**.
فقدانه يعني استحالة تحديث التطبيق إلى الأبد على Google Play.
