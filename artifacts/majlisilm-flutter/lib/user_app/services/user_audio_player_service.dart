import 'package:just_audio/just_audio.dart';

import '../../shared/constants/majlis_constants.dart';

/// User-module wrapper around [just_audio] — namespaced to avoid admin collisions.
class UserAudioPlayerService {
  UserAudioPlayerService({AudioPlayer? player}) : _player = player ?? AudioPlayer();

  final AudioPlayer _player;
  String? _currentUrl;

  AudioPlayer get player => _player;
  String? get currentUrl => _currentUrl;
  bool get playing => _player.playing;

  Stream<PlayerState> get playerStateStream => _player.playerStateStream;
  Stream<Duration?> get durationStream => _player.durationStream;
  Stream<Duration> get positionStream => _player.positionStream;

  Future<void> playUrl(String url) async {
    if (_currentUrl != url) {
      await _player.setUrl(url);
      _currentUrl = url;
    }
    await _player.play();
  }

  Future<void> playAyah(int surah, int ayah, {String reciter = 'Alafasy_128kbps'}) {
    return playUrl(MajlisConstants.ayahAudioUrl(surah, ayah, reciter: reciter));
  }

  /// Returns `true` if audio is now playing.
  Future<bool> toggleAyah(int surah, int ayah) async {
    final url = MajlisConstants.ayahAudioUrl(surah, ayah);
    if (playing && _currentUrl == url) {
      await pause();
      return false;
    }
    await playUrl(url);
    return true;
  }

  Future<void> pause() => _player.pause();

  Future<void> stop() async {
    await _player.stop();
  }

  Future<void> setSpeed(double speed) => _player.setSpeed(speed);

  Future<void> dispose() async {
    await _player.dispose();
  }
}
