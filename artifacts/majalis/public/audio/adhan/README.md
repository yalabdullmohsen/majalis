# أصول صوت الأذان

## داخل التطبيق (جودة كاملة)
`public/audio/adhan/*-full.mp3` — تشغيل عبر AudioService / HTMLAudio عند فتح التطبيق.

## إشعارات iOS (قصيرة ≤٨ث + مقاطع متتابعة ≤٢٨ث)
`ios/App/App/Sounds/adhan-short-*.caf`  
`ios/App/App/Sounds/adhan-seq-makkah-0N.caf`  
يجب أن تظهر في Copy Bundle Resources داخل `App.xcodeproj` (المشروع بدون workspace منفصل).

## Android
`android/app/src/main/res/raw/adhan_short_*.mp3`  
`android/app/src/main/res/raw/adhan_seq_makkah_0N.mp3`

## قيود
لا Critical Alerts — لا تجاوز للصامت/Focus.  
الأذان الكامل من إشعار واحد والتطبيق مغلق غير مدعوم على iOS؛ الخيار التجريبي = مقاطع متتابعة كل ٢٩ث.
