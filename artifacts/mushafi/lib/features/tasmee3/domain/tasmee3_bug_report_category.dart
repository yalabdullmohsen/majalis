enum Tasmee3BugReportCategory {
  startup,
  microphone,
  recitation,
  result,
  asrSettings,
  pdf,
  reminders,
  quranFile,
  dashboard,
  privacy,
  other,
}

extension Tasmee3BugReportCategoryLabel on Tasmee3BugReportCategory {
  String get arabicLabel {
    switch (this) {
      case Tasmee3BugReportCategory.startup:
        return 'فتح التطبيق';
      case Tasmee3BugReportCategory.microphone:
        return 'الميكروفون';
      case Tasmee3BugReportCategory.recitation:
        return 'جلسة التسميع';
      case Tasmee3BugReportCategory.result:
        return 'نتيجة التسميع';
      case Tasmee3BugReportCategory.asrSettings:
        return 'إعدادات محرك التسميع';
      case Tasmee3BugReportCategory.pdf:
        return 'تقرير PDF';
      case Tasmee3BugReportCategory.reminders:
        return 'التذكيرات';
      case Tasmee3BugReportCategory.quranFile:
        return 'ملف القرآن';
      case Tasmee3BugReportCategory.dashboard:
        return 'لوحة التسميع';
      case Tasmee3BugReportCategory.privacy:
        return 'الخصوصية';
      case Tasmee3BugReportCategory.other:
        return 'أخرى';
    }
  }
}
