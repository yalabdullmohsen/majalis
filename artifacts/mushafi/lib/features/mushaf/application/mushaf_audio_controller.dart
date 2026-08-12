import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';

import '../../tasmee3/domain/quran_ayah.dart';
import '../data/mushaf_audio_download_repository.dart';
import '../data/mushaf_audio_settings_repository.dart';
import '../data/reciters_catalog.dart';
import '../domain/mushaf_audio_settings.dart';
import '../domain/mushaf_audio_state.dart';
import '../domain/quran_reciter.dart';

class MushafAudioController extends StateNotifier<MushafAudioState> {
  final MushafAudioSettingsRepository settingsRepository;
  final MushafAudioDownloadRepository downloadRepository;

  MushafAudioController({
    required this.settingsRepository,
    required this.downloadRepository,
  }) : super(const MushafAudioState.idle()) {
    _init();
  }

  final AudioPlayer _player = AudioPlayer();
  StreamSubscription<PlayerState>? _playerStateSub;
  StreamSubscription<Duration>? _positionSub;
  StreamSubscription<Duration?>? _durationSub;
  Timer? _sleepTimer;

  MushafAudioSettings _settings = const MushafAudioSettings.defaults();
  List<QuranAyah> _playlist = const [];
  int _currentIndex = 0;
  int _repeatCounter = 1;
  int _rangeRepeatCounter = 1;

  Future<void> _init() async {
    _settings = await settingsRepository.load();

    _playerStateSub = _player.playerStateStream.listen((playerState) {
      if (playerState.processingState == ProcessingState.completed) {
        unawaited(_onCurrentCompleted());
      }
    });

    _positionSub = _player.positionStream.listen((position) {
      state = state.copyWith(position: position);
    });

    _durationSub = _player.durationStream.listen((duration) {
      state = state.copyWith(duration: duration ?? Duration.zero);
    });
  }

  Future<MushafAudioSettings> loadSettings() async {
    _settings = await settingsRepository.load();
    return _settings;
  }

  Future<void> saveSettings(MushafAudioSettings settings) async {
    _settings = settings;
    await settingsRepository.save(settings);
  }

  Future<void> playAyah(QuranAyah ayah) async {
    await playRange([ayah]);
  }

  Future<void> playRange(List<QuranAyah> ayahs) async {
    if (ayahs.isEmpty) return;

    final settings = await loadSettings();
    final reciter = RecitersCatalog.byId(settings.reciterId);
    final sorted = _sortAyahs(ayahs);

    final firstLocal = await downloadRepository.find(
      reciterId: reciter.id,
      surah: sorted.first.ref.surah,
      ayah: sorted.first.ref.ayah,
    );

    if (!reciter.isConfigured && firstLocal == null) {
      state = MushafAudioState(
        status: MushafAudioStatus.error,
        errorMessage:
            'لا يوجد مصدر صوت مرخص لهذا القارئ. أضف رابطا صوتيا مرخصا أولا.',
        reciterId: reciter.id,
        reciterName: reciter.nameArabic,
      );
      return;
    }

    _playlist = sorted;
    _currentIndex = 0;
    _repeatCounter = settings.repeatAyahCount;
    _rangeRepeatCounter = settings.repeatRangeCount;

    _startSleepTimerIfNeeded(settings);

    await _playCurrent(reciter: reciter);
  }

  Future<void> _playCurrent({
    required QuranReciter reciter,
  }) async {
    if (_playlist.isEmpty ||
        _currentIndex < 0 ||
        _currentIndex >= _playlist.length) {
      state = const MushafAudioState(status: MushafAudioStatus.completed);
      return;
    }

    final ayah = _playlist[_currentIndex];
    final url = reciter.ayahUrl(
      surah: ayah.ref.surah,
      ayah: ayah.ref.ayah,
    );

    state = MushafAudioState(
      status: MushafAudioStatus.loading,
      currentSurah: ayah.ref.surah,
      currentAyah: ayah.ref.ayah,
      fromSurah: _playlist.first.ref.surah,
      fromAyah: _playlist.first.ref.ayah,
      toSurah: _playlist.last.ref.surah,
      toAyah: _playlist.last.ref.ayah,
      reciterId: reciter.id,
      reciterName: reciter.nameArabic,
      repeatRemaining: _repeatCounter,
    );

    try {
      final downloaded = await downloadRepository.find(
        reciterId: reciter.id,
        surah: ayah.ref.surah,
        ayah: ayah.ref.ayah,
      );

      if (downloaded != null) {
        await _player.setFilePath(downloaded.localPath);
      } else if (!reciter.isConfigured) {
        state = state.copyWith(
          status: MushafAudioStatus.error,
          errorMessage:
              'لا يوجد مصدر صوت مرخص لهذا القارئ. أضف رابطا صوتيا مرخصا أولا.',
        );
        return;
      } else {
        await _player.setUrl(url);
      }

      await _player.play();

      state = state.copyWith(status: MushafAudioStatus.playing);
    } catch (_) {
      state = state.copyWith(
        status: MushafAudioStatus.error,
        errorMessage:
            'تعذر تشغيل الصوت. تحقق من رابط الصوت أو الاتصال بالإنترنت.',
      );
    }
  }

  Future<void> _onCurrentCompleted() async {
    if (_playlist.isEmpty) return;

    final settings = _settings;
    final reciter = RecitersCatalog.byId(settings.reciterId);

    if (_repeatCounter > 1) {
      _repeatCounter--;
      await _playCurrent(reciter: reciter);
      return;
    }

    if (!settings.playNextAyahAutomatically) {
      state = state.copyWith(status: MushafAudioStatus.completed);
      return;
    }

    _currentIndex++;

    if (_currentIndex >= _playlist.length) {
      if (_rangeRepeatCounter > 1) {
        _rangeRepeatCounter--;
        _currentIndex = 0;
        _repeatCounter = settings.repeatAyahCount;
        await _playCurrent(reciter: reciter);
        return;
      }

      state = state.copyWith(status: MushafAudioStatus.completed);
      return;
    }

    _repeatCounter = settings.repeatAyahCount;
    await _playCurrent(reciter: reciter);
  }

  Future<void> pause() async {
    await _player.pause();
    state = state.copyWith(status: MushafAudioStatus.paused);
  }

  Future<void> resume() async {
    await _player.play();
    state = state.copyWith(status: MushafAudioStatus.playing);
  }

  Future<void> stop() async {
    _sleepTimer?.cancel();
    await _player.stop();
    state = const MushafAudioState.idle();
  }

  Future<void> next() async {
    if (_playlist.isEmpty) return;

    final reciter = RecitersCatalog.byId(_settings.reciterId);

    if (_currentIndex >= _playlist.length - 1) return;

    _currentIndex++;
    _repeatCounter = _settings.repeatAyahCount;

    await _playCurrent(reciter: reciter);
  }

  Future<void> previous() async {
    if (_playlist.isEmpty) return;

    final reciter = RecitersCatalog.byId(_settings.reciterId);

    if (_currentIndex <= 0) return;

    _currentIndex--;
    _repeatCounter = _settings.repeatAyahCount;

    await _playCurrent(reciter: reciter);
  }

  void _startSleepTimerIfNeeded(MushafAudioSettings settings) {
    _sleepTimer?.cancel();

    if (settings.sleepTimerMinutes <= 0) {
      return;
    }

    _sleepTimer = Timer(
      Duration(minutes: settings.sleepTimerMinutes),
      () {
        unawaited(stop());
      },
    );
  }

  List<QuranAyah> _sortAyahs(List<QuranAyah> ayahs) {
    final sorted = [...ayahs];

    sorted.sort((a, b) {
      final surahCompare = a.ref.surah.compareTo(b.ref.surah);

      if (surahCompare != 0) {
        return surahCompare;
      }

      return a.ref.ayah.compareTo(b.ref.ayah);
    });

    return sorted;
  }

  @override
  void dispose() {
    _sleepTimer?.cancel();
    _playerStateSub?.cancel();
    _positionSub?.cancel();
    _durationSub?.cancel();
    _player.dispose();
    super.dispose();
  }
}
