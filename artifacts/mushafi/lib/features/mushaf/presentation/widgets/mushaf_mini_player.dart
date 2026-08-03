import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../application/mushaf_providers.dart';
import '../../domain/mushaf_audio_state.dart';

class MushafMiniPlayer extends ConsumerWidget {
  const MushafMiniPlayer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final audio = ref.watch(mushafAudioControllerProvider);
    final controller = ref.read(mushafAudioControllerProvider.notifier);

    if (audio.status == MushafAudioStatus.idle) {
      return const SizedBox.shrink();
    }

    if (audio.status == MushafAudioStatus.error) {
      return SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.all(Tasmee3Spacing.md),
          decoration: const BoxDecoration(
            color: Tasmee3Colors.surface,
            border: Border(
              top: BorderSide(color: Tasmee3Colors.border),
            ),
          ),
          child: Row(
            children: [
              const Icon(Icons.error_outline, color: Tasmee3Colors.danger),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  audio.errorMessage ?? 'تعذر تشغيل الصوت.',
                  style: const TextStyle(color: Tasmee3Colors.danger),
                ),
              ),
              IconButton(
                onPressed: controller.stop,
                icon: const Icon(Icons.close),
              ),
            ],
          ),
        ),
      );
    }

    final title = audio.currentSurah == null
        ? 'تشغيل التلاوة'
        : 'سورة ${audio.currentSurah} - آية ${audio.currentAyah}';

    final progress = audio.duration.inMilliseconds > 0
        ? (audio.position.inMilliseconds / audio.duration.inMilliseconds)
            .clamp(0.0, 1.0)
        : 0.0;

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
        decoration: const BoxDecoration(
          color: Tasmee3Colors.surface,
          border: Border(
            top: BorderSide(color: Tasmee3Colors.border),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (audio.duration.inMilliseconds > 0)
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 4,
                  backgroundColor:
                      Tasmee3Colors.border.withValues(alpha: 0.35),
                  color: Tasmee3Colors.primary,
                ),
              ),
            const SizedBox(height: 8),
            Row(
              children: [
                IconButton(
                  onPressed: controller.previous,
                  icon: const Icon(Icons.skip_previous),
                ),
                IconButton(
                  onPressed:
                      audio.isPlaying ? controller.pause : controller.resume,
                  icon: Icon(
                    audio.isPlaying
                        ? Icons.pause_circle_filled
                        : Icons.play_circle_fill,
                    color: Tasmee3Colors.primary,
                    size: 34,
                  ),
                ),
                IconButton(
                  onPressed: controller.next,
                  icon: const Icon(Icons.skip_next),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Tasmee3Colors.text,
                        ),
                      ),
                      Text(
                        audio.reciterName ?? 'القارئ',
                        textAlign: TextAlign.right,
                        style:
                            Tasmee3TextStyles.secondary.copyWith(fontSize: 12),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: controller.stop,
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
