import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';

/// Microphone capture at 16 kHz / 16-bit / mono PCM with timed chunk emission.
///
/// Chunks are buffered from the native PCM stream and emitted every
/// [chunkInterval] (default 300 ms, clamped to 200–500 ms) so a WebSocket
/// recognition client can stream them without re-buffering.
class QuranAudioStreamService {
  QuranAudioStreamService({
    AudioRecorder? recorder,
    Duration chunkInterval = const Duration(milliseconds: 300),
    this.sampleRate = 16000,
    this.numChannels = 1,
  })  : _recorder = recorder ?? AudioRecorder(),
        _chunkInterval = _clampChunkInterval(chunkInterval);

  static const int pcmBytesPerSample = 2;

  final AudioRecorder _recorder;
  final int sampleRate;
  final int numChannels;
  final Duration _chunkInterval;

  final StreamController<Uint8List> _chunkController =
      StreamController<Uint8List>.broadcast();
  final StreamController<AudioStreamLifecycle> _lifecycleController =
      StreamController<AudioStreamLifecycle>.broadcast();

  StreamSubscription<Uint8List>? _rawSub;
  Timer? _flushTimer;
  final BytesBuilder _pending = BytesBuilder(copy: false);
  bool _paused = false;
  bool _streaming = false;
  bool _disposed = false;

  /// Timed PCM buffers ready for WebSocket upload.
  Stream<Uint8List> get chunkStream => _chunkController.stream;

  /// High-level lifecycle events (started / paused / resumed / stopped / error).
  Stream<AudioStreamLifecycle> get lifecycleStream =>
      _lifecycleController.stream;

  bool get isStreaming => _streaming && !_paused;
  bool get isPaused => _paused;
  bool get isActive => _streaming;

  int get bytesPerChunk {
    final seconds = _chunkInterval.inMilliseconds / 1000.0;
    return (sampleRate * numChannels * pcmBytesPerSample * seconds).round();
  }

  static Duration _clampChunkInterval(Duration value) {
    final ms = value.inMilliseconds.clamp(200, 500);
    return Duration(milliseconds: ms);
  }

  /// Requests microphone permission (iOS/Android) and returns whether granted.
  Future<bool> ensurePermission() async {
    final mic = await Permission.microphone.request();
    if (!mic.isGranted) {
      _emitLifecycle(AudioStreamLifecycle.permissionDenied);
      return false;
    }
    final hasRecord = await _recorder.hasPermission();
    if (!hasRecord) {
      _emitLifecycle(AudioStreamLifecycle.permissionDenied);
      return false;
    }
    return true;
  }

  /// Starts capturing PCM and emitting chunks.
  Future<void> start() async {
    _assertNotDisposed();
    if (_streaming && !_paused) return;

    if (_streaming && _paused) {
      await resume();
      return;
    }

    final allowed = await ensurePermission();
    if (!allowed) {
      throw StateError('إذن الميكروفون مرفوض — لا يمكن بدء بث الصوت.');
    }

    final stream = await _recorder.startStream(
      RecordConfig(
        encoder: AudioEncoder.pcm16bits,
        sampleRate: sampleRate,
        numChannels: numChannels,
        autoGain: true,
        echoCancel: true,
        noiseSuppress: true,
      ),
    );

    _pending.clear();
    _paused = false;
    _streaming = true;
    _emitLifecycle(AudioStreamLifecycle.started);

    _rawSub = stream.listen(
      _onRawPcm,
      onError: (Object error, StackTrace stack) {
        debugPrint('QuranAudioStreamService stream error: $error\n$stack');
        _emitLifecycle(AudioStreamLifecycle.error, detail: error.toString());
      },
      onDone: () {
        _flushPending(force: true);
        if (_streaming) {
          _streaming = false;
          _paused = false;
          _emitLifecycle(AudioStreamLifecycle.stopped);
        }
      },
      cancelOnError: false,
    );

    _flushTimer?.cancel();
    _flushTimer = Timer.periodic(_chunkInterval, (_) => _flushPending());
  }

  /// Soft-pause: keeps the hardware stream but suppresses chunk emission.
  Future<void> pause() async {
    _assertNotDisposed();
    if (!_streaming || _paused) return;
    _paused = true;
    _flushPending(force: true);
    _emitLifecycle(AudioStreamLifecycle.paused);
  }

  /// Resumes chunk emission after [pause].
  Future<void> resume() async {
    _assertNotDisposed();
    if (!_streaming) {
      await start();
      return;
    }
    if (!_paused) return;
    _paused = false;
    _emitLifecycle(AudioStreamLifecycle.resumed);
  }

  /// Stops capture, flushes residual PCM, and releases the recorder session.
  Future<void> stop() async {
    _assertNotDisposed();
    _flushTimer?.cancel();
    _flushTimer = null;
    await _rawSub?.cancel();
    _rawSub = null;
    _flushPending(force: true);
    if (await _recorder.isRecording()) {
      await _recorder.stop();
    }
    final wasActive = _streaming;
    _streaming = false;
    _paused = false;
    if (wasActive) {
      _emitLifecycle(AudioStreamLifecycle.stopped);
    }
  }

  Future<void> dispose() async {
    if (_disposed) return;
    try {
      await stop();
    } catch (_) {
      // Best-effort shutdown.
    }
    await _recorder.dispose();
    await _chunkController.close();
    await _lifecycleController.close();
    _disposed = true;
  }

  void _onRawPcm(Uint8List data) {
    if (_paused || !_streaming) return;
    if (data.isEmpty) return;
    _pending.add(data);
    // Emit early if buffer already holds a full timed chunk.
    if (_pending.length >= bytesPerChunk) {
      _flushPending();
    }
  }

  void _flushPending({bool force = false}) {
    if (_pending.isEmpty) return;
    if (!force && _pending.length < bytesPerChunk && !_paused) return;
    final bytes = Uint8List.fromList(_pending.takeBytes());
    if (bytes.isEmpty) return;
    if (!_chunkController.isClosed) {
      _chunkController.add(bytes);
    }
  }

  void _emitLifecycle(AudioStreamLifecycle event, {String? detail}) {
    if (_lifecycleController.isClosed) return;
    _lifecycleController.add(event);
    if (detail != null) {
      debugPrint('QuranAudioStreamService[$event]: $detail');
    }
  }

  void _assertNotDisposed() {
    if (_disposed) {
      throw StateError('QuranAudioStreamService disposed');
    }
  }
}

enum AudioStreamLifecycle {
  started,
  paused,
  resumed,
  stopped,
  permissionDenied,
  error,
}
