enum MushafAudioStatus {
  idle,
  loading,
  playing,
  paused,
  completed,
  error,
}

class MushafAudioState {
  final MushafAudioStatus status;
  final int? currentSurah;
  final int? currentAyah;
  final int? fromSurah;
  final int? fromAyah;
  final int? toSurah;
  final int? toAyah;
  final String? reciterId;
  final String? reciterName;
  final String? errorMessage;
  final int repeatRemaining;
  final Duration position;
  final Duration duration;

  const MushafAudioState({
    required this.status,
    this.currentSurah,
    this.currentAyah,
    this.fromSurah,
    this.fromAyah,
    this.toSurah,
    this.toAyah,
    this.reciterId,
    this.reciterName,
    this.errorMessage,
    this.repeatRemaining = 0,
    this.position = Duration.zero,
    this.duration = Duration.zero,
  });

  const MushafAudioState.idle() : this(status: MushafAudioStatus.idle);

  bool get isPlaying => status == MushafAudioStatus.playing;
  bool get hasCurrentAyah => currentSurah != null && currentAyah != null;

  MushafAudioState copyWith({
    MushafAudioStatus? status,
    int? currentSurah,
    int? currentAyah,
    int? fromSurah,
    int? fromAyah,
    int? toSurah,
    int? toAyah,
    String? reciterId,
    String? reciterName,
    String? errorMessage,
    int? repeatRemaining,
    Duration? position,
    Duration? duration,
  }) {
    return MushafAudioState(
      status: status ?? this.status,
      currentSurah: currentSurah ?? this.currentSurah,
      currentAyah: currentAyah ?? this.currentAyah,
      fromSurah: fromSurah ?? this.fromSurah,
      fromAyah: fromAyah ?? this.fromAyah,
      toSurah: toSurah ?? this.toSurah,
      toAyah: toAyah ?? this.toAyah,
      reciterId: reciterId ?? this.reciterId,
      reciterName: reciterName ?? this.reciterName,
      errorMessage: errorMessage,
      repeatRemaining: repeatRemaining ?? this.repeatRemaining,
      position: position ?? this.position,
      duration: duration ?? this.duration,
    );
  }
}
