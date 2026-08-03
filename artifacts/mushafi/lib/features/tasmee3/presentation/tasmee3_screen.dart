import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_controller.dart';
import '../application/tasmee3_providers.dart';
import '../domain/ayah_ref.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_mistake.dart';

class Tasmee3Screen extends ConsumerStatefulWidget {
  const Tasmee3Screen({super.key});

  @override
  ConsumerState<Tasmee3Screen> createState() => _Tasmee3ScreenState();
}

class _Tasmee3ScreenState extends ConsumerState<Tasmee3Screen> {
  int surah = 112;
  int fromAyah = 1;
  int toAyah = 4;
  Tasmee3Mode mode = Tasmee3Mode.showText;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tasmee3ControllerProvider);
    final controller = ref.read(tasmee3ControllerProvider.notifier);

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
        ),
        body: Column(
          children: [
            _targetCard(state),
            Expanded(child: _content(state)),
            _controls(state, controller),
          ],
        ),
      ),
    );
  }

  Widget _targetCard(Tasmee3State state) {
    final disabled = state.status == Tasmee3Status.listening;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0C5A3)),
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
                  onChanged: (v) => setState(() => surah = v),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _numberField(
                  label: 'من آية',
                  value: fromAyah,
                  enabled: !disabled,
                  onChanged: (v) => setState(() => fromAyah = v),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _numberField(
                  label: 'إلى آية',
                  value: toAyah,
                  enabled: !disabled,
                  onChanged: (v) => setState(() => toAyah = v),
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
                child: Text('اختبار حفظ'),
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
    required ValueChanged<int> onChanged,
  }) {
    return TextFormField(
      initialValue: value.toString(),
      enabled: enabled,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      onChanged: (text) {
        final parsed = int.tryParse(text);
        if (parsed != null && parsed > 0) {
          onChanged(parsed);
        }
      },
    );
  }

  Widget _content(Tasmee3State state) {
    switch (state.status) {
      case Tasmee3Status.idle:
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'اختر النطاق واضغط بدء التسميع',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 20, color: Color(0xFF9A8068)),
            ),
          ),
        );

      case Tasmee3Status.requestingPermission:
        return const Center(child: Text('جاري طلب صلاحية الميكروفون...'));

      case Tasmee3Status.loadingQuran:
        return const Center(child: Text('جاري تحميل الآيات...'));

      case Tasmee3Status.listening:
        return _listeningContent(state);

      case Tasmee3Status.analyzing:
        return const Center(child: CircularProgressIndicator());

      case Tasmee3Status.completed:
        return _resultContent(state);

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

  Widget _listeningContent(Tasmee3State state) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const Icon(
            Icons.mic,
            size: 72,
            color: Color(0xFFA77A48),
          ),
          const SizedBox(height: 12),
          const Text(
            'أستمع الآن...',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'اقرأ بوضوح. عند الانتهاء اضغط إيقاف وتحليل.',
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
                      ? 'سيظهر النص المسموع هنا...'
                      : state.recognizedText,
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    fontSize: 24,
                    height: 1.8,
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
          mistake.type == Tasmee3MistakeType.missingWord) {
        mistakesByIndex[mistake.globalWordIndex] = mistake;
      }
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFCF7),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE0C5A3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'الدقة التقريبية: ${result.accuracyPercent}%',
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'عدد الأخطاء: ${result.mistakesCount}',
                  style: const TextStyle(
                    fontSize: 16,
                    color: Color(0xFF9A8068),
                  ),
                ),
                if (result.hasLowConfidence) ...[
                  const SizedBox(height: 6),
                  const Text(
                    'تنبيه: جودة التعرف الصوتي منخفضة. حاول القراءة في مكان هادئ.',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.orange,
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
                  : () {
                      if (isListening) {
                        controller.stop();
                      } else {
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
            onPressed: isBusy ? null : controller.reset,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
    );
  }
}
