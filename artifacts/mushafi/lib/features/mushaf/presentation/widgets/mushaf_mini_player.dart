import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/mushaf_providers.dart';
import '../../domain/mushaf_audio_state.dart';
import '../mushaf_design_tokens.dart';

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
          padding: const EdgeInsets.all(MushafSpacing.md),
          decoration: const BoxDecoration(
            color: MushafColors.surface,
            border: Border(
              top: BorderSide(color: MushafColors.border),
            ),
          ),
          child: Row(
            children: [
              const Icon(Icons.error_outline, color: MushafColors.danger),
              const SizedBox(width: MushafSpacing.sm),
              Expanded(
                child: Text(
                  audio.errorMessage?.contains('مرخص') == true ||
                          audio.errorMessage?.contains('مصدر') == true
                      ? 'أضف مصدر صوت مرخص للقارئ من إعدادات الصوت.'
                      : (audio.errorMessage ?? 'تعذر تشغيل الصوت.'),
                  style: MushafTextStyles.secondary.copyWith(
                    color: MushafColors.danger,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'إغلاق',
                onPressed: controller.stop,
                icon: const Icon(Icons.close, size: 20),
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
        padding: const EdgeInsets.fromLTRB(10, 6, 10, 8),
        decoration: const BoxDecoration(
          color: MushafColors.surface,
          border: Border(
            top: BorderSide(color: MushafColors.border),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (audio.duration.inMilliseconds > 0)
              ClipRRect(
                borderRadius: BorderRadius.circular(MushafRadius.pill),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 3,
                  backgroundColor:
                      MushafColors.border.withValues(alpha: 0.35),
                  color: MushafColors.primary,
                ),
              ),
            const SizedBox(height: 6),
            Row(
              children: [
                IconButton(
                  tooltip: 'السابق',
                  visualDensity: VisualDensity.compact,
                  onPressed: controller.previous,
                  icon: const Icon(Icons.skip_previous, size: 22),
                ),
                IconButton(
                  tooltip: audio.isPlaying ? 'إيقاف مؤقت' : 'تشغيل',
                  onPressed:
                      audio.isPlaying ? controller.pause : controller.resume,
                  icon: Icon(
                    audio.isPlaying
                        ? Icons.pause_circle_filled
                        : Icons.play_circle_fill,
                    color: MushafColors.primary,
                    size: 32,
                  ),
                ),
                IconButton(
                  tooltip: 'التالي',
                  visualDensity: VisualDensity.compact,
                  onPressed: controller.next,
                  icon: const Icon(Icons.skip_next, size: 22),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: MushafTextStyles.body.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        audio.reciterName ?? 'القارئ',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: MushafTextStyles.secondary.copyWith(fontSize: 12),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'إيقاف',
                  visualDensity: VisualDensity.compact,
                  onPressed: controller.stop,
                  icon: const Icon(Icons.stop_circle_outlined, size: 22),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
