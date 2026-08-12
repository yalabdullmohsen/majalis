enum Tasmee3TextVisibilityMode {
  showAll,
  hideAll,
  firstWordOnly,
  hifzTest,
  revealOnMistake,
}

extension Tasmee3TextVisibilityModeLabel on Tasmee3TextVisibilityMode {
  String get arabicLabel {
    switch (this) {
      case Tasmee3TextVisibilityMode.showAll:
        return 'عرض النص كاملا';
      case Tasmee3TextVisibilityMode.hideAll:
        return 'إخفاء النص';
      case Tasmee3TextVisibilityMode.firstWordOnly:
        return 'أول كلمة فقط';
      case Tasmee3TextVisibilityMode.hifzTest:
        return 'اختبار حفظ';
      case Tasmee3TextVisibilityMode.revealOnMistake:
        return 'إظهار عند الخطأ';
    }
  }
}
