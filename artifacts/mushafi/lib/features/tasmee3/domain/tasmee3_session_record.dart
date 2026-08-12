import 'recitation_target.dart';

class Tasmee3SessionRecord {
  final String id;
  final RecitationTarget target;
  final int accuracyPercent;
  final int mistakesCount;
  final int durationSeconds;
  final DateTime createdAt;

  const Tasmee3SessionRecord({
    required this.id,
    required this.target,
    required this.accuracyPercent,
    required this.mistakesCount,
    required this.durationSeconds,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fromSurah': target.from.surah,
      'fromAyah': target.from.ayah,
      'toSurah': target.to.surah,
      'toAyah': target.to.ayah,
      'mode': target.mode.name,
      'accuracyPercent': accuracyPercent,
      'mistakesCount': mistakesCount,
      'durationSeconds': durationSeconds,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  static Tasmee3SessionRecord fromJson(
    Map<String, dynamic> json,
    RecitationTarget Function(Map<String, dynamic>) targetParser,
  ) {
    return Tasmee3SessionRecord(
      id: json['id'] as String,
      target: targetParser(json),
      accuracyPercent: json['accuracyPercent'] as int,
      mistakesCount: json['mistakesCount'] as int,
      durationSeconds: json['durationSeconds'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
