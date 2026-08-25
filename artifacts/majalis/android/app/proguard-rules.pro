# ProGuard / R8 — Capacitor WebView + ملحقات المجلس العلمي
# يحافظ على جسر JS الأصلي وخدمات الأذان/التلاوة.

-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Capacitor / Cordova bridge
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**

# تطبيق المجلس — plugins وخدمات الوسائط/الأذان
-keep class com.majlisilm.app.** { *; }
-keepclassmembers class com.majlisilm.app.** {
    @com.getcapacitor.PluginMethod *;
    public <methods>;
}

# لا تُحذَف واجهات WebView JS
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
