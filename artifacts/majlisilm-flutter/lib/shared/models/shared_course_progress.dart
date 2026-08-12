/// Educational course progress — shared between user tracks and future admin analytics.
class SharedCourseProgress {
  const SharedCourseProgress({
    required this.courseId,
    required this.titleAr,
    required this.progress,
  });

  final String courseId;
  final String titleAr;

  /// 0.0 … 1.0
  final double progress;

  SharedCourseProgress copyWith({
    String? courseId,
    String? titleAr,
    double? progress,
  }) {
    return SharedCourseProgress(
      courseId: courseId ?? this.courseId,
      titleAr: titleAr ?? this.titleAr,
      progress: (progress ?? this.progress).clamp(0.0, 1.0),
    );
  }

  Map<String, dynamic> toJson() => {
        'courseId': courseId,
        'titleAr': titleAr,
        'progress': progress,
      };

  factory SharedCourseProgress.fromJson(Map<String, dynamic> json) {
    return SharedCourseProgress(
      courseId: json['courseId'] as String? ?? '',
      titleAr: json['titleAr'] as String? ?? '',
      progress: (json['progress'] as num?)?.toDouble() ?? 0,
    );
  }
}
