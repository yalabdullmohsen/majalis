import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import '../data/quran_repository.dart';
import '../data/quran_speech_recognizer.dart';
import '../domain/quran_ayah.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_result.dart';
import 'mistake_detection_engine.dart';

enum Tasmee3Status {
  idle,
  loadingQuran,
  requestingPermission,
  listening,
  analyzing,
  completed,
  error,
}

class Tasmee3State {
  final Tasmee3Status status;
  final RecitationTarget? target;
  final String recognizedText;
  final double confidence;
  final Tasmee3Result? result;
  final String? errorMessage;

  const Tasmee3State({
    required this.status,
    this.target,
    this.recognizedText = '',
    this.confidence = 0,
    this.result,
    this.errorMessage,
  });

  const Tasmee3State.initial()
      : status = Tasmee3Status.idle,
        target = null,
        recognizedText = '',
        confidence = 0,
        result = null,
        errorMessage = null;

  Tasmee3State copyWith({
    Tasmee3Status? status,
    RecitationTarget? target,
    String? recognizedText,
    double? confidence,
    Tasmee3Result? result,
    String? errorMessage,
    bool clearResult = false,
  }) {
    return Tasmee3State(
      status: status ?? this.status,
      target: target ?? this.target,
      recognizedText: recognizedText ?? this.recognizedText,
      confidence: confidence ?? this.confidence,
      result: clearResult ? null : result ?? this.result,
      errorMessage: errorMessage,
    );
  }
}

class Tasmee3Controller extends StateNotifier<Tasmee3State> {
  final QuranRepository quranRepository;
  final QuranSpeechRecognizer recognizer;
  final MistakeDetectionEngine engine;

  StreamSubscription<RecognizedSegment>? _subscription;
  List<QuranAyah> _expectedAyahs = [];

  Tasmee3Controller({
    required this.quranRepository,
    required this.recognizer,
    required this.engine,
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

      state = state.copyWith(
        status: Tasmee3Status.requestingPermission,
        target: target,
        recognizedText: '',
        confidence: 0,
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

      await _subscription?.cancel();

      _subscription = recognizer.listen().listen((segment) {
        state = state.copyWith(
          recognizedText: segment.text,
          confidence: segment.confidence,
        );

        if (segment.isFinal) {
          analyze();
        }
      });
    } catch (e) {
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

    await recognizer.stop();
    await _subscription?.cancel();
    _subscription = null;

    analyze();
  }

  void analyze() {
    if (_expectedAyahs.isEmpty) {
      state = state.copyWith(
        status: Tasmee3Status.error,
        errorMessage: 'لا توجد آيات لتحليلها.',
      );
      return;
    }

    state = state.copyWith(status: Tasmee3Status.analyzing);

    final result = engine.analyze(
      expectedAyahs: _expectedAyahs,
      recognizedText: state.recognizedText,
      confidence: state.confidence,
    );

    state = state.copyWith(
      status: Tasmee3Status.completed,
      result: result,
    );
  }

  Future<void> reset() async {
    await recognizer.stop();
    await _subscription?.cancel();

    _subscription = null;
    _expectedAyahs = [];

    state = const Tasmee3State.initial();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    recognizer.stop();
    super.dispose();
  }
}
