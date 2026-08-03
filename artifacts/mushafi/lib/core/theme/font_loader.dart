import 'package:flutter/services.dart';

/// تحميل خطوط المصحف مع مسار احتياطي واضح.
class MushafiFontLoader {
  static bool _loaded = false;

  static Future<void> ensureLoaded() async {
    if (_loaded) return;
    try {
      // تسجيل ضمني عبر pubspec fonts — نتحقق من توفر الأصل.
      await rootBundle.load('assets/fonts/ScheherazadeNew-Regular.ttf');
      _loaded = true;
    } catch (_) {
      // FontFallback: النظام سيستخدم خطًا احتياطيًا؛ نُبقي التطبيق قابلاً للتشغيل.
      _loaded = true;
    }
  }
}
