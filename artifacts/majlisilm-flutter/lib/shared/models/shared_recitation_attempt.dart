import 'shared_quran_verse.dart';

/// Recitation attempt payload — user AI test + admin review queue (Phase 2).
enum SharedRecitationStatus {
  pending,
  approved,
  rejected,
  flaggedAi,
}

class SharedRecitationAttempt {
  const SharedRecitationAttempt({
    required this.id,
    required this.userId,
    required this.userName,
    required this.verse,
    required this.aiScore,
    required this.audioUrl,
    required this.status,
    this.flagReason = '',
    this.submittedAt,
  });

  final String id;
  final String userId;
  final String userName;
  final SharedQuranVerse verse;

  /// 0.0 … 1.0
  final double aiScore;
  final String audioUrl;
  final SharedRecitationStatus status;
  final String flagReason;
  final DateTime? submittedAt;

  SharedRecitationAttempt copyWith({
    SharedRecitationStatus? status,
    double? aiScore,
    String? flagReason,
  }) {
    return SharedRecitationAttempt(
      id: id,
      userId: userId,
      userName: userName,
      verse: verse,
      aiScore: aiScore ?? this.aiScore,
      audioUrl: audioUrl,
      status: status ?? this.status,
      flagReason: flagReason ?? this.flagReason,
      submittedAt: submittedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'userName': userName,
        'verse': verse.toJson(),
        'aiScore': aiScore,
        'audioUrl': audioUrl,
        'status': status.name,
        'flagReason': flagReason,
        'submittedAt': submittedAt?.toIso8601String(),
      };

  factory SharedRecitationAttempt.fromJson(Map<String, dynamic> json) {
    return SharedRecitationAttempt(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      userName: json['userName'] as String? ?? '',
      verse: SharedQuranVerse.fromJson(
        (json['verse'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      ),
      aiScore: (json['aiScore'] as num?)?.toDouble() ?? 0,
      audioUrl: json['audioUrl'] as String? ?? '',
      status: SharedRecitationStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => SharedRecitationStatus.pending,
      ),
      flagReason: json['flagReason'] as String? ?? '',
      submittedAt: json['submittedAt'] != null
          ? DateTime.tryParse(json['submittedAt'] as String)
          : null,
    );
  }
}
