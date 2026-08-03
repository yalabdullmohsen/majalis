import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mushafi/core/permissions/mic_permission.dart';
import 'package:mushafi/core/utils/arabic_normalizer.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';
import 'package:mushafi/features/tarteel/domain/mistake_detection_engine.dart';
import 'package:mushafi/features/tarteel/domain/speech_recognizer.dart';

enum HifzDisplayMode { fullText, hideAyahs, firstWordOnly, test }

class RecitationSessionScreen extends ConsumerStatefulWidget {
  const RecitationSessionScreen({super.key, this.ayahKey});
  final String? ayahKey;

  @override
  ConsumerState<RecitationSessionScreen> createState() =>
      _RecitationSessionScreenState();
}

class _RecitationSessionScreenState
    extends ConsumerState<RecitationSessionScreen> {
  HifzDisplayMode _mode = HifzDisplayMode.fullText;
  bool _listening = false;
  String _status = 'جاهز';
  final _engine = MistakeDetectionEngine();
  final _recognizer = MockQuranSpeechRecognizer();
  List<RecitationMistake> _mistakes = const [];
  Duration _elapsed = Duration.zero;

  Future<void> _start() async {
    final ok = await MicPermission.ensure();
    if (!ok) {
      setState(() => _status = 'يلزم إذن الميكروفون');
      return;
    }
    final repo = ref.read(quranRepositoryProvider);
    await repo.initialize();
    final ayah = await repo.getAyah(1, 1);
    if (ayah == null) return;
    final target = RecitationTarget(
      surahId: 1,
      fromAyah: 1,
      toAyah: 1,
      expectedAyahs: [ayah],
    );
    setState(() {
      _listening = true;
      _status = 'أستمع الآن (محلي — لا يُرسل الصوت)';
      _elapsed = Duration.zero;
    });
    await for (final seg in _recognizer.startListening(target)) {
      if (!mounted) break;
      final mistakes = _engine.compare(
        expectedWords: ArabicNormalizer.tokenizeWords(ayah.textUthmani),
        recognizedWords: ArabicNormalizer.tokenizeWords(seg.text),
        ayahNumber: ayah.ayahNumber,
      );
      setState(() {
        _mistakes = mistakes;
        _elapsed += const Duration(milliseconds: 400);
      });
    }
    setState(() {
      _listening = false;
      _status = 'انتهت الجلسة';
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    return Scaffold(
      backgroundColor: colors.scaffold,
      appBar: AppBar(title: const Text('مراجعة الحفظ')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'تنبيه خصوصية: التسجيل بإذنك فقط. الوضع الحالي Mock محلي ولا يرسل الصوت لأي خادم.',
              style: TextStyle(color: colors.secondaryText, fontSize: 13),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: HifzDisplayMode.values.map((m) {
                return ChoiceChip(
                  label: Text(m.name),
                  selected: _mode == m,
                  onSelected: (_) => setState(() => _mode = m),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            Text(_status, textAlign: TextAlign.center),
            Text(
              '${_elapsed.inSeconds} ث',
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.ornament),
            ),
            const SizedBox(height: 12),
            // waveform بسيط
            SizedBox(
              height: 48,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(16, (i) {
                  final h = _listening ? (8.0 + (i % 5) * 6) : 10.0;
                  return Container(
                    width: 6,
                    height: h,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    color: colors.ornament.withValues(alpha: 0.5),
                  );
                }),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _listening ? null : _start,
              icon: const Icon(Icons.mic),
              label: Text(_listening ? 'جاري الاستماع...' : 'بدء التسجيل'),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                children: _mistakes.map((m) {
                  final color = switch (m.mistakeType) {
                    MistakeType.wrongWord || MistakeType.extra => colors.errorWord,
                    MistakeType.missing || MistakeType.skippedAyah =>
                      colors.missingWord,
                    MistakeType.lowConfidence || MistakeType.wrongOrder =>
                      colors.lowConfidence,
                  };
                  return ListTile(
                    leading: Icon(Icons.error_outline, color: color),
                    title: Text(
                      '${m.mistakeType.name}: ${m.expectedWord ?? ''} → ${m.recognizedWord ?? ''}',
                    ),
                    subtitle: Text('آية ${m.ayahNumber} كلمة ${m.wordIndex}'),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
