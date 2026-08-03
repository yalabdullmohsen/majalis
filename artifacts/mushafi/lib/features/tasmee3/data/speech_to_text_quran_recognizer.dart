import 'dart:async';

import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

import 'quran_speech_recognizer.dart';

class SpeechToTextQuranRecognizer implements QuranSpeechRecognizer {
  final SpeechToText _speech = SpeechToText();

  final StreamController<RecognizedSegment> _controller =
      StreamController<RecognizedSegment>.broadcast();

  bool _initialized = false;

  @override
  Future<bool> initialize() async {
    _initialized = await _speech.initialize(
      onError: (_) {},
      onStatus: (_) {},
    );

    return _initialized;
  }

  @override
  Stream<RecognizedSegment> listen() {
    _start();
    return _controller.stream;
  }

  Future<void> _start() async {
    if (!_initialized) {
      final ok = await initialize();

      if (!ok) {
        return;
      }
    }

    await _speech.listen(
      localeId: 'ar',
      listenOptions: SpeechListenOptions(
        listenMode: ListenMode.dictation,
        partialResults: true,
        cancelOnError: false,
      ),
      onResult: _onResult,
    );
  }

  void _onResult(SpeechRecognitionResult result) {
    _controller.add(
      RecognizedSegment(
        text: result.recognizedWords,
        confidence: result.confidence,
        isFinal: result.finalResult,
        timestamp: DateTime.now(),
      ),
    );
  }

  @override
  Future<void> stop() async {
    await _speech.stop();
  }
}
