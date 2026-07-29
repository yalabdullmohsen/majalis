/// Human-readable session feedback shown in the status banner.
enum RecitationSessionPhase {
  idle,
  requestingPermission,
  listening,
  paused,
  aligning,
  verseComplete,
  error,
}

class RecitationFeedback {
  const RecitationFeedback({
    required this.phase,
    required this.messageAr,
    this.detailAr,
  });

  final RecitationSessionPhase phase;
  final String messageAr;
  final String? detailAr;

  static const idle = RecitationFeedback(
    phase: RecitationSessionPhase.idle,
    messageAr: 'اضغط الميكروفون لبدء التسميع',
  );

  static const requestingPermission = RecitationFeedback(
    phase: RecitationSessionPhase.requestingPermission,
    messageAr: 'جاري طلب إذن الميكروفون…',
  );

  static const listening = RecitationFeedback(
    phase: RecitationSessionPhase.listening,
    messageAr: 'استمع الآن…',
  );

  static const paused = RecitationFeedback(
    phase: RecitationSessionPhase.paused,
    messageAr: 'التسميع متوقف مؤقتًا',
  );

  static const aligning = RecitationFeedback(
    phase: RecitationSessionPhase.aligning,
    messageAr: 'جاري مطابقة التلاوة…',
  );

  static const verseComplete = RecitationFeedback(
    phase: RecitationSessionPhase.verseComplete,
    messageAr: 'تلاوة صحيحة — أتممت الآية',
  );

  factory RecitationFeedback.error(String detail) => RecitationFeedback(
        phase: RecitationSessionPhase.error,
        messageAr: 'تعذّر التسميع',
        detailAr: detail,
      );

  factory RecitationFeedback.wordError(String word) => RecitationFeedback(
        phase: RecitationSessionPhase.aligning,
        messageAr: 'يوجد خطأ في الكلمة…',
        detailAr: word,
      );

  factory RecitationFeedback.correctProgress(int done, int total) =>
      RecitationFeedback(
        phase: RecitationSessionPhase.listening,
        messageAr: 'تلاوة صحيحة',
        detailAr: '$done / $total',
      );
}
