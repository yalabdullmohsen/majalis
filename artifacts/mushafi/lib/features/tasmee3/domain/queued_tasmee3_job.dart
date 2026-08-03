class QueuedTasmee3Job {
  final String id;
  final String audioPath;
  final String endpoint;
  final DateTime createdAt;
  final int retryCount;
  final String reason;

  const QueuedTasmee3Job({
    required this.id,
    required this.audioPath,
    required this.endpoint,
    required this.createdAt,
    required this.retryCount,
    required this.reason,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'audioPath': audioPath,
      'endpoint': endpoint,
      'createdAt': createdAt.toIso8601String(),
      'retryCount': retryCount,
      'reason': reason,
    };
  }

  factory QueuedTasmee3Job.fromJson(Map<String, dynamic> json) {
    return QueuedTasmee3Job(
      id: json['id'] as String,
      audioPath: json['audioPath'] as String,
      endpoint: json['endpoint'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      retryCount: json['retryCount'] as int? ?? 0,
      reason: json['reason'] as String? ?? '',
    );
  }
}
