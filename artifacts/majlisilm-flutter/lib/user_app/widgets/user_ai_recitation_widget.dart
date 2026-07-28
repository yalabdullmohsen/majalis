import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../../shared/theme/majlis_colors.dart';

/// Arabic speech_to_text widget — compares recognized speech to [targetVerse].
class UserAIRecitationWidget extends StatefulWidget {
  const UserAIRecitationWidget({
    super.key,
    required this.targetVerse,
    this.label = 'اختبار التلاوة بالذكاء',
  });

  final String targetVerse;
  final String label;

  @override
  State<UserAIRecitationWidget> createState() => _UserAIRecitationWidgetState();
}

class _UserAIRecitationWidgetState extends State<UserAIRecitationWidget> {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _ready = false;
  bool _listening = false;
  bool _consented = false;
  String _transcript = '';
  double _accuracy = 0;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initSpeech();
  }

  Future<void> _initSpeech() async {
    try {
      _ready = await _speech.initialize(
        onError: (e) => setState(() => _error = e.errorMsg),
        onStatus: (s) {
          if (s == 'done' || s == 'notListening') {
            setState(() => _listening = false);
          }
        },
      );
      if (mounted) setState(() {});
    } catch (e) {
      if (mounted) {
        setState(() {
          _ready = false;
          _error = 'التعرف الصوتي غير متاح على هذا الجهاز';
        });
      }
    }
  }

  Future<void> _start() async {
    if (!_ready) {
      await _initSpeech();
      if (!_ready) return;
    }
    setState(() {
      _listening = true;
      _transcript = '';
      _accuracy = 0;
      _error = null;
    });
    await _speech.listen(
      localeId: 'ar_SA',
      partialResults: true,
      cancelOnError: true,
      listenMode: stt.ListenMode.dictation,
      onResult: (result) {
        setState(() {
          _transcript = result.recognizedWords;
          if (result.finalResult) {
            _accuracy = _matchPercent(widget.targetVerse, _transcript);
            _listening = false;
          }
        });
      },
    );
  }

  Future<void> _stop() async {
    await _speech.stop();
    setState(() {
      _listening = false;
      if (_transcript.isNotEmpty) {
        _accuracy = _matchPercent(widget.targetVerse, _transcript);
      }
    });
  }

  void _reset() {
    setState(() {
      _transcript = '';
      _accuracy = 0;
      _error = null;
    });
  }

  /// Token-overlap accuracy (0–100) after light Arabic normalization.
  static double _matchPercent(String target, String heard) {
    final t = _normalize(target);
    final h = _normalize(heard);
    if (t.isEmpty || h.isEmpty) return 0;
    final tTokens = t.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toSet();
    final hTokens = h.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toSet();
    if (tTokens.isEmpty) return 0;
    var hit = 0;
    for (final w in tTokens) {
      if (hTokens.contains(w)) hit++;
    }
    return (hit / tTokens.length) * 100.0;
  }

  static String _normalize(String s) {
    return s
        .replaceAll(RegExp(r'[^\u0600-\u06FF\s]'), '')
        .replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '')
        .replaceAll('أ', 'ا')
        .replaceAll('إ', 'ا')
        .replaceAll('آ', 'ا')
        .replaceAll('ة', 'ه')
        .replaceAll('ى', 'ي')
        .trim();
  }

  @override
  void dispose() {
    _speech.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.targetVerse.trim().isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text('حدّد آية للبدء في اختبار التلاوة.'),
      );
    }

    if (!_consented) {
      return Card(
        margin: const EdgeInsets.all(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(widget.label, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              const Text(
                'يستمع التطبيق لصوتك محليًا عبر التعرف الصوتي (locale: ar_SA) '
                'ويقارن النص بالآية. لا يُرفع الصوت إلى خوادم المجلس.',
              ),
              const SizedBox(height: 12),
              Text(
                widget.targetVerse,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, height: 1.9),
                textDirection: TextDirection.rtl,
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => setState(() => _consented = true),
                child: const Text('أوافق وأبدأ'),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.label, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              widget.targetVerse,
              textAlign: TextAlign.center,
              textDirection: TextDirection.rtl,
              style: const TextStyle(fontSize: 18, height: 1.9),
            ),
            const SizedBox(height: 12),
            if (_listening)
              FilledButton.icon(
                onPressed: _stop,
                icon: const Icon(Icons.stop),
                label: const Text('إيقاف الاستماع'),
                style: FilledButton.styleFrom(backgroundColor: MajlisColors.rose),
              )
            else
              FilledButton.icon(
                onPressed: _ready ? _start : null,
                icon: const Icon(Icons.mic),
                label: const Text('ابدأ الاستماع'),
                style: FilledButton.styleFrom(backgroundColor: MajlisColors.brown),
              ),
            if (_transcript.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('المسموع: $_transcript', textDirection: TextDirection.rtl),
            ],
            if (!_listening && _transcript.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                'نسبة التطابق: ${_accuracy.toStringAsFixed(0)}٪',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              LinearProgressIndicator(
                value: (_accuracy / 100).clamp(0.0, 1.0),
                minHeight: 8,
                borderRadius: BorderRadius.circular(8),
                color: MajlisColors.sage,
                backgroundColor: Colors.black12,
              ),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: _reset,
                icon: const Icon(Icons.refresh),
                label: const Text('إعادة المحاولة'),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ],
          ],
        ),
      ),
    );
  }
}
