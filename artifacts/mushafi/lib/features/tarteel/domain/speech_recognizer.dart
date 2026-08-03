import 'package:equatable/equatable.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';

class RecitationTarget extends Equatable {
  const RecitationTarget({
    required this.surahId,
    required this.fromAyah,
    required this.toAyah,
    required this.expectedAyahs,
  });

  final int surahId;
  final int fromAyah;
  final int toAyah;
  final List<Ayah> expectedAyahs;

  @override
  List<Object?> get props => [surahId, fromAyah, toAyah];
}

class RecognizedSegment extends Equatable {
  const RecognizedSegment({
    required this.text,
    required this.confidence,
    this.isFinal = false,
  });

  final String text;
  final double confidence;
  final bool isFinal;

  @override
  List<Object?> get props => [text, confidence, isFinal];
}

abstract class QuranSpeechRecognizer {
  Stream<RecognizedSegment> startListening(RecitationTarget target);
  Future<void> stop();
}

/// Mock محلي — لا يرسل صوتًا للخارج.
class MockQuranSpeechRecognizer implements QuranSpeechRecognizer {
  @override
  Stream<RecognizedSegment> startListening(RecitationTarget target) async* {
    for (final ayah in target.expectedAyahs) {
      await Future<void>.delayed(const Duration(milliseconds: 400));
      yield RecognizedSegment(
        text: ayah.textPlain,
        confidence: 0.92,
        isFinal: true,
      );
    }
  }

  @override
  Future<void> stop() async {}
}

/// Placeholder لربط API خارجي لاحقًا بعد إذن صريح.
class ExternalApiQuranSpeechRecognizer implements QuranSpeechRecognizer {
  ExternalApiQuranSpeechRecognizer({this.apiKey});
  final String? apiKey;

  @override
  Stream<RecognizedSegment> startListening(RecitationTarget target) {
    throw UnsupportedError(
      'فعّل مفتاح API ومنح إذن الميكروفون أولًا. لا يُرسل الصوت افتراضيًا.',
    );
  }

  @override
  Future<void> stop() async {}
}
