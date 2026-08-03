enum KhatmahPlanStatus {
  active,
  completed,
  paused,
  archived,
}

extension KhatmahPlanStatusLabel on KhatmahPlanStatus {
  String get arabicLabel {
    switch (this) {
      case KhatmahPlanStatus.active:
        return 'نشطة';
      case KhatmahPlanStatus.completed:
        return 'مكتملة';
      case KhatmahPlanStatus.paused:
        return 'متوقفة مؤقتا';
      case KhatmahPlanStatus.archived:
        return 'مؤرشفة';
    }
  }
}
