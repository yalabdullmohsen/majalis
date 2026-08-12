import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import 'package:mushafi/features/audio/data/audio_repository.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

enum RepeatMode { off, ayah, range, page, surah }

class AudioState {
  const AudioState({
    this.playing = false,
    this.current,
    this.speed = 1.0,
    this.repeat = RepeatMode.off,
    this.reciterId = 'alafasy',
  });

  final bool playing;
  final Ayah? current;
  final double speed;
  final RepeatMode repeat;
  final String reciterId;

  AudioState copyWith({
    bool? playing,
    Ayah? current,
    double? speed,
    RepeatMode? repeat,
    String? reciterId,
  }) =>
      AudioState(
        playing: playing ?? this.playing,
        current: current ?? this.current,
        speed: speed ?? this.speed,
        repeat: repeat ?? this.repeat,
        reciterId: reciterId ?? this.reciterId,
      );
}

class AudioController extends Notifier<AudioState> {
  late final AudioPlayer _player;
  final _repo = AudioRepository();

  @override
  AudioState build() {
    _player = AudioPlayer();
    ref.onDispose(() => _player.dispose());
    _player.playerStateStream.listen((s) {
      state = state.copyWith(playing: s.playing);
    });
    return const AudioState();
  }

  Future<void> playFromAyah(Ayah ayah) async {
    final reciter = _repo.byId(state.reciterId);
    final url = _repo.ayahUrl(reciter, ayah);
    try {
      await _player.setUrl(url.toString());
      await _player.setSpeed(state.speed);
      state = state.copyWith(current: ayah, playing: true);
      ref.read(highlightedAyahKeyProvider.notifier).state = ayah.key;
      await _player.play();
    } catch (_) {
      // بدون شبكة: نبقي الحالة مع فشل صامت ورسالة لاحقًا
      state = state.copyWith(current: ayah, playing: false);
    }
  }

  Future<void> repeatAyah(Ayah ayah) async {
    state = state.copyWith(repeat: RepeatMode.ayah);
    await playFromAyah(ayah);
  }

  Future<void> toggle() async {
    if (_player.playing) {
      await _player.pause();
    } else if (state.current != null) {
      await _player.play();
    }
  }

  Future<void> setSpeed(double speed) async {
    state = state.copyWith(speed: speed);
    await _player.setSpeed(speed);
  }

  Future<void> stop() async {
    await _player.stop();
    ref.read(highlightedAyahKeyProvider.notifier).state = null;
    state = state.copyWith(playing: false);
  }
}

final audioControllerProvider =
    NotifierProvider<AudioController, AudioState>(AudioController.new);
