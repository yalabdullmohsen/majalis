enum Tasmee3BadgeType {
  firstSession,
  threeDayStreak,
  sevenDayStreak,
  tenSessions,
  highAccuracy,
  reviewHero,
}

class Tasmee3Badge {
  final Tasmee3BadgeType type;
  final String title;
  final String description;
  final bool unlocked;
  final DateTime? unlockedAt;

  const Tasmee3Badge({
    required this.type,
    required this.title,
    required this.description,
    required this.unlocked,
    this.unlockedAt,
  });

  Tasmee3Badge copyWith({
    bool? unlocked,
    DateTime? unlockedAt,
  }) {
    return Tasmee3Badge(
      type: type,
      title: title,
      description: description,
      unlocked: unlocked ?? this.unlocked,
      unlockedAt: unlockedAt ?? this.unlockedAt,
    );
  }
}
