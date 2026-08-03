import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import '../data/ayah_mastery_repository.dart';
import '../data/quran_forced_alignment_recognizer.dart';
import '../data/quran_repository.dart';
import '../data/quran_speech_recognizer.dart';
import '../data/tasmee3_session_repository.dart';
import '../data/advanced_quran_asr_recognizer.dart';
import '../domain/forced_alignment_result.dart';
import '../domain/live_audio_level.dart';
import '../domain/quran_ayah.dart';
import '../domain/recognized_word.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_mistake.dart';
import '../domain/tasmee3_result.dart';
import '../domain/tasmee3_session_diagnostics.dart';
import '../domain/tasmee3_session_record.dart';
import 'mistake_detection_engine.dart';
import 'tasmee3_srs_service.dart';

enum Tasmee3Status {
  idle,
  loadingQuran,
  requestingPermission,
  listening,
  uploadingAudio,
  analyzing,
  completed,
  error,
}

class Tasmee3State {
  final Tasmee3Status status;
  final RecitationTarget? target;
  final String recognizedText;
  final List<RecognizedWord> recognizedWords;
  final double confidence;
  final Tasmee3Result? result;
  final ForcedAlignmentResult? alignment;
  final LiveAudioLevel? audioLevel;
  final Tasmee3SessionDiagnostics? diagnostics;
  final int elapsedSeconds;
  final String? errorMessage;
  final Duration sessionDuration;

  const Tasmee3State({
    required this.status,
    this.target,
    this.recognizedText = '',
    this.recognizedWords = const [],
    this.confidence = 0,
    this.result,
    this.alignment,
    this.audioLevel,
    this.diagnostics,
    this.elapsedSeconds = 0,
    this.errorMessage,
    this.sessionDuration = Duration.zero,
  });

  const Tasmee3State.initial()
      : status = Tasmee3Status.idle,
        target = null,
        recognizedText = '',
        recognizedWords = const [],
        confidence = 0,
        result = null,
        alignment = null,
        audioLevel = null,
        diagnostics = null,
        elapsedSeconds = 0,
        errorMessage = null,
        sessionDuration = Duration.zero;

  Tasmee3State copyWith({
    Tasmee3Status? status,
    RecitationTarget? target,
    String? recognizedText,
    List<RecognizedWord>? recognizedWords,
    double? confidence,
    Tasmee3Result? result,
    ForcedAlignmentResult? alignment,
    LiveAudioLevel? audioLevel,
    Tasmee3SessionDiagnostics? diagnostics,
    int? elapsedSeconds,
    String? errorMessage,
    Duration? sessionDuration,
    bool clearResult = false,
    bool clearAlignment = false,
    bool clearAudioLevel = false,
    bool clearDiagnostics = false,
  }) {
    return Tasmee3State(
      status: status ?? this.status,
      target: target ?? this.target,
      recognizedText: recognizedText ?? this.recognizedText,
      recognizedWords: recognizedWords ?? this.recognizedWords,
      confidence: confidence ?? this.confidence,
      result: clearResult ? null : result ?? this.result,
      alignment: clearAlignment ? null : alignment ?? this.alignment,
      audioLevel: clearAudioLevel ? null : audioLevel ?? this.audioLevel,
      diagnostics:
          clearDiagnostics ? null : diagnostics ?? this.diagnostics,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      errorMessage: errorMessage,
      sessionDuration: sessionDuration ?? this.sessionDuration,
    );
  }
}

class Tasmee3Controller extends StateNotifier<Tasmee3State> {
  final QuranRepository quranRepository;
  final QuranSpeechRecognizer recognizer;
  final MistakeDetectionEngine engine;
  final Tasmee3SessionRepository sessionRepository;
  final AyahMasteryRepository ayahMasteryRepository;
  final Tasmee3SrsService srsService;
  final void Function()? onSessionSaved;

  StreamSubscription<RecognizedSegment>? _subscription;
  StreamSubscription<LiveAudioLevel>? _audioLevelSubscription;
  List<QuranAyah> _expectedAyahs = [];
  Timer? _sessionTimer;
  Timer? _elapsedTimer;
  DateTime? _startedAt;
  DateTime? _listenStartedAt;

  Tasmee3Controller({
    required this.quranRepository,
    required this.recognizer,
    required this.engine,
    required this.sessionRepository,
    required this.ayahMasteryRepository,
    required this.srsService,
    this.onSessionSaved,
  }) : super(const Tasmee3State.initial());

  Future<void> start(RecitationTarget target) async {
    try {
      if (!target.isValid) {
        state = state.copyWith(
          status: Tasmee3Status.error,
          errorMessage:
              'نطاق التسميع غير صحيح. اختر سورة واحدة ومن آية إلى آية بشكل صحيح.',
        );
        return;
      }

      _stopSessionTimer();
      _startedAt = DateTime.now();

      state = state.copyWith(
        status: Tasmee3Status.requestingPermission,
        target: target,
        recognizedText: '',
        recognizedWords: const [],
        confidence: 0,
        sessionDuration: Duration.zero,
        elapsedSeconds: 0,
        clearResult: true,
        clearAlignment: true,
        clearAudioLevel: true,
        errorMessage: null,
      );

      final micPermission = await Permission.microphone.request();

      if (!micPermission.isGranted) {
        state = state.copyWith(
          status: Tasmee3Status.error,
          errorMessage: 'لم يتم منح صلاحية الميكروفون.',
        );
        return;
      }

      state = state.copyWith(status: Tasmee3Status.loadingQuran);

      _expectedAyahs = await quranRepository.getAyahsInTarget(target);

      if (_expectedAyahs.isEmpty) {
        state = state.copyWith(
          status: Tasmee3Status.error,
          errorMessage: 'النطاق المحدد لا يحتوي على آيات.',
        );
        return;
      }

      final alignmentRecognizer = recognizer;
      if (alignmentRecognizer is QuranForcedAlignmentRecognizer) {
        alignmentRecognizer.setExpectedAyahs(
          target: target,
          ayahs: _expectedAyahs,
        );
      }

      final initialized = await recognizer.initialize();

      if (!initialized) {
        state = state.copyWith(
          status: Tasmee3Status.error,
          errorMessage: 'التعرف على الصوت غير متاح على هذا الجهاز.',
        );
        return;
      }

      state = state.copyWith(status: Tasmee3Status.listening);
      _startSessionTimer();

      _elapsedTimer?.cancel();
      _elapsedTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (state.status == Tasmee3Status.listening) {
          state = state.copyWith(
            elapsedSeconds: state.elapsedSeconds + 1,
          );
        }
      });

      await _audioLevelSubscription?.cancel();
      _audioLevelSubscription = recognizer.audioLevels.listen((level) {
        state = state.copyWith(audioLevel: level);
      });

      await _subscription?.cancel();

      _subscription = recognizer.listen().listen(
        (segment) {
          state = state.copyWith(
            recognizedText: segment.text,
            recognizedWords: segment.words,
            confidence: segment.confidence,
          );

          if (segment.isFinal) {
            if (segment.alignment != null) {
              analyzeAlignment(segment.alignment!);
            } else if (segment.words.isNotEmpty) {
              analyzeRecognizedWords(
                segment.words.map((e) => e.word).toList(),
              );
            } else {
              analyze();
            }
          }
        },
        onError: (error) {
          _stopSessionTimer();
          _elapsedTimer?.cancel();
          _audioLevelSubscription?.cancel();
          state = state.copyWith(
            status: Tasmee3Status.error,
            errorMessage: _friendlyError(error),
          );
        },
      );
    } catch (e) {
      _stopSessionTimer();
      _elapsedTimer?.cancel();
      await _audioLevelSubscription?.cancel();
      state = state.copyWith(
        status: Tasmee3Status.error,
        errorMessage: _friendlyError(e),
      );
    }
  }

  String _friendlyError(Object error) {
    final raw = error.toString();
    if (raw.startsWith('StateError: ')) {
      return raw.substring('StateError: '.length);
    }
    if (raw.startsWith('Bad state: ')) {
      return raw.substring('Bad state: '.length);
    }
    return raw;
  }

  Future<void> stop() async {
    if (state.status != Tasmee3Status.listening) {
      return;
    }

    state = state.copyWith(status: Tasmee3Status.uploadingAudio);
    _elapsedTimer?.cancel();

    try {
      await recognizer.stop();
      await _audioLevelSubscription?.cancel();
      _audioLevelSubscription = null;

      // Fallback engines (e.g. speech_to_text) may not emit a final segment.
      if (state.status == Tasmee3Status.uploadingAudio) {
        if (state.recognizedWords.isNotEmpty) {
          analyzeRecognizedWords(
            state.recognizedWords.map((e) => e.word).toList(),
          );
        } else {
          analyze();
        }
      }
    } catch (e) {
      _stopSessionTimer();
      _elapsedTimer?.cancel();
      await _audioLevelSubscription?.cancel();
      state = state.copyWith(
        status: Tasmee3Status.error,
        errorMessage: _friendlyError(e),
      );
    }
  }

  void analyzeAlignment(ForcedAlignmentResult alignment) {
    if (_expectedAyahs.isEmpty) {
      state = state.copyWith(
        status: Tasmee3Status.error,
        errorMessage: 'لا توجد آيات لتحليلها.',
      );
      return;
    }

    _stopSessionTimer();
    state = state.copyWith(status: Tasmee3Status.analyzing);

    final fallbackRef = state.target?.from ?? _expectedAyahs.first.ref;
    final result = engine.analyzeAlignment(
      alignment: alignment,
      fallbackAyahRef: fallbackRef,
    );

    // ayahScores و weakSpots محفوظة حاليا في ForcedAlignmentResult وليست داخل Tasmee3Result.
    _saveSessionIfPossible(result);

    state = state.copyWith(
      status: Tasmee3Status.completed,
      result: result,
      alignment: alignment,
      confidence: alignment.confidence,
      recognizedText: alignment.fullText,
      diagnostics: _buildDiagnostics(result),
    );
  }

  void analyzeRecognizedWords(List<String> words) {
    if (_expectedAyahs.isEmpty) {
      state = state.copyWith(
        status: Tasmee3Status.error,
        errorMessage: 'لا توجد آيات لتحليلها.',
      );
      return;
    }

    _stopSessionTimer();
    state = state.copyWith(status: Tasmee3Status.analyzing);

    final result = engine.analyzeWords(
      expectedAyahs: _expectedAyahs,
      recognizedWords: words,
      confidence: state.confidence,
    );

    _saveSessionIfPossible(result);

    state = state.copyWith(
      status: Tasmee3Status.completed,
      result: result,
      diagnostics: _buildDiagnostics(result),
    );
  }

  void analyze() {
    if (_expectedAyahs.isEmpty) {
      state = state.copyWith(
        status: Tasmee3Status.error,
        errorMessage: 'لا توجد آيات لتحليلها.',
      );
      return;
    }

    _stopSessionTimer();
    state = state.copyWith(status: Tasmee3Status.analyzing);

    final Tasmee3Result result;
    if (state.recognizedWords.isNotEmpty) {
      result = engine.analyzeWords(
        expectedAyahs: _expectedAyahs,
        recognizedWords: state.recognizedWords.map((w) => w.word).toList(),
        confidence: state.confidence,
      );
    } else {
      result = engine.analyze(
        expectedAyahs: _expectedAyahs,
        recognizedText: state.recognizedText,
        confidence: state.confidence,
      );
    }

    _saveSessionIfPossible(result);

    state = state.copyWith(
      status: Tasmee3Status.completed,
      result: result,
      diagnostics: _buildDiagnostics(result),
    );
  }

  Tasmee3SessionDiagnostics _buildDiagnostics(Tasmee3Result result) {
    final usedAdvanced = recognizer is AdvancedQuranAsrRecognizer;

    return Tasmee3SessionDiagnostics(
      durationSeconds: state.elapsedSeconds,
      expectedWordsCount: result.expectedWords.length,
      recognizedWordsCount: result.recognizedWords.length,
      mistakesCount: result.mistakesCount,
      lowConfidenceCount: result.mistakes
          .where((m) => m.type == Tasmee3MistakeType.lowConfidence)
          .length,
      accuracy: result.accuracy,
      averageAudioLevel: state.audioLevel?.average,
      maxAudioLevel: state.audioLevel?.max,
      usedAdvancedAsr: usedAdvanced,
      usedFallback: !usedAdvanced,
      notes: [
        if (result.accuracyPercent < 75)
          'الدقة منخفضة، يفضل إعادة التسميع بنطاق أقصر.',
        if ((state.audioLevel?.average ?? 1) < 0.08)
          'مستوى الصوت كان منخفضا أثناء التسجيل.',
      ],
    );
  }

  void _saveSessionIfPossible(Tasmee3Result result) {
    final started = _startedAt;
    final durationSeconds = started == null
        ? state.sessionDuration.inSeconds
        : DateTime.now().difference(started).inSeconds;

    final currentTarget = state.target;

    if (currentTarget == null) {
      return;
    }

    final record = Tasmee3SessionRecord(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      target: currentTarget,
      accuracyPercent: result.accuracyPercent,
      mistakesCount: result.mistakesCount,
      durationSeconds: durationSeconds,
      createdAt: DateTime.now(),
    );

    unawaited(() async {
      await sessionRepository.saveSession(record);

      final current = await ayahMasteryRepository.loadAll();
      final updated = srsService.updateMasteryFromSession(
        currentRecords: current,
        target: currentTarget,
        result: result,
      );
      await ayahMasteryRepository.upsertMany(updated);

      onSessionSaved?.call();
    }());
  }

  Future<void> retrySameRange() async {
    final target = state.target;
    if (target == null) {
      return;
    }
    await start(target);
  }

  Future<void> reset() async {
    await recognizer.stop();
    await _subscription?.cancel();
    await _audioLevelSubscription?.cancel();
    _stopSessionTimer();
    _elapsedTimer?.cancel();

    _subscription = null;
    _audioLevelSubscription = null;
    _expectedAyahs = [];
    _startedAt = null;

    state = const Tasmee3State.initial();
  }

  void _startSessionTimer() {
    _listenStartedAt = DateTime.now();
    _startedAt ??= _listenStartedAt;
    _sessionTimer?.cancel();
    _sessionTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      final started = _listenStartedAt ?? _startedAt;
      if (started == null) return;
      state = state.copyWith(
        sessionDuration: DateTime.now().difference(started),
      );
    });
  }

  void _stopSessionTimer() {
    _sessionTimer?.cancel();
    _sessionTimer = null;
    _listenStartedAt = null;
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _audioLevelSubscription?.cancel();
    _stopSessionTimer();
    _elapsedTimer?.cancel();
    recognizer.stop();
    super.dispose();
  }
}
