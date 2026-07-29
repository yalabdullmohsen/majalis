import 'package:flutter/material.dart';

import 'ai_recitation_controller.dart';
import 'models/quran_word_state.dart';
import 'models/recitation_feedback.dart';
import 'models/word_recitation_status.dart';

/// Interactive Tarteel-style Quran recitation screen with live word highlighting.
class AiRecitationView extends StatefulWidget {
  const AiRecitationView({
    super.key,
    required this.targetVerse,
    this.verseRef,
    this.recognitionWebsocketUrl,
    this.title = 'التسميع الذكي',
  });

  final String targetVerse;
  final String? verseRef;
  final Uri? recognitionWebsocketUrl;
  final String title;

  /// Convenience route helper.
  static Future<void> open(
    BuildContext context, {
    required String targetVerse,
    String? verseRef,
    Uri? recognitionWebsocketUrl,
  }) {
    return Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => AiRecitationView(
          targetVerse: targetVerse,
          verseRef: verseRef,
          recognitionWebsocketUrl: recognitionWebsocketUrl,
        ),
      ),
    );
  }

  @override
  State<AiRecitationView> createState() => _AiRecitationViewState();
}

class _AiRecitationViewState extends State<AiRecitationView>
    with SingleTickerProviderStateMixin {
  late final AiRecitationController _controller;
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _controller = AiRecitationController(
      targetVerse: widget.targetVerse,
      recognitionWebsocketUrl: widget.recognitionWebsocketUrl,
    );
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _controller.addListener(_onControllerTick);
  }

  void _onControllerTick() {
    if (!mounted) return;
    if (_controller.isListening && !_controller.isPaused) {
      if (!_pulse.isAnimating) _pulse.repeat(reverse: true);
    } else {
      _pulse
        ..stop()
        ..value = 0;
    }
    setState(() {});
  }

  @override
  void dispose() {
    _controller.removeListener(_onControllerTick);
    _controller.dispose();
    _pulse.dispose();
    super.dispose();
  }

  Future<void> _onMicPressed() async {
    if (_controller.isListening && !_controller.isPaused) {
      await _controller.pause();
      return;
    }
    if (_controller.isPaused) {
      await _controller.resume();
      return;
    }
    await _controller.start();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          IconButton(
            tooltip: 'إعادة التعيين',
            onPressed: _controller.resetAlignment,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: _MicPulseButton(
        pulse: _pulse,
        listening: _controller.isListening && !_controller.isPaused,
        paused: _controller.isPaused,
        busy: _controller.isBusy,
        onPressed: _controller.isBusy ? null : _onMicPressed,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
          children: [
            if (widget.verseRef != null) ...[
              Text(
                widget.verseRef!,
                textAlign: TextAlign.center,
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
            ],
            _StatusBanner(feedback: _controller.feedback),
            const SizedBox(height: 16),
            _ControlDashboard(
              memorizationMode: _controller.memorizationMode,
              accuracy: _controller.accuracy,
              onToggleMemorization: _controller.toggleMemorizationMode,
              onStop: _controller.isListening ? _controller.stop : null,
            ),
            const SizedBox(height: 20),
            _VerseRenderer(
              words: _controller.words,
              memorizationMode: _controller.memorizationMode,
            ),
            if (_controller.lastTranscript.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text(
                'المسموع',
                style: theme.textTheme.titleSmall,
              ),
              const SizedBox(height: 6),
              Text(
                _controller.lastTranscript,
                textDirection: TextDirection.rtl,
                style: theme.textTheme.bodyLarge?.copyWith(height: 1.7),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.feedback});

  final RecitationFeedback feedback;

  Color _bg(BuildContext context) {
    switch (feedback.phase) {
      case RecitationSessionPhase.listening:
      case RecitationSessionPhase.aligning:
        return Colors.green.shade50;
      case RecitationSessionPhase.verseComplete:
        return Colors.green.shade100;
      case RecitationSessionPhase.error:
        return Colors.red.shade50;
      case RecitationSessionPhase.paused:
        return Colors.orange.shade50;
      case RecitationSessionPhase.requestingPermission:
        return Colors.blue.shade50;
      case RecitationSessionPhase.idle:
        return Theme.of(context).colorScheme.surfaceContainerHighest;
    }
  }

  Color _fg() {
    switch (feedback.phase) {
      case RecitationSessionPhase.error:
        return Colors.redAccent;
      case RecitationSessionPhase.verseComplete:
        return Colors.green.shade800;
      case RecitationSessionPhase.paused:
        return Colors.orange.shade800;
      default:
        return Colors.grey.shade800;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: _bg(context),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _fg().withValues(alpha: 0.18)),
      ),
      child: Column(
        children: [
          Text(
            feedback.messageAr,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: _fg(),
              fontSize: 15,
            ),
          ),
          if (feedback.detailAr != null) ...[
            const SizedBox(height: 4),
            Text(
              feedback.detailAr!,
              textAlign: TextAlign.center,
              textDirection: TextDirection.rtl,
              style: TextStyle(color: _fg().withValues(alpha: 0.85)),
            ),
          ],
        ],
      ),
    );
  }
}

class _ControlDashboard extends StatelessWidget {
  const _ControlDashboard({
    required this.memorizationMode,
    required this.accuracy,
    required this.onToggleMemorization,
    required this.onStop,
  });

  final bool memorizationMode;
  final double accuracy;
  final VoidCallback onToggleMemorization;
  final Future<void> Function()? onStop;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: onToggleMemorization,
            icon: Icon(
              memorizationMode
                  ? Icons.visibility_rounded
                  : Icons.visibility_off_rounded,
            ),
            label: Text(
              memorizationMode ? 'إظهار النص' : 'إخفاء النص',
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: onStop == null ? null : () => onStop!(),
            icon: const Icon(Icons.stop_circle_outlined),
            label: const Text('إيقاف'),
          ),
        ),
        const SizedBox(width: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            '${(accuracy * 100).round()}٪',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: Colors.green.shade800,
            ),
          ),
        ),
      ],
    );
  }
}

class _VerseRenderer extends StatelessWidget {
  const _VerseRenderer({
    required this.words,
    required this.memorizationMode,
  });

  final List<QuranWordState> words;
  final bool memorizationMode;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Theme.of(context).dividerColor.withValues(alpha: 0.6),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: RichText(
        textAlign: TextAlign.center,
        textDirection: TextDirection.rtl,
        text: TextSpan(
          children: [
            for (var i = 0; i < words.length; i++) ...[
              _wordSpan(words[i]),
              if (i < words.length - 1) const TextSpan(text: ' '),
            ],
          ],
        ),
      ),
    );
  }

  TextSpan _wordSpan(QuranWordState word) {
    final style = _styleFor(word.status);
    final hidePending =
        memorizationMode && word.status == WordRecitationStatus.pending;

    return TextSpan(
      text: word.originalWord,
      style: style.copyWith(
        color: hidePending ? Colors.transparent : style.color,
        backgroundColor:
            hidePending ? Colors.transparent : style.backgroundColor,
        shadows: hidePending
            ? [
                Shadow(
                  color: Colors.grey.shade400,
                  blurRadius: 10,
                ),
              ]
            : null,
      ),
    );
  }

  TextStyle _styleFor(WordRecitationStatus status) {
    const baseSize = 26.0;
    const height = 2.05;

    switch (status) {
      case WordRecitationStatus.correct:
        return TextStyle(
          fontSize: baseSize,
          height: height,
          fontWeight: FontWeight.w700,
          color: Colors.green.shade800,
          backgroundColor: Colors.green.shade50,
        );
      case WordRecitationStatus.incorrect:
        return TextStyle(
          fontSize: baseSize,
          height: height,
          fontWeight: FontWeight.w700,
          color: Colors.redAccent,
          backgroundColor: Colors.red.shade50,
        );
      case WordRecitationStatus.missing:
        return TextStyle(
          fontSize: baseSize,
          height: height,
          fontWeight: FontWeight.w600,
          color: Colors.orange,
          decoration: TextDecoration.underline,
          decorationColor: Colors.orange.shade200,
        );
      case WordRecitationStatus.pending:
        return TextStyle(
          fontSize: baseSize,
          height: height,
          fontWeight: FontWeight.w600,
          color: Colors.grey.shade800,
        );
    }
  }
}

class _MicPulseButton extends StatelessWidget {
  const _MicPulseButton({
    required this.pulse,
    required this.listening,
    required this.paused,
    required this.busy,
    required this.onPressed,
  });

  final AnimationController pulse;
  final bool listening;
  final bool paused;
  final bool busy;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final color = listening
        ? Colors.redAccent
        : paused
            ? Colors.orange
            : Theme.of(context).colorScheme.primary;

    return AnimatedBuilder(
      animation: pulse,
      builder: (context, child) {
        final scale = listening ? 1 + (pulse.value * 0.12) : 1.0;
        return Transform.scale(
          scale: scale,
          child: child,
        );
      },
      child: FloatingActionButton.extended(
        onPressed: onPressed,
        backgroundColor: color,
        foregroundColor: Colors.white,
        icon: Icon(
          listening
              ? Icons.pause_rounded
              : paused
                  ? Icons.play_arrow_rounded
                  : Icons.mic_rounded,
        ),
        label: Text(
          busy
              ? '...'
              : listening
                  ? 'إيقاف مؤقت'
                  : paused
                      ? 'متابعة'
                      : 'ابدأ التسميع',
        ),
      ),
    );
  }
}
