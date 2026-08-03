enum Tasmee3ReminderType {
  dailyGoal,
  streakProtection,
  weakSpotsReview,
  smartTime,
  ramadanWird,
}

extension Tasmee3ReminderTypeLabel on Tasmee3ReminderType {
  String get arabicLabel {
    switch (this) {
      case Tasmee3ReminderType.dailyGoal:
        return 'هدف التسميع اليومي';
      case Tasmee3ReminderType.streakProtection:
        return 'حماية سلسلة الاستمرار';
      case Tasmee3ReminderType.weakSpotsReview:
        return 'مراجعة مواضع الضعف';
      case Tasmee3ReminderType.smartTime:
        return 'تذكير ذكي';
      case Tasmee3ReminderType.ramadanWird:
        return 'ورد رمضان';
    }
  }
}
