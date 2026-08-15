# إصلاح نظام الأذان — TestFlight (2026-08-15)

فرع: `fix/adhan-audio-testflight`

## ماذا أُصلح

1. **AdhanAudioService** (`src/lib/adhan-audio-service.ts`): طبقة تشغيل مركزية تفعّل `AVAudioSession` عبر `ensureNativePlaybackAudioSession` (category playback) قبل التشغيل، مع تسجيل أخطاء واضحة و`probeAdhanAssetExists`.
2. **مسارات الصوت الكامل**: المصدر الرسمي `/public/audio/adhan/adhan-*-full.mp3` مع توافق المسارات القديمة `/sounds/adhan/*`.
3. **أصوات إشعار قصيرة**: `adhan-short-{makkah,madinah,egypt,aqsa,takbeerat}.caf` في `ios/App/App/Sounds/` ومسجّلة في Copy Bundle Resources؛ نظائر Android في `res/raw/`.
4. **ربط المؤذن ↔ صوت الإشعار** عبر `notificationSound` في `adhan-offline-assets` و`resolveAdhanStyleNotificationSound`.
5. **إعدادات الأذان**: زر «اختبار الصوت»، حالة إذن (مسموح/مرفوض/غير محدد)، «اختبار إشعار بعد 15 ثانية»، نص قيود iOS، لوحة تشخيص (إذن، إشعارات مجدولة، مؤذن، وجود الملفات).
6. **سجلات الجدولة**: عند كل إشعار صلاة يُطبع `prayerName, time, soundName, notificationId`.
7. **UIBackgroundModes = audio** موجود مسبقًا في `Info.plist` (مع remote-notification).

## ماذا يعمل في TestFlight (بعد Archive + رفع بشري)

| السيناريو | المتوقع |
|-----------|---------|
| التطبيق مفتوح | أذان كامل عبر AudioService |
| خلفية بعد بدء التشغيل من التطبيق | استمرار التشغيل (Background Mode: Audio) |
| شاشة مقفلة بعد بدء التشغيل | يستمر طالما الجلسة playback نشطة |
| التطبيق مُنهى (killed) | إشعار محلي بصوت قصير ≤٣٠ث فقط |
| الصامت OFF / Focus OFF | صوت الإشعار حسب مستوى الصوت |
| الصامت ON أو Focus ON | قد يُكتم الصوت — **لا تجاوز بدون Critical Alerts** |

## ما لا يمكن فعله (قيود Apple)

- تشغيل أذان كامل عند إغلاق التطبيق بالكامل — فقط صوت إشعار قصير في الحزمة.
- تجاوز Ring/Silent switch أو Focus Modes بدون **Critical Alerts entitlement** من Apple.
- لا نستخدم APIs خاصة أو حيل ممنوعة.

## هل نحتاج Critical Alerts؟

**لا للوظيفة الأساسية** (أذان داخل التطبيق + إشعار قصير عند الإغلاق).  
**نعم فقط** إن أردتم تجاوز الصامت/Focus قانونياً — يتطلب موافقة Apple منفصلة؛ غير مفعّل في هذا الإصدار.

## Checklist اختبار على iPhone حقيقي

- [ ] app open — اختبار الصوت
- [ ] app background — استمرار بعد بدء التشغيل
- [ ] screen locked — استمرار بعد بدء التشغيل
- [ ] app killed — إشعار 15ث بصوت قصير
- [ ] silent mode off
- [ ] silent mode on (متوقع كتم أو تخفيف)
- [ ] Focus off
- [ ] Focus on (متوقع كتم حسب إعدادات Focus)
- [ ] Xcode: Signing & Capabilities → Background Modes → Audio
- [ ] Bundle يحتوي `adhan-short-*.caf`

## ملاحظات الوكيل

- تأكد أن أصوات الإشعارات مضافة إلى Copy Bundle Resources في Xcode (جذر الـ Bundle).
- نفّذ محلياً: `pnpm install` / typecheck / lint / build / `npx cap sync ios`.
- **Archive ورفع TestFlight** يتطلبان حساب Apple Signing على جهاز المطوّر — لم يُنفَّذا من بيئة الوكيل.
- إذن `@capacitor/local-notifications` يعرض `display`؛ على iOS يطلب النظام alert+sound+badge معًا تحت هذا الطلب.
- إصلاح جذري: ملفات `.caf` كانت معرّفة في المشروع دون إدراجها في `PBXResourcesBuildPhase` — أُضيفت الآن وتُنسخ إلى جذر الحزمة.
