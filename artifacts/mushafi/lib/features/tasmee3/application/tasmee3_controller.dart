import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import '../data/quran_repository.dart';
import '../data/quran_speech_recognizer.dart';
import '../data/tasmee3_session_repository.dart';
import '../domain/quran_ayah.dart';
import '../domain/recognized_word.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_result.dart';
import '../domain/tasmee3_session_record.dart';
import 'mistake_detection_engine.dart';

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
  final String? errorMessage;
  final Duration sessionDuration;

  const Tasmee3State({
    required this.status,
    this.target,
    this.recognizedText = '',
    this.recognizedWords = const [],
    this.confidence = 0,
    this.result,
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
        errorMessage = null,
        sessionDuration = Duration.zero;

  Tasmee3State copyWith({
    Tasmee3Status? status,
    RecitationTarget? target,
    String? recognizedText,
    List<RecognizedWord>? recognizedWords,
    double? confidence,
    Tasmee3Result? result,
    String? errorMessage,
    Duration? sessionDuration,
    bool clearResult = false,
  }) {
    return Tasmee3State(
      status: status ?? this.status,
      target: target ?? this.target,
      recognizedText: recognizedText ?? this.recognizedText,
      recognizedWords: recognizedWords ?? this.recognizedWords,
      confidence: confidence ?? this.confidence,
      result: clearResult ? null : result ?? this.result,
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
  final void Function()? onSessionSaved;

  StreamSubscription<RecognizedSegment>? _subscription;
  List<QuranAyah> _expectedAyahs = [];
  Timer? _sessionTimer;
  DateTime? _startedAt;
  DateTime? _listenStartedAt;

  Tasmee3Controller({
    required this.quranRepository,
    required this.recognizer,
    required this.engine,
    required this.sessionRepository,
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
        clearResult: true,
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

      await _subscription?.cancel();

      _subscription = recognizer.listen().listen(
        (segment) {
          state = state.copyWith(
            recognizedText: segment.text,
            recognizedWords: segment.words,
            confidence: segment.confidence,
          );

          if (segment.isFinal) {
            if (segment.words.isNotEmpty) {
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
          state = state.copyWith(
            status: Tasmee3Status.error,
            errorMessage: error.toString(),
          );
        },
      );
    } catch (e) {
      _stopSessionTimer();
      state = state.copyWith(
        status: Tasmee3Status.error,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> stop() async {
    if (state.status != Tasmee3Status.listening) {
      return;
    }

    state = state.copyWith(status: Tasmee3Status.uploadingAudio);

    try {
      await recognizer.stop();

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
      state = state.copyWith(
        status: Tasmee3Status.error,
        errorMessage: e.toString(),
      );
    }
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

    unawaited(
      sessionRepository.saveSession(record).then((_) {
        onSessionSaved?.call();
      }),
    );
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
    _stopSessionTimer();

    _subscription = null;
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
    _stopSessionTimer();
    recognizer.stop();
    super.dispose();
  }
}
