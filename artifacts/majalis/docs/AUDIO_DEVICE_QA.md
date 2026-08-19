# قائمة اختبار الصوت على جهاز حقيقي

> استخدم هذه القائمة بعد `pnpm run generate:adhan-bundle` و `pnpm run audit:audio:quick` (أو الكامل).

## تلاوة القرآن

| # | السينario | iOS | Android | ملاحظات |
|---|-----------|-----|---------|---------|
| 1 | تشغيل آية → السورة كاملة | ☐ | ☐ | تحقق من gapless بين الآيات |
| 2 | شاشة القفل — اسم السورة/القارئ | ☐ | ☐ | Media Session |
| 3 | أزرار التحكم (تالي/سابق/إيقاف) | ☐ | ☐ | من شاشة القفل |
| 4 | مقاطعة مكالمة → استئناف | ☐ | ☐ | |
| 5 | نزع سماعات → إيقاف | ☐ | ☐ | iOS route change |
| 6 | تغيير القارئ — 3 قرّاء QA فقط | ☐ | ☐ | حصري، منشawi، عفاسي |
| 7 | تنزيل قارئ من الإعدادات | ☐ | ☐ | |
| 8 | وضع الطيران + تشغيل | ☐ | ☐ | iOS: Application Support |
| 9 | iCloud — التنزيلات غير مُنسخة | ☐ | n/a | `isExcludedFromBackup` |

## الأذان

| # | السينario | iOS | Android | ملاحظات |
|---|-----------|-----|---------|---------|
| 10 | إشعار صلاة — صوت ≤30ث | ☐ | ☐ | `adhan-short-*.caf` |
| 11 | Fajr — صوت مختلف | ☐ | ☐ | `adhan-short-makkah-fajr.caf` |
| 12 | فتح التطبيق → أذان كامل | ☐ | ☐ | `/audio/adhan/*.m4a` |
| 13 | وضع صامت / Focus | ☐ | ☐ | لا تجاوز (بدون Critical Alerts) |
| 14 | سلسلة iOS (اختياري) | ☐ | n/a | إعداد «أذان متتابع» + مكة |

## تفسير صوتي + onboarding

| # | السينario | iOS | Android |
|---|-----------|-----|---------|
| 15 | تفسير صوتي seek للآية | ☐ | ☐ | عند توفر مقاطع في الكتالوج |
| 16 | جولة المزايا — مرة واحدة | ☐ | ☐ |
| 17 | إعادة الجولة من الإعدادات | ☐ | ☐ |

## أوامر QA محلية

```bash
pnpm run generate:adhan-bundle    # توليد أصوات الأذان
pnpm run audit:audio:quick        # فحص سريع EveryAyah
pnpm run audit:audio              # فحص كامل 6236×3 (طويل)
pnpm run test:adhan-bundle-sounds
node --import tsx src/lib/__tests__/native-offline-audio-gate.test.ts
```
