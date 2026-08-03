class Tasmee3ErrorMapper {
  const Tasmee3ErrorMapper();

  String map(Object error) {
    final text = error.toString();

    if (text.contains('quran_uthmani.json') ||
        text.contains('ملف القرآن غير موجود')) {
      return 'ملف القرآن غير موجود. تأكد من إضافة quran_uthmani.json داخل assets/quran.';
    }

    if (text.contains('ملف القرآن فارغ') ||
        text.contains('آيات فارغة') ||
        text.contains('عدد السور غير صحيح') ||
        text.contains('عدد الآيات غير صحيح')) {
      return 'ملف القرآن غير سليم. افتح شاشة فحص ملف القرآن للمزيد من التفاصيل.';
    }

    if (text.contains('JSON') ||
        text.contains('FormatException') ||
        text.contains('صيغة ملف القرآن')) {
      return 'صيغة ملف البيانات غير صحيحة. يرجى التحقق من ملف القرآن أو الإعدادات.';
    }

    if (text.contains('microphone') ||
        text.contains('Microphone') ||
        text.contains('الميكروفون') ||
        text.contains('permission')) {
      return 'تعذر الوصول إلى الميكروفون. تحقق من الصلاحيات ثم حاول مرة أخرى.';
    }

    if (text.contains('SocketException') ||
        text.contains('Connection refused') ||
        text.contains('Failed host lookup') ||
        text.contains('HandshakeException')) {
      return 'تعذر الاتصال بالخادم. تأكد من اتصال الإنترنت أو إعدادات محرك التسميع.';
    }

    if (text.contains('401') || text.contains('403')) {
      return 'مفتاح الوصول للخادم غير صحيح أو غير مصرح.';
    }

    if (text.contains('timeout') ||
        text.contains('TimeoutException') ||
        text.contains('مهلة')) {
      return 'انتهت مهلة الاتصال. حاول مرة أخرى أو استخدم نطاقا أقصر.';
    }

    if (text.contains('WebSocket') || text.contains('ws://')) {
      return 'تعذر التسميع المباشر. سيتم استخدام الخادم العادي أو تعرف الجهاز إن أمكن.';
    }

    if (text.contains('SharedPreferences') ||
        text.contains('FlutterSecureStorage') ||
        text.contains('secure storage')) {
      return 'تعذر حفظ الإعدادات محليا. أعد تشغيل التطبيق ثم حاول مرة أخرى.';
    }

    // Preserve already-friendly Arabic StateError messages when possible.
    if (text.startsWith('StateError: ')) {
      final cleaned = text.substring('StateError: '.length).trim();
      if (cleaned.isNotEmpty && _looksArabic(cleaned)) {
        return cleaned;
      }
    }

    if (text.startsWith('Bad state: ')) {
      final cleaned = text.substring('Bad state: '.length).trim();
      if (cleaned.isNotEmpty && _looksArabic(cleaned)) {
        return cleaned;
      }
    }

    if (_looksArabic(text) && text.length < 180) {
      return text.replaceFirst(RegExp(r'^Exception:\s*'), '');
    }

    return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
  }

  bool _looksArabic(String value) {
    return RegExp(r'[\u0600-\u06FF]').hasMatch(value);
  }
}
