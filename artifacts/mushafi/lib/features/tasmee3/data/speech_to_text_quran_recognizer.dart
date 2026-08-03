import 'dart:async';

import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../application/arabic_normalizer.dart';
import '../domain/live_audio_level.dart';
import '../domain/recognized_word.dart';
import 'quran_speech_recognizer.dart';

/// Fallback device ASR. Not ideal for long Quran recitation;
/// swap via [quranSpeechRecognizerProvider] for a specialized engine.
class SpeechToTextQuranRecognizer implements QuranSpeechRecognizer {
  final SpeechToText _speech = SpeechToText();

  final StreamController<RecognizedSegment> _controller =
      StreamController<RecognizedSegment>.broadcast();

  final StreamController<LiveAudioLevel> _audioLevelController =
      StreamController<LiveAudioLevel>.broadcast();

  bool _initialized = false;
  bool _shouldKeepListening = false;
  DateTime? _lastRestartAt;

  @override
  Stream<LiveAudioLevel> get audioLevels => _audioLevelController.stream;

  @override
  Future<bool> initialize() async {
    _initialized = await _speech.initialize(
      onError: (_) {},
      onStatus: (status) {
        if (!_shouldKeepListening) return;

        final normalized = status.toLowerCase();

        if (normalized.contains('done') ||
            normalized.contains('notlistening') ||
            normalized.contains('not listening')) {
          _restartIfNeeded();
        }
      },
    );

    return _initialized;
  }

  @override
  Stream<RecognizedSegment> listen() {
    _shouldKeepListening = true;
    _start();
    return _controller.stream;
  }

  Future<void> _restartIfNeeded() async {
    final now = DateTime.now();

    if (_lastRestartAt != null &&
        now.difference(_lastRestartAt!).inMilliseconds < 800) {
      return;
    }

    _lastRestartAt = now;

    await Future<void>.delayed(const Duration(milliseconds: 350));

    if (!_shouldKeepListening) {
      return;
    }

    if (!_speech.isListening) {
      await _start();
    }
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
      onSoundLevelChange: (level) {
        final normalized = ((level + 2) / 12).clamp(0, 1).toDouble();

        if (!_audioLevelController.isClosed) {
          _audioLevelController.add(
            LiveAudioLevel(
              current: normalized,
              average: normalized,
              max: normalized,
              timestamp: DateTime.now(),
            ),
          );
        }
      },
    );
  }

  void _onResult(SpeechRecognitionResult result) {
    final words = ArabicNormalizer.tokenize(result.recognizedWords)
        .map(
          (word) => RecognizedWord(
            word: word,
            confidence: result.confidence,
          ),
        )
        .toList();

    _controller.add(
      RecognizedSegment(
        text: result.recognizedWords,
        confidence: result.confidence,
        isFinal: result.finalResult,
        timestamp: DateTime.now(),
        words: words,
      ),
    );
  }

  @override
  Future<void> stop() async {
    _shouldKeepListening = false;
    await _speech.stop();
  }
}
