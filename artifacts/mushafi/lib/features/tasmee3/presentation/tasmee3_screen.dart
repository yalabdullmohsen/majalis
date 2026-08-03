import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_controller.dart';
import '../application/tasmee3_providers.dart';
import '../data/surah_catalog.dart';
import '../domain/ayah_ref.dart';
import '../domain/recitation_target.dart';
import '../domain/surah_info.dart';
import '../domain/tasmee3_mistake.dart';
import 'tasmee3_history_screen.dart';
import 'tasmee3_weak_spots_screen.dart';
import 'widgets/tasmee3_accuracy_card.dart';
import 'widgets/tasmee3_audio_level_meter.dart';
import 'widgets/tasmee3_ayah_scores_card.dart';
import 'widgets/tasmee3_mistake_report_sheet.dart';
import 'widgets/tasmee3_section_card.dart';

class Tasmee3Screen extends ConsumerStatefulWidget {
  const Tasmee3Screen({super.key});

  @override
  ConsumerState<Tasmee3Screen> createState() => _Tasmee3ScreenState();
}

class _Tasmee3ScreenState extends ConsumerState<Tasmee3Screen> {
  int surah = 112;
  int fromAyah = 1;
  int toAyah = 3;
  Tasmee3Mode mode = Tasmee3Mode.showText;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tasmee3ControllerProvider);
    final controller = ref.read(tasmee3ControllerProvider.notifier);
    final selectedSurah = SurahCatalog.byId(surah);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
          actions: [
            IconButton(
              tooltip: 'سجل التسميع',
              icon: const Icon(Icons.history),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const Tasmee3HistoryScreen(),
                  ),
                );
              },
            ),
          ],
        ),
        body: Column(
          children: [
            _targetCard(state, selectedSurah),
            Expanded(child: _content(state)),
            _controls(state, controller),
          ],
        ),
      ),
    );
  }

  Widget _targetCard(Tasmee3State state, SurahInfo selectedSurah) {
    final disabled = state.status == Tasmee3Status.listening;
    final safeToAyah = toAyah.clamp(1, selectedSurah.ayahCount);
    final safeFromAyah = fromAyah.clamp(1, selectedSurah.ayahCount);

    return Tasmee3SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'اختر نطاق التسميع',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.bold,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<int>(
            value: surah,
            decoration: const InputDecoration(
              labelText: 'السورة',
              border: OutlineInputBorder(),
            ),
            items: SurahCatalog.all.map((item) {
              return DropdownMenuItem<int>(
                value: item.id,
                child: Text('${item.id}. ${item.nameArabic}'),
              );
            }).toList(),
            onChanged: disabled
                ? null
                : (value) {
                    if (value == null) return;

                    final info = SurahCatalog.byId(value);

                    setState(() {
                      surah = value;
                      fromAyah = 1;
                      toAyah = info.ayahCount >= 3 ? 3 : info.ayahCount;
                    });
                  },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: safeFromAyah,
                  decoration: const InputDecoration(
                    labelText: 'من آية',
                    border: OutlineInputBorder(),
                  ),
                  items: List.generate(selectedSurah.ayahCount, (index) {
                    final ayah = index + 1;
                    return DropdownMenuItem<int>(
                      value: ayah,
                      child: Text('$ayah'),
                    );
                  }),
                  onChanged: disabled
                      ? null
                      : (value) {
                          if (value == null) return;

                          setState(() {
                            fromAyah = value;
                            if (toAyah < fromAyah) {
                              toAyah = fromAyah;
                            }
                          });
                        },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: safeToAyah,
                  decoration: const InputDecoration(
                    labelText: 'إلى آية',
                    border: OutlineInputBorder(),
                  ),
                  items: List.generate(selectedSurah.ayahCount, (index) {
                    final ayah = index + 1;
                    return DropdownMenuItem<int>(
                      value: ayah,
                      child: Text('$ayah'),
                    );
                  }),
                  onChanged: disabled
                      ? null
                      : (value) {
                          if (value == null) return;

                          setState(() {
                            toAyah = value;
                            if (fromAyah > toAyah) {
                              fromAyah = toAyah;
                            }
                          });
                        },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<Tasmee3Mode>(
            value: mode,
            decoration: const InputDecoration(
              labelText: 'وضع التسميع',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(
                value: Tasmee3Mode.showText,
                child: Text('عرض النص'),
              ),
              DropdownMenuItem(
                value: Tasmee3Mode.hideText,
                child: Text('إخفاء النص'),
              ),
              DropdownMenuItem(
                value: Tasmee3Mode.firstWordOnly,
                child: Text('أول كلمة فقط'),
              ),
              DropdownMenuItem(
                value: Tasmee3Mode.hifzTest,
                child: Text('اختبار حفظ كامل'),
              ),
            ],
            onChanged: disabled
                ? null
                : (value) {
                    if (value != null) {
                      setState(() => mode = value);
                    }
                  },
          ),
          const SizedBox(height: 10),
          Text(
            ref.watch(tasmee3AsrSettingsProvider).isConfigured
                ? 'محرك ASR المتقدم مفعّل عبر endpoint.'
                : 'محرك ASR المتقدم غير مضبوط؛ يعمل التطبيق بوضع fallback (speech_to_text).',
            style: const TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'للحصول على دقة أعلى، ابدأ بنطاق قصير واقرأ في مكان هادئ.',
            style: TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 13,
            ),
          ),
          if ((toAyah - fromAyah + 1) > 5) ...[
            const SizedBox(height: 10),
            const Text(
              'النطاق طويل. للحصول على دقة أعلى، جرب 1 إلى 5 آيات في كل جلسة.',
              style: TextStyle(
                color: Colors.orange,
                fontSize: 13,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _content(Tasmee3State state) {
    switch (state.status) {
      case Tasmee3Status.idle:
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'اختر السورة ونطاق الآيات ثم اضغط بدء التسميع.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                color: Color(0xFF9A8068),
              ),
            ),
          ),
        );

      case Tasmee3Status.requestingPermission:
        return const Center(child: Text('جاري طلب صلاحية الميكروفون...'));

      case Tasmee3Status.loadingQuran:
        return const Center(child: Text('جاري تحميل الآيات...'));

      case Tasmee3Status.listening:
        return _listeningContent(state);

      case Tasmee3Status.uploadingAudio:
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text(
                  'جاري رفع الصوت وتحليله...',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    color: Color(0xFF9A8068),
                  ),
                ),
              ],
            ),
          ),
        );

      case Tasmee3Status.analyzing:
        return const Center(child: CircularProgressIndicator());

      case Tasmee3Status.completed:
        return _resultContent(state);

      case Tasmee3Status.error:
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFCF7),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: Colors.red.withValues(alpha: 0.25),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.error_outline,
                    color: Colors.red.shade700,
                    size: 42,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    state.errorMessage ?? 'حدث خطأ',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 17,
                      color: Color(0xFF11100E),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () {
                      ref.read(tasmee3ControllerProvider.notifier).reset();
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('حاول مرة أخرى'),
                  ),
                ],
              ),
            ),
          ),
        );
    }
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Widget _listeningContent(Tasmee3State state) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFA77A48).withValues(alpha: 0.12),
              border: Border.all(
                color: const Color(0xFFA77A48).withValues(alpha: 0.35),
              ),
            ),
            child: const Icon(
              Icons.mic,
              size: 50,
              color: Color(0xFFA77A48),
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'أستمع الآن...',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'المدة: ${state.elapsedSeconds} ثانية',
            style: const TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 12),
          Tasmee3AudioLevelMeter(level: state.audioLevel),
          const SizedBox(height: 8),
          const Text(
            'تجنب الضوضاء، واقرأ النطاق المختار فقط دون زيادة.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _formatDuration(state.sessionDuration),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFFA77A48),
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'اقرأ بهدوء ووضوح. عند الانتهاء اضغط إيقاف وتحليل.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF9A8068)),
          ),
          const SizedBox(height: 18),
          Expanded(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFCF7),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE0C5A3)),
              ),
              child: SingleChildScrollView(
                child: Text(
                  state.recognizedText.isEmpty
                      ? 'سيظهر النص المتعرف عليه هنا...'
                      : state.recognizedText,
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    fontSize: 24,
                    height: 1.8,
                    color: state.recognizedText.isEmpty
                        ? const Color(0xFF9A8068)
                        : const Color(0xFF11100E),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _resultContent(Tasmee3State state) {
    final result = state.result;

    if (result == null) {
      return const Center(child: Text('لا توجد نتيجة'));
    }

    final mistakesByIndex = <int, Tasmee3Mistake>{};

    for (final mistake in result.mistakes) {
      if (mistake.type == Tasmee3MistakeType.wrongWord ||
          mistake.type == Tasmee3MistakeType.missingWord ||
          mistake.type == Tasmee3MistakeType.lowConfidence) {
        mistakesByIndex[mistake.globalWordIndex] = mistake;
      }
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Tasmee3AccuracyCard(result: result),
          if (state.alignment?.ayahScores.isNotEmpty == true) ...[
            const SizedBox(height: 10),
            Tasmee3AyahScoresCard(scores: state.alignment!.ayahScores),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFA77A48),
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () {
                    ref.read(tasmee3ControllerProvider.notifier).start(
                          RecitationTarget(
                            from: AyahRef(surah: surah, ayah: fromAyah),
                            to: AyahRef(surah: surah, ayah: toAyah),
                            mode: mode,
                          ),
                        );
                  },
                  icon: const Icon(Icons.replay),
                  label: const Text('إعادة نفس النطاق'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      showDragHandle: true,
                      backgroundColor: const Color(0xFFFFFCF7),
                      builder: (_) =>
                          Tasmee3MistakeReportSheet(result: result),
                    );
                  },
                  icon: const Icon(Icons.analytics_outlined),
                  label: const Text('تقرير الأخطاء'),
                ),
              ),
            ],
          ),
          if (state.alignment?.weakSpots.isNotEmpty == true) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => Tasmee3WeakSpotsScreen(
                            weakSpots: state.alignment!.weakSpots,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.warning_amber_rounded),
                    label: const Text('مواضع تحتاج مراجعة'),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Text(
              'الألوان توضح نتيجة مطابقة كل كلمة مع النص المتوقع.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF9A8068),
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              child: Wrap(
                textDirection: TextDirection.rtl,
                spacing: 8,
                runSpacing: 10,
                children: [
                  for (int i = 0; i < result.expectedWords.length; i++)
                    _wordChip(
                      word: result.expectedWords[i],
                      mistake: mistakesByIndex[i],
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _wordChip({
    required String word,
    required Tasmee3Mistake? mistake,
  }) {
    final hasMistake = mistake != null;

    Color bg = Colors.green.withValues(alpha: 0.08);
    Color text = Colors.green.shade900;
    Color border = Colors.green.withValues(alpha: 0.25);

    if (hasMistake) {
      if (mistake.type == Tasmee3MistakeType.missingWord) {
        bg = Colors.orange.withValues(alpha: 0.12);
        text = Colors.orange.shade900;
        border = Colors.orange.withValues(alpha: 0.3);
      } else if (mistake.type == Tasmee3MistakeType.lowConfidence) {
        bg = Colors.blueGrey.withValues(alpha: 0.12);
        text = Colors.blueGrey.shade900;
        border = Colors.blueGrey.withValues(alpha: 0.3);
      } else {
        bg = Colors.red.withValues(alpha: 0.12);
        text = Colors.red.shade900;
        border = Colors.red.withValues(alpha: 0.3);
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Text(
        word,
        style: TextStyle(
          fontSize: 22,
          height: 1.4,
          color: text,
          fontWeight: hasMistake ? FontWeight.bold : FontWeight.w500,
        ),
      ),
    );
  }

  Widget _controls(
    Tasmee3State state,
    Tasmee3Controller controller,
  ) {
    final isListening = state.status == Tasmee3Status.listening;
    final isBusy = state.status == Tasmee3Status.requestingPermission ||
        state.status == Tasmee3Status.loadingQuran ||
        state.status == Tasmee3Status.uploadingAudio ||
        state.status == Tasmee3Status.analyzing;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: const BoxDecoration(
        color: Color(0xFFFFFCF7),
        border: Border(
          top: BorderSide(color: Color(0xFFE0C5A3)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    isListening ? Colors.red.shade700 : const Color(0xFFA77A48),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: isBusy
                  ? null
                  : () async {
                      if (isListening) {
                        controller.stop();
                      } else {
                        final ok = await _showRecordingPrivacyDialog();
                        if (!ok) return;

                        controller.start(
                          RecitationTarget(
                            from: AyahRef(surah: surah, ayah: fromAyah),
                            to: AyahRef(surah: surah, ayah: toAyah),
                            mode: mode,
                          ),
                        );
                      }
                    },
              icon: Icon(isListening ? Icons.stop : Icons.mic),
              label: Text(isListening ? 'إيقاف وتحليل' : 'بدء التسميع'),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            tooltip: 'إعادة ضبط',
            onPressed: isBusy ? null : controller.reset,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
    );
  }

  Future<bool> _showRecordingPrivacyDialog() async {
    final asr = ref.read(tasmee3AsrSettingsProvider);
    final advancedNote = asr.isConfigured
        ? 'محرك ASR المتقدم مفعّل؛ قد يُرسل التسجيل إلى الخادم المحدد في إعدادات التشغيل.'
        : 'محرك ASR المتقدم غير مضبوط؛ سيُستخدم التعرف على الجهاز محلياً (fallback) بدون رفع إلى خادم.';

    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: const Text('تنبيه قبل التسجيل'),
            content: Text(
              'سيتم استخدام الميكروفون لتسجيل تلاوتك وتحليلها. $advancedNote '
              'لا يتم توليد نص القرآن بالذكاء الاصطناعي، وإنما تتم مقارنة تلاوتك '
              'بالنص القرآني الموثق داخل التطبيق.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('إلغاء'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('موافق'),
              ),
            ],
          ),
        );
      },
    );

    return result ?? false;
  }
}
