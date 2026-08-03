import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_controller.dart';
import '../application/tasmee3_providers.dart';
import '../application/tasmee3_ui_settings.dart';
import '../domain/ayah_ref.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_mistake.dart';

class Tasmee3Screen extends ConsumerStatefulWidget {
  const Tasmee3Screen({super.key});

  @override
  ConsumerState<Tasmee3Screen> createState() => _Tasmee3ScreenState();
}

class _Tasmee3ScreenState extends ConsumerState<Tasmee3Screen> {
  /// Short default range for better speech_to_text accuracy.
  int surah = 112;
  int fromAyah = 1;
  int toAyah = 3;
  Tasmee3Mode mode = Tasmee3Mode.showText;

  RecitationTarget get _currentTarget => RecitationTarget(
        from: AyahRef(surah: surah, ayah: fromAyah),
        to: AyahRef(surah: surah, ayah: toAyah),
        mode: mode,
      );

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tasmee3ControllerProvider);
    final controller = ref.read(tasmee3ControllerProvider.notifier);
    final ui = ref.watch(tasmee3UiSettingsProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: ui.backgroundColor,
        appBar: AppBar(
          title: Text(
            'التسميع',
            style: TextStyle(color: ui.textColor, fontWeight: FontWeight.w600),
          ),
          centerTitle: true,
          backgroundColor: ui.backgroundColor,
          foregroundColor: ui.textColor,
          elevation: 0,
        ),
        body: Column(
          children: [
            _targetCard(state, ui),
            _accuracyTip(ui),
            Expanded(child: _content(state, ui)),
            _controls(state, controller, ui),
          ],
        ),
      ),
    );
  }

  Widget _accuracyTip(Tasmee3UiSettings ui) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: ui.surfaceColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: ui.primaryColor.withValues(alpha: 0.25)),
        ),
        child: Text(
          'للحصول على دقة أعلى، اقرأ في مكان هادئ وبنطاق قصير.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            height: 1.5,
            color: ui.secondaryTextColor,
          ),
        ),
      ),
    );
  }

  Widget _targetCard(Tasmee3State state, Tasmee3UiSettings ui) {
    final disabled = state.status == Tasmee3Status.listening;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ui.surfaceColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: ui.primaryColor.withValues(alpha: 0.28)),
        boxShadow: [
          BoxShadow(
            color: ui.primaryColor.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _numberField(
                  label: 'السورة',
                  value: surah,
                  enabled: !disabled,
                  ui: ui,
                  onChanged: (v) => setState(() => surah = v),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _numberField(
                  label: 'من آية',
                  value: fromAyah,
                  enabled: !disabled,
                  ui: ui,
                  onChanged: (v) => setState(() => fromAyah = v),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _numberField(
                  label: 'إلى آية',
                  value: toAyah,
                  enabled: !disabled,
                  ui: ui,
                  onChanged: (v) => setState(() => toAyah = v),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<Tasmee3Mode>(
            value: mode,
            decoration: InputDecoration(
              labelText: 'وضع التسميع',
              labelStyle: TextStyle(color: ui.secondaryTextColor),
              border: const OutlineInputBorder(),
              enabledBorder: OutlineInputBorder(
                borderSide: BorderSide(
                  color: ui.primaryColor.withValues(alpha: 0.35),
                ),
              ),
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
        ],
      ),
    );
  }

  Widget _numberField({
    required String label,
    required int value,
    required bool enabled,
    required Tasmee3UiSettings ui,
    required ValueChanged<int> onChanged,
  }) {
    return TextFormField(
      initialValue: value.toString(),
      enabled: enabled,
      keyboardType: TextInputType.number,
      style: TextStyle(color: ui.textColor),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: ui.secondaryTextColor),
        border: const OutlineInputBorder(),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(
            color: ui.primaryColor.withValues(alpha: 0.35),
          ),
        ),
      ),
      onChanged: (text) {
        final parsed = int.tryParse(text);
        if (parsed != null && parsed > 0) {
          onChanged(parsed);
        }
      },
    );
  }

  Widget _content(Tasmee3State state, Tasmee3UiSettings ui) {
    switch (state.status) {
      case Tasmee3Status.idle:
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'اختر النطاق واضغط بدء التسميع',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 20, color: ui.secondaryTextColor),
            ),
          ),
        );

      case Tasmee3Status.requestingPermission:
        return Center(
          child: Text(
            'جاري طلب صلاحية الميكروفون...',
            style: TextStyle(color: ui.textColor),
          ),
        );

      case Tasmee3Status.loadingQuran:
        return Center(
          child: Text(
            'جاري تحميل الآيات...',
            style: TextStyle(color: ui.textColor),
          ),
        );

      case Tasmee3Status.listening:
        return _listeningContent(state, ui);

      case Tasmee3Status.analyzing:
        return Center(
          child: CircularProgressIndicator(color: ui.primaryColor),
        );

      case Tasmee3Status.completed:
        return _resultContent(state, ui);

      case Tasmee3Status.error:
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              state.errorMessage ?? 'حدث خطأ',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, color: Colors.red),
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

  Widget _listeningContent(Tasmee3State state, Tasmee3UiSettings ui) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Icon(Icons.mic, size: 72, color: ui.primaryColor),
          const SizedBox(height: 12),
          Text(
            'أستمع الآن...',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: ui.textColor,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _formatDuration(state.sessionDuration),
            style: TextStyle(
              fontSize: 18,
              fontFeatures: const [FontFeature.tabularFigures()],
              color: ui.primaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'اقرأ بوضوح. عند الانتهاء اضغط إيقاف وتحليل.',
            textAlign: TextAlign.center,
            style: TextStyle(color: ui.secondaryTextColor),
          ),
          const SizedBox(height: 18),
          if (ui.showRecognizedTextWhileListening)
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: ui.surfaceColor,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: ui.primaryColor.withValues(alpha: 0.28),
                  ),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    state.recognizedText.isEmpty
                        ? 'سيظهر النص المسموع هنا...'
                        : state.recognizedText,
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      fontSize: ui.arabicFontSize,
                      height: 1.8,
                      color: ui.textColor,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _resultContent(Tasmee3State state, Tasmee3UiSettings ui) {
    final result = state.result;
    final controller = ref.read(tasmee3ControllerProvider.notifier);

    if (result == null) {
      return Center(
        child: Text('لا توجد نتيجة', style: TextStyle(color: ui.textColor)),
      );
    }

    final mistakesByIndex = <int, Tasmee3Mistake>{};

    for (final mistake in result.mistakes) {
      if (mistake.type == Tasmee3MistakeType.wrongWord ||
          mistake.type == Tasmee3MistakeType.missingWord) {
        mistakesByIndex[mistake.globalWordIndex] = mistake;
      }
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (ui.showAccuracyCard)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: ui.surfaceColor,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: ui.primaryColor.withValues(alpha: 0.28),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'الدقة التقريبية: ${result.accuracyPercent}%',
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      color: ui.textColor,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'عدد الأخطاء: ${result.mistakesCount}',
                    style: TextStyle(
                      fontSize: 16,
                      color: ui.secondaryTextColor,
                    ),
                  ),
                  if (result.hasLowConfidence) ...[
                    const SizedBox(height: 8),
                    Text(
                      'تنبيه جودة الصوت: التعرف غير موثوق (ثقة أقل من 55%). '
                      'هذه مشكلة جودة صوت وليست خطأً في التلاوة القرآنية. '
                      'حاول القراءة في مكان هادئ وبنطاق أقصر.',
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.45,
                        color: Colors.orange.shade800,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          const SizedBox(height: 16),
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
                      ui: ui,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () async {
                    await controller.reset();
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: ui.primaryColor,
                    side: BorderSide(color: ui.primaryColor),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('إعادة التسميع'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () async {
                    if (ui.enableHapticFeedback) {
                      HapticFeedback.lightImpact();
                    }
                    await controller.retrySameRange();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ui.primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('نفس النطاق'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _wordChip({
    required String word,
    required Tasmee3Mistake? mistake,
    required Tasmee3UiSettings ui,
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
          fontSize: ui.resultWordFontSize,
          color: text,
          fontWeight: hasMistake ? FontWeight.bold : FontWeight.w500,
        ),
      ),
    );
  }

  Widget _controls(
    Tasmee3State state,
    Tasmee3Controller controller,
    Tasmee3UiSettings ui,
  ) {
    final isListening = state.status == Tasmee3Status.listening;
    final isCompleted = state.status == Tasmee3Status.completed;
    final isBusy = state.status == Tasmee3Status.requestingPermission ||
        state.status == Tasmee3Status.loadingQuran ||
        state.status == Tasmee3Status.analyzing;

    if (isCompleted) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: BoxDecoration(
        color: ui.surfaceColor,
        border: Border(
          top: BorderSide(color: ui.primaryColor.withValues(alpha: 0.28)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    isListening ? Colors.red.shade700 : ui.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: isBusy
                  ? null
                  : () {
                      if (ui.enableHapticFeedback) {
                        HapticFeedback.selectionClick();
                      }
                      if (isListening) {
                        controller.stop();
                      } else {
                        controller.start(_currentTarget);
                      }
                    },
              icon: Icon(isListening ? Icons.stop : Icons.mic),
              label: Text(isListening ? 'إيقاف وتحليل' : 'بدء التسميع'),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: isBusy
                ? null
                : () async {
                    await controller.reset();
                  },
            icon: Icon(Icons.refresh, color: ui.primaryColor),
          ),
        ],
      ),
    );
  }
}
