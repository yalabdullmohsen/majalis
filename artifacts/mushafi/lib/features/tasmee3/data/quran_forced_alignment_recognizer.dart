import '../domain/quran_ayah.dart';
import '../domain/recitation_target.dart';
import 'quran_speech_recognizer.dart';

abstract class QuranForcedAlignmentRecognizer implements QuranSpeechRecognizer {
  void setExpectedAyahs({
    required RecitationTarget target,
    required List<QuranAyah> ayahs,
  });
}
