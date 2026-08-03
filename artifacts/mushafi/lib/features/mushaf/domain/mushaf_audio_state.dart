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
  final String? reciterId;
  final String? errorMessage;

  const MushafAudioState({
    required this.status,
    this.currentSurah,
    this.currentAyah,
    this.reciterId,
    this.errorMessage,
  });

  const MushafAudioState.idle() : this(status: MushafAudioStatus.idle);

  MushafAudioState copyWith({
    MushafAudioStatus? status,
    int? currentSurah,
    int? currentAyah,
    String? reciterId,
    String? errorMessage,
  }) {
    return MushafAudioState(
      status: status ?? this.status,
      currentSurah: currentSurah ?? this.currentSurah,
      currentAyah: currentAyah ?? this.currentAyah,
      reciterId: reciterId ?? this.reciterId,
      errorMessage: errorMessage,
    );
  }
}
