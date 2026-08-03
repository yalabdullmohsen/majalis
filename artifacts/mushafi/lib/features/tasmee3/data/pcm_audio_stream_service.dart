import 'dart:async';

import 'package:flutter/services.dart';

import '../domain/pcm_audio_chunk.dart';
import '../domain/pcm_audio_config.dart';

class PcmAudioStreamService {
  static const MethodChannel _methodChannel =
      MethodChannel('tasmee3_pcm_audio/methods');

  static const EventChannel _eventChannel =
      EventChannel('tasmee3_pcm_audio/events');

  StreamSubscription? _subscription;
  final StreamController<PcmAudioChunk> _controller =
      StreamController<PcmAudioChunk>.broadcast();

  int _sequence = 0;
  bool _isRunning = false;

  Stream<PcmAudioChunk> get chunks => _controller.stream;

  Future<bool> isAvailable() async {
    try {
      final result = await _methodChannel.invokeMethod<bool>('isAvailable');
      return result ?? false;
    } catch (_) {
      return false;
    }
  }

  Future<void> start(PcmAudioConfig config) async {
    if (_isRunning) {
      return;
    }

    _isRunning = true;
    _sequence = 0;

    await _subscription?.cancel();

    _subscription = _eventChannel.receiveBroadcastStream(config.toJson()).listen(
      (event) {
        if (event is Uint8List) {
          _sequence++;

          _controller.add(
            PcmAudioChunk(
              bytes: event,
              sequence: _sequence,
              timestamp: DateTime.now(),
            ),
          );
        } else if (event is List<int>) {
          _sequence++;

          _controller.add(
            PcmAudioChunk(
              bytes: Uint8List.fromList(event),
              sequence: _sequence,
              timestamp: DateTime.now(),
            ),
          );
        }
      },
      onError: (error) {
        if (!_controller.isClosed) {
          _controller.addError(error);
        }
      },
    );

    try {
      await _methodChannel.invokeMethod<void>(
        'start',
        config.toJson(),
      );
    } catch (e) {
      _isRunning = false;
      await _subscription?.cancel();
      _subscription = null;
      rethrow;
    }
  }

  Future<void> stop() async {
    try {
      await _methodChannel.invokeMethod<void>('stop');
    } finally {
      await _subscription?.cancel();
      _subscription = null;
      _isRunning = false;
    }
  }

  Future<void> dispose() async {
    await stop();
    await _controller.close();
  }
}
