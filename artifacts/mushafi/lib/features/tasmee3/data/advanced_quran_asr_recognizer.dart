import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../domain/advanced_recognition_result.dart';
import 'quran_speech_recognizer.dart';

/// Records audio locally and uploads it to a specialized Quran ASR endpoint.
/// Requires a configured [endpoint]; otherwise use [SpeechToTextQuranRecognizer].
class AdvancedQuranAsrRecognizer implements QuranSpeechRecognizer {
  final Uri endpoint;
  final String? apiKey;
  final Duration uploadTimeout;

  AdvancedQuranAsrRecognizer({
    required this.endpoint,
    this.apiKey,
    this.uploadTimeout = const Duration(seconds: 90),
  });

  final AudioRecorder _recorder = AudioRecorder();

  final StreamController<RecognizedSegment> _controller =
      StreamController<RecognizedSegment>.broadcast();

  String? _recordingPath;
  bool _initialized = false;

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
    final fileName = 'tasmee3_${DateTime.now().millisecondsSinceEpoch}.m4a';
    final path = '${dir.path}/$fileName';

    _recordingPath = path;

    await _recorder.start(
      const RecordConfig(
        encoder: AudioEncoder.aacLc,
        bitRate: 128000,
        sampleRate: 16000,
        numChannels: 1,
      ),
      path: path,
    );
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

    try {
      final result = await _uploadAudio(file);
      _controller.add(RecognizedSegment.fromAdvanced(result));
    } catch (e) {
      _controller.addError(e);
    } finally {
      try {
        if (await file.exists()) {
          await file.delete();
        }
      } catch (_) {}
    }
  }

  Future<AdvancedRecognitionResult> _uploadAudio(File file) async {
    final request = http.MultipartRequest('POST', endpoint);

    request.files.add(
      await http.MultipartFile.fromPath(
        'audio',
        file.path,
      ),
    );

    request.fields['language'] = 'ar';

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
    return AdvancedRecognitionResult.fromJson(decoded);
  }
}
