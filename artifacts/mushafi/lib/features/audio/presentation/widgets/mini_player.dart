import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/audio/presentation/providers/audio_providers.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

class MiniPlayer extends ConsumerWidget {
  const MiniPlayer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    final audio = ref.watch(audioControllerProvider);
    final label = audio.current == null
        ? 'لا توجد تلاوة'
        : 'الآية ${audio.current!.surahId}:${audio.current!.ayahNumber}';

    return Material(
      color: colors.paper.withValues(alpha: 0.96),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              IconButton(
                onPressed: () =>
                    ref.read(audioControllerProvider.notifier).toggle(),
                icon: Icon(
                  audio.playing ? Icons.pause : Icons.play_arrow,
                  color: colors.ornament,
                ),
              ),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(color: colors.ink, fontFamily: 'MushafiUi'),
                ),
              ),
              DropdownButton<double>(
                value: audio.speed,
                underline: const SizedBox.shrink(),
                items: const [
                  DropdownMenuItem(value: 0.75, child: Text('٠٫٧٥×')),
                  DropdownMenuItem(value: 1.0, child: Text('١×')),
                  DropdownMenuItem(value: 1.25, child: Text('١٫٢٥×')),
                ],
                onChanged: (v) {
                  if (v != null) {
                    ref.read(audioControllerProvider.notifier).setSpeed(v);
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
