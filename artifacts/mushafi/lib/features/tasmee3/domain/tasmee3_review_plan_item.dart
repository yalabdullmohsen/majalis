import 'ayah_ref.dart';

enum ReviewPriority {
  high,
  medium,
  low,
}

class Tasmee3ReviewPlanItem {
  final AyahRef ayahRef;
  final ReviewPriority priority;
  final String reason;
  final int recommendedRepeats;
  final DateTime createdAt;

  const Tasmee3ReviewPlanItem({
    required this.ayahRef,
    required this.priority,
    required this.reason,
    required this.recommendedRepeats,
    required this.createdAt,
  });

  String get priorityLabel {
    switch (priority) {
      case ReviewPriority.high:
        return 'عالية';
      case ReviewPriority.medium:
        return 'متوسطة';
      case ReviewPriority.low:
        return 'خفيفة';
    }
  }
}
