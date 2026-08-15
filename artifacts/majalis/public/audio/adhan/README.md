# أصول صوت الأذان

## داخل التطبيق (جودة كاملة)
`public/audio/adhan/*.mp3` — تشغيل عبر HTMLAudio عند فتح التطبيق.

## إشعارات iOS (قصيرة ≤٨ث)
`ios/App/App/Sounds/adhan-short-*.caf` + `adhan-seq-makkah-0N.caf`  
يجب أن تظهر في Copy Bundle Resources داخل `App.xcodeproj`.

## Android
`android/app/src/main/res/raw/adhan_short_*.mp3` و`prayer_*.mp3`

## قيود
لا Critical Alerts — لا تجاوز للصامت/Focus.
الأذان الكامل من إشعار والتطبيق مغلق غير مدعوم على iOS.
