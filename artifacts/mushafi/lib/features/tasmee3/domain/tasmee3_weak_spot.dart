import 'ayah_ref.dart';

enum WeakSpotType {
  repeatedMistake,
  lowAccuracy,
  missingWords,
  lowConfidence,
}

class Tasmee3WeakSpot {
  final AyahRef ayahRef;
  final WeakSpotType type;
  final String title;
  final String description;
  final int severity;

  const Tasmee3WeakSpot({
    required this.ayahRef,
    required this.type,
    required this.title,
    required this.description,
    required this.severity,
  });

  factory Tasmee3WeakSpot.fromJson(Map<String, dynamic> json) {
    return Tasmee3WeakSpot(
      ayahRef: AyahRef(
        surah: json['surah'] as int,
        ayah: json['ayah'] as int,
      ),
      type: _typeFromString(json['type'] as String?),
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      severity: json['severity'] as int? ?? 1,
    );
  }

  static WeakSpotType _typeFromString(String? value) {
    switch (value) {
      case 'repeatedMistake':
        return WeakSpotType.repeatedMistake;
      case 'lowAccuracy':
        return WeakSpotType.lowAccuracy;
      case 'missingWords':
        return WeakSpotType.missingWords;
      case 'lowConfidence':
        return WeakSpotType.lowConfidence;
      default:
        return WeakSpotType.lowAccuracy;
    }
  }
}
