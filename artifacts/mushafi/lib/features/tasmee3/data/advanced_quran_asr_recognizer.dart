import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../application/arabic_normalizer.dart';
import '../domain/forced_alignment_result.dart';
import '../domain/live_audio_level.dart';
import '../domain/quran_ayah.dart';
import '../domain/queued_tasmee3_job.dart';
import '../domain/recitation_target.dart';
import 'audio_quality_monitor.dart';
import 'quran_forced_alignment_recognizer.dart';
import 'quran_speech_recognizer.dart';
import 'tasmee3_failed_job_queue.dart';

class AdvancedQuranAsrRecognizer implements QuranForcedAlignmentRecognizer {
  final Uri endpoint;
  final String? apiKey;
  final Duration uploadTimeout;
  final int maxRetryCount;
  final Tasmee3FailedJobQueue? failedJobQueue;
  final bool saveFailedSessionsQueue;

  AdvancedQuranAsrRecognizer({
    required this.endpoint,
    this.apiKey,
    this.uploadTimeout = const Duration(seconds: 90),
    this.maxRetryCount = 2,
    this.failedJobQueue,
    this.saveFailedSessionsQueue = false,
  });

  final AudioRecorder _recorder = AudioRecorder();
  final AudioQualityMonitor _qualityMonitor = AudioQualityMonitor();

  final StreamController<RecognizedSegment> _controller =
      StreamController<RecognizedSegment>.broadcast();

  String? _recordingPath;
  bool _initialized = false;
  bool _amplitudeLoopRunning = false;

  RecitationTarget? _target;
  List<QuranAyah> _expectedAyahs = const [];

  @override
  Stream<LiveAudioLevel> get audioLevels => _qualityMonitor.levels;

  @override
  void setExpectedAyahs({
    required RecitationTarget target,
    required List<QuranAyah> ayahs,
  }) {
    _target = target;
    _expectedAyahs = ayahs;
  }

  @override
  Future<bool> initialize() async {
    final hasPermission = await _recorder.hasPermission();
    _initialized = hasPermission;
    return hasPermission;
  }

  @override
  Stream<RecognizedSegment> listen() {
    _startRecording();
    return _controller.stream;
  }

  Future<void> _startRecording() async {
    if (!_initialized) {
      final ok = await initialize();
      if (!ok) {
        _controller.add(
          RecognizedSegment(
            text: '',
            confidence: 0,
            isFinal: true,
            timestamp: DateTime.now(),
          ),
        );
        return;
      }
    }

    final dir = await getTemporaryDirectory();
    // Prefer WAV/PCM for clearer ASR than lossy M4A when supported.
    final fileName = 'tasmee3_${DateTime.now().millisecondsSinceEpoch}.wav';
    final path = '${dir.path}/$fileName';

    _recordingPath = path;
    _qualityMonitor.start();

    await _recorder.start(
      const RecordConfig(
        encoder: AudioEncoder.wav,
        sampleRate: 16000,
        numChannels: 1,
      ),
      path: path,
    );

    unawaited(_unawaitedAmplitudeLoop());
  }

  Future<void> _unawaitedAmplitudeLoop() async {
    if (_amplitudeLoopRunning) {
      return;
    }

    _amplitudeLoopRunning = true;

    try {
      while (await _recorder.isRecording()) {
        try {
          final amplitude = await _recorder.getAmplitude();
          final current = amplitude.current;
          final normalized = ((current + 60) / 60).clamp(0, 1).toDouble();
          _qualityMonitor.addAmplitude(normalized);
        } catch (_) {}

        await Future<void>.delayed(const Duration(milliseconds: 180));
      }
    } finally {
      _amplitudeLoopRunning = false;
    }
  }

  @override
  Future<void> stop() async {
    final path = await _recorder.stop();
    final finalPath = path ?? _recordingPath;

    if (finalPath == null || finalPath.trim().isEmpty) {
      _controller.add(
        RecognizedSegment(
          text: '',
          confidence: 0,
          isFinal: true,
          timestamp: DateTime.now(),
        ),
      );
      return;
    }

    final file = File(finalPath);

    if (!await file.exists()) {
      _controller.add(
        RecognizedSegment(
          text: '',
          confidence: 0,
          isFinal: true,
          timestamp: DateTime.now(),
        ),
      );
      return;
    }

    final qualityReport = _qualityMonitor.buildReport();

    if (!qualityReport.canSubmit) {
      final message = qualityReport.warnings.isEmpty
          ? 'جودة التسجيل غير كافية. حاول مرة أخرى.'
          : qualityReport.warnings.join('\n');

      try {
        if (await file.exists()) {
          await file.delete();
        }
      } catch (_) {}

      _controller.addError(StateError(message));
      return;
    }

    try {
      final result = await _uploadWithRetry(file);
      _controller.add(RecognizedSegment.fromAlignment(result));

      try {
        if (await file.exists()) {
          await file.delete();
        }
      } catch (_) {}
    } catch (e) {
      if (saveFailedSessionsQueue && failedJobQueue != null) {
        try {
          await failedJobQueue!.addJob(
            QueuedTasmee3Job(
              id: 'job_${DateTime.now().millisecondsSinceEpoch}',
              audioPath: file.path,
              endpoint: endpoint.toString(),
              createdAt: DateTime.now(),
              retryCount: maxRetryCount + 1,
              reason: e.toString(),
            ),
          );
        } catch (_) {}
      } else {
        try {
          if (await file.exists()) {
            await file.delete();
          }
        } catch (_) {}
      }

      _controller.addError(e);
    }
  }

  Future<ForcedAlignmentResult> _uploadWithRetry(File file) async {
    Object? lastError;

    for (int attempt = 0; attempt <= maxRetryCount; attempt++) {
      try {
        return await _uploadAudioWithExpectedText(file);
      } catch (e) {
        lastError = e;

        if (attempt >= maxRetryCount) {
          break;
        }

        await Future<void>.delayed(
          Duration(milliseconds: 600 * (attempt + 1)),
        );
      }
    }

    throw StateError(
      'فشل رفع الصوت بعد ${maxRetryCount + 1} محاولة. السبب: $lastError',
    );
  }

  Future<ForcedAlignmentResult> _uploadAudioWithExpectedText(File file) async {
    final target = _target;

    if (target == null || _expectedAyahs.isEmpty) {
      throw StateError('لم يتم تمرير النص المتوقع إلى محرك التسميع.');
    }

    final expectedText =
        _expectedAyahs.map((ayah) => ayah.textUthmani).join(' ');

    final expectedWordMap = <Map<String, dynamic>>[];
    int globalIndex = 0;

    for (final ayah in _expectedAyahs) {
      final words = ArabicNormalizer.tokenize(ayah.textUthmani);

      for (int i = 0; i < words.length; i++) {
        expectedWordMap.add({
          'word': words[i],
          'globalWordIndex': globalIndex,
          'wordIndexInAyah': i,
          'surah': ayah.ref.surah,
          'ayah': ayah.ref.ayah,
        });

        globalIndex++;
      }
    }

    final expectedWords =
        expectedWordMap.map((item) => item['word'] as String).toList();

    final request = http.MultipartRequest('POST', endpoint);

    request.files.add(
      await http.MultipartFile.fromPath(
        'audio',
        file.path,
      ),
    );

    request.fields['language'] = 'ar';
    request.fields['fromSurah'] = target.from.surah.toString();
    request.fields['fromAyah'] = target.from.ayah.toString();
    request.fields['toSurah'] = target.to.surah.toString();
    request.fields['toAyah'] = target.to.ayah.toString();
    request.fields['expectedText'] = ArabicNormalizer.normalize(expectedText);
    request.fields['expectedWords'] = jsonEncode(expectedWords);
    request.fields['expectedWordMap'] = jsonEncode(expectedWordMap);

    if (apiKey != null && apiKey!.trim().isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $apiKey';
    }

    final streamed = await request.send().timeout(uploadTimeout);
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError(
        'فشل تحليل الصوت. status=${response.statusCode}, body=${response.body}',
      );
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return ForcedAlignmentResult.fromJson(decoded);
  }
}
