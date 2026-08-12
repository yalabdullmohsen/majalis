import 'dart:async';

import 'package:flutter/foundation.dart';

import 'models/quran_word_state.dart';
import 'models/recitation_feedback.dart';
import 'models/word_recitation_status.dart';
import 'quran_audio_stream_service.dart';
import 'quran_recognition_client.dart';
import 'quran_text_matcher.dart';

/// Orchestrates mic PCM streaming, ASR transcripts, and word-level alignment.
class AiRecitationController extends ChangeNotifier {
  AiRecitationController({
    required String targetVerse,
    Uri? recognitionWebsocketUrl,
    QuranAudioStreamService? audioService,
    QuranRecognitionClient? recognitionClient,
    QuranTextMatcher? matcher,
  })  : _targetVerse = targetVerse,
        _audio = audioService ?? QuranAudioStreamService(),
        _ownsAudio = audioService == null,
        _recognition = recognitionClient ??
            QuranRecognitionClient(websocketUrl: recognitionWebsocketUrl),
        _ownsRecognition = recognitionClient == null,
        _matcher = matcher ?? QuranTextMatcher(lookahead: 2) {
    _words = _matcher.buildWordStates(targetVerse);
    _feedback = RecitationFeedback.idle;
  }

  final String _targetVerse;
  final QuranAudioStreamService _audio;
  final bool _ownsAudio;
  final QuranRecognitionClient _recognition;
  final bool _ownsRecognition;
  final QuranTextMatcher _matcher;

  late List<QuranWordState> _words;
  RecitationFeedback _feedback = RecitationFeedback.idle;
  bool _memorizationMode = false;
  bool _busy = false;
  int _cursor = 0;
  String _lastTranscript = '';
  String _cumulativeSpoken = '';

  StreamSubscription<RecognitionTranscript>? _transcriptSub;
  StreamSubscription<String>? _errorSub;
  StreamSubscription<AudioStreamLifecycle>? _lifecycleSub;

  String get targetVerse => _targetVerse;
  List<QuranWordState> get words => List.unmodifiable(_words);
  RecitationFeedback get feedback => _feedback;
  bool get memorizationMode => _memorizationMode;
  bool get isListening => _audio.isStreaming;
  bool get isPaused => _audio.isPaused;
  bool get isBusy => _busy;
  String get lastTranscript => _lastTranscript;
  int get currentWordIndex => _cursor;
  double get accuracy => _words.isEmpty
      ? 0
      : _words.where((w) => w.status == WordRecitationStatus.correct).length /
          _words.length;

  void setMemorizationMode(bool enabled) {
    if (_memorizationMode == enabled) return;
    _memorizationMode = enabled;
    notifyListeners();
  }

  void toggleMemorizationMode() => setMemorizationMode(!_memorizationMode);

  Future<void> start() async {
    if (_busy) return;
    _busy = true;
    _setFeedback(RecitationFeedback.requestingPermission);
    notifyListeners();

    try {
      await _bindListeners();
      await _audio.start();
      await _recognition.openSession(pcmChunkStream: _audio.chunkStream);
      _setFeedback(RecitationFeedback.listening);
    } catch (e) {
      _setFeedback(RecitationFeedback.error(e.toString()));
      await _safeStop();
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> pause() async {
    if (!_audio.isActive || _audio.isPaused) return;
    await _audio.pause();
    await _recognition.pauseLocalSpeech();
    _setFeedback(RecitationFeedback.paused);
    notifyListeners();
  }

  Future<void> resume() async {
    if (!_audio.isActive) {
      await start();
      return;
    }
    await _audio.resume();
    await _recognition.resumeLocalSpeech();
    _setFeedback(RecitationFeedback.listening);
    notifyListeners();
  }

  Future<void> stop() async {
    await _safeStop();
    if (_feedback.phase != RecitationSessionPhase.verseComplete &&
        _feedback.phase != RecitationSessionPhase.error) {
      _setFeedback(RecitationFeedback.idle);
    }
    notifyListeners();
  }

  void resetAlignment() {
    _words = _matcher.buildWordStates(_targetVerse);
    _cursor = 0;
    _lastTranscript = '';
    _cumulativeSpoken = '';
    _setFeedback(RecitationFeedback.idle);
    notifyListeners();
  }

  Future<void> _bindListeners() async {
    await _transcriptSub?.cancel();
    await _errorSub?.cancel();
    await _lifecycleSub?.cancel();

    _transcriptSub = _recognition.transcriptStream.listen(_onTranscript);
    _errorSub = _recognition.errorStream.listen((msg) {
      _setFeedback(RecitationFeedback.error(msg));
      notifyListeners();
    });
    _lifecycleSub = _audio.lifecycleStream.listen((event) {
      if (event == AudioStreamLifecycle.permissionDenied) {
        _setFeedback(
          RecitationFeedback.error('إذن الميكروفون مرفوض من إعدادات الجهاز.'),
        );
        notifyListeners();
      }
    });
  }

  void _onTranscript(RecognitionTranscript event) {
    final text = event.text.trim();
    if (text.isEmpty) return;

    _lastTranscript = text;
    // Prefer cumulative finals; for partials still align against the latest
    // full utterance so highlighting feels live (Tarteel-like).
    if (event.isFinal) {
      _cumulativeSpoken = _mergeSpoken(_cumulativeSpoken, text);
      _applyAlignment(_cumulativeSpoken);
    } else {
      _applyAlignment(_mergeSpoken(_cumulativeSpoken, text));
    }
    notifyListeners();
  }

  String _mergeSpoken(String previous, String incoming) {
    if (previous.isEmpty) return incoming;
    if (incoming.startsWith(previous)) return incoming;
    if (previous.contains(incoming)) return previous;
    return '$previous $incoming';
  }

  void _applyAlignment(String spoken) {
    _setFeedback(RecitationFeedback.aligning);
    final result = _matcher.matchSpokenText(
      targetWords: _words,
      spokenText: spoken,
      cursor: 0,
    );
    _words = result.words;
    _cursor = result.nextCursor;

    if (result.verseComplete) {
      _setFeedback(RecitationFeedback.verseComplete);
      unawaited(_safeStop());
      return;
    }

    final incorrect = _words
        .where((w) => w.status == WordRecitationStatus.incorrect)
        .toList(growable: false);
    if (incorrect.isNotEmpty) {
      _setFeedback(RecitationFeedback.wordError(incorrect.last.originalWord));
      return;
    }

    final correctCount =
        _words.where((w) => w.status == WordRecitationStatus.correct).length;
    if (correctCount > 0) {
      _setFeedback(
        RecitationFeedback.correctProgress(correctCount, _words.length),
      );
    } else {
      _setFeedback(RecitationFeedback.listening);
    }
  }

  void _setFeedback(RecitationFeedback value) {
    _feedback = value;
  }

  Future<void> _safeStop() async {
    try {
      await _recognition.closeSession();
    } catch (_) {}
    try {
      await _audio.stop();
    } catch (_) {}
  }

  @override
  void dispose() {
    unawaited(_transcriptSub?.cancel());
    unawaited(_errorSub?.cancel());
    unawaited(_lifecycleSub?.cancel());
    unawaited(_safeStop());
    if (_ownsRecognition) {
      unawaited(_recognition.dispose());
    }
    if (_ownsAudio) {
      unawaited(_audio.dispose());
    }
    super.dispose();
  }
}
