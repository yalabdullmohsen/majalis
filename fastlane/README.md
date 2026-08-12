# Fastlane — رفع iOS (TestFlight)

المسار: Capacitor app في `artifacts/majalis/ios/App`.

`ios/App/App/public` **غير متتبَّع في git**؛ يُولَّد عبر `pnpm --filter @workspace/majalis run build` ثم `cap sync ios` (انظر workflows و`scripts/prepare-ios.sh`). لا ترفع حزمة من مرآة `public` قديمة ملتزَمة.

## Lanes

| Lane | الوظيفة |
|---|---|
| `ios beta` | بناء موقّع + رفع TestFlight (داخلي) |
| `ios build_only` | أرشفة محلية بلا رفع (اختبار CI/macOS) |

Android Internal Testing: يُضاف lane لاحقاً عبر `supply` بعد تجهيز `google-play` JSON — **لا يُرفع سر في المستودع**.

## أسرار مطلوبة (Environment / CI secrets فقط)

| المتغير | الغرض |
|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | معرف مفتاح ASC |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ASC |
| `APP_STORE_CONNECT_API_KEY_KEY` | محتوى `.p8` بصيغة Base64 |
| `APPLE_TEAM_ID` | فريق التطوير (افتراضي في Fastfile إن وُجد) |
| `APP_IDENTIFIER` | Bundle ID (افتراضي `com.yousef.majlisilm`) |
| `ITC_APPLE_ID` | Apple ID الرقمي للتطبيق (اختياري للرفع) |
| `TESTFLIGHT_CHANGELOG` | ملاحظات البناء (اختياري) |

لـ Google Play Internal (لاحقاً):

| المتغير | الغرض |
|---|---|
| `GOOGLE_PLAY_JSON_KEY` أو مسار ملف الخدمة | حساب خدمة Play Console |
| `ANDROID_KEYSTORE_*` | توقيع الحزمة — خارج git |

## تشغيل محلي (macOS)

```bash
cd /path/to/majalis-correct
bundle exec fastlane ios beta
```

لا تضع ملفات `.p8` أو keystore داخل المستودع. استخدم GitHub Actions secrets أو Keychain محلي.
