class MushafAudioDownload {
  final String id;
  final String reciterId;
  final int surah;
  final int ayah;
  final String localPath;
  final int fileSizeBytes;
  final DateTime downloadedAt;

  const MushafAudioDownload({
    required this.id,
    required this.reciterId,
    required this.surah,
    required this.ayah,
    required this.localPath,
    required this.fileSizeBytes,
    required this.downloadedAt,
  });

  String get key => buildKey(
        reciterId: reciterId,
        surah: surah,
        ayah: ayah,
      );

  static String buildKey({
    required String reciterId,
    required int surah,
    required int ayah,
  }) {
    return '$reciterId:$surah:$ayah';
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reciterId': reciterId,
      'surah': surah,
      'ayah': ayah,
      'localPath': localPath,
      'fileSizeBytes': fileSizeBytes,
      'downloadedAt': downloadedAt.toIso8601String(),
    };
  }

  factory MushafAudioDownload.fromJson(Map<String, dynamic> json) {
    return MushafAudioDownload(
      id: json['id'] as String,
      reciterId: json['reciterId'] as String,
      surah: json['surah'] as int,
      ayah: json['ayah'] as int,
      localPath: json['localPath'] as String,
      fileSizeBytes: json['fileSizeBytes'] as int? ?? 0,
      downloadedAt: DateTime.parse(json['downloadedAt'] as String),
    );
  }
}
