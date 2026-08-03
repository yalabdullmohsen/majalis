class MushafAudioSettings {
  final String reciterId;
  final int repeatAyahCount;
  final int repeatRangeCount;
  final bool autoScrollToPlayingAyah;
  final bool playNextAyahAutomatically;
  final int sleepTimerMinutes;

  const MushafAudioSettings({
    required this.reciterId,
    required this.repeatAyahCount,
    required this.repeatRangeCount,
    required this.autoScrollToPlayingAyah,
    required this.playNextAyahAutomatically,
    required this.sleepTimerMinutes,
  });

  const MushafAudioSettings.defaults()
      : reciterId = 'husary',
        repeatAyahCount = 1,
        repeatRangeCount = 1,
        autoScrollToPlayingAyah = true,
        playNextAyahAutomatically = true,
        sleepTimerMinutes = 0;

  MushafAudioSettings copyWith({
    String? reciterId,
    int? repeatAyahCount,
    int? repeatRangeCount,
    bool? autoScrollToPlayingAyah,
    bool? playNextAyahAutomatically,
    int? sleepTimerMinutes,
  }) {
    return MushafAudioSettings(
      reciterId: reciterId ?? this.reciterId,
      repeatAyahCount: repeatAyahCount ?? this.repeatAyahCount,
      repeatRangeCount: repeatRangeCount ?? this.repeatRangeCount,
      autoScrollToPlayingAyah:
          autoScrollToPlayingAyah ?? this.autoScrollToPlayingAyah,
      playNextAyahAutomatically:
          playNextAyahAutomatically ?? this.playNextAyahAutomatically,
      sleepTimerMinutes: sleepTimerMinutes ?? this.sleepTimerMinutes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'reciterId': reciterId,
      'repeatAyahCount': repeatAyahCount,
      'repeatRangeCount': repeatRangeCount,
      'autoScrollToPlayingAyah': autoScrollToPlayingAyah,
      'playNextAyahAutomatically': playNextAyahAutomatically,
      'sleepTimerMinutes': sleepTimerMinutes,
    };
  }

  factory MushafAudioSettings.fromJson(Map<String, dynamic> json) {
    return MushafAudioSettings(
      reciterId: json['reciterId'] as String? ?? 'husary',
      repeatAyahCount: json['repeatAyahCount'] as int? ?? 1,
      repeatRangeCount: json['repeatRangeCount'] as int? ?? 1,
      autoScrollToPlayingAyah:
          json['autoScrollToPlayingAyah'] as bool? ?? true,
      playNextAyahAutomatically:
          json['playNextAyahAutomatically'] as bool? ?? true,
      sleepTimerMinutes: json['sleepTimerMinutes'] as int? ?? 0,
    );
  }
}
