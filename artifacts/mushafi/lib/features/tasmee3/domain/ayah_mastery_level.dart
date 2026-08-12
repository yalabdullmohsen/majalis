enum AyahMasteryLevel {
  newAyah,
  weak,
  learning,
  good,
  mastered,
}

extension AyahMasteryLevelLabel on AyahMasteryLevel {
  String get arabicLabel {
    switch (this) {
      case AyahMasteryLevel.newAyah:
        return 'جديدة';
      case AyahMasteryLevel.weak:
        return 'ضعيفة';
      case AyahMasteryLevel.learning:
        return 'قيد التثبيت';
      case AyahMasteryLevel.good:
        return 'جيدة';
      case AyahMasteryLevel.mastered:
        return 'متقنة';
    }
  }
}
