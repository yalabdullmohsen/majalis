import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../application/mushaf_providers.dart';
import '../data/reciters_catalog.dart';
import '../domain/mushaf_audio_settings.dart';

class MushafAudioSettingsScreen extends ConsumerStatefulWidget {
  const MushafAudioSettingsScreen({super.key});

  @override
  ConsumerState<MushafAudioSettingsScreen> createState() =>
      _MushafAudioSettingsScreenState();
}

class _MushafAudioSettingsScreenState
    extends ConsumerState<MushafAudioSettingsScreen> {
  MushafAudioSettings settings = const MushafAudioSettings.defaults();
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repository = ref.read(mushafAudioSettingsRepositoryProvider);
    final loaded = await repository.load();

    if (!mounted) return;

    setState(() {
      settings = loaded;
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Tasmee3AppScaffold(
        title: 'إعدادات الصوت',
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Tasmee3AppScaffold(
      title: 'إعدادات الصوت',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: [
          Container(
            padding: const EdgeInsets.all(Tasmee3Spacing.lg),
            decoration: BoxDecoration(
              color: Tasmee3Colors.surface,
              borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
              border: Border.all(color: Tasmee3Colors.border),
            ),
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  value: settings.reciterId,
                  decoration: const InputDecoration(
                    labelText: 'القارئ',
                    border: OutlineInputBorder(),
                  ),
                  items: RecitersCatalog.all.map((reciter) {
                    return DropdownMenuItem(
                      value: reciter.id,
                      child: Text(
                        reciter.isConfigured
                            ? reciter.nameArabic
                            : '${reciter.nameArabic} - يحتاج مصدر صوت',
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      settings = settings.copyWith(reciterId: value);
                    });
                  },
                ),
                const SizedBox(height: Tasmee3Spacing.md),
                DropdownButtonFormField<int>(
                  value: settings.repeatAyahCount.clamp(1, 10),
                  decoration: const InputDecoration(
                    labelText: 'تكرار الآية',
                    border: OutlineInputBorder(),
                  ),
                  items: List.generate(10, (index) {
                    final value = index + 1;
                    return DropdownMenuItem(
                      value: value,
                      child: Text('$value مرة'),
                    );
                  }),
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      settings = settings.copyWith(repeatAyahCount: value);
                    });
                  },
                ),
                const SizedBox(height: Tasmee3Spacing.md),
                DropdownButtonFormField<int>(
                  value: settings.repeatRangeCount.clamp(1, 10),
                  decoration: const InputDecoration(
                    labelText: 'تكرار النطاق',
                    border: OutlineInputBorder(),
                  ),
                  items: List.generate(10, (index) {
                    final value = index + 1;
                    return DropdownMenuItem(
                      value: value,
                      child: Text('$value مرة'),
                    );
                  }),
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      settings = settings.copyWith(repeatRangeCount: value);
                    });
                  },
                ),
                const SizedBox(height: Tasmee3Spacing.md),
                DropdownButtonFormField<int>(
                  value: settings.sleepTimerMinutes,
                  decoration: const InputDecoration(
                    labelText: 'مؤقت النوم',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 0, child: Text('بدون')),
                    DropdownMenuItem(value: 5, child: Text('5 دقائق')),
                    DropdownMenuItem(value: 10, child: Text('10 دقائق')),
                    DropdownMenuItem(value: 15, child: Text('15 دقيقة')),
                    DropdownMenuItem(value: 30, child: Text('30 دقيقة')),
                    DropdownMenuItem(value: 60, child: Text('60 دقيقة')),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      settings = settings.copyWith(sleepTimerMinutes: value);
                    });
                  },
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: settings.autoScrollToPlayingAyah,
                  title: const Text('الانتقال للآية المشغلة تلقائيا'),
                  activeColor: Tasmee3Colors.primary,
                  onChanged: (value) {
                    setState(() {
                      settings =
                          settings.copyWith(autoScrollToPlayingAyah: value);
                    });
                  },
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: settings.playNextAyahAutomatically,
                  title: const Text('تشغيل الآية التالية تلقائيا'),
                  activeColor: Tasmee3Colors.primary,
                  onChanged: (value) {
                    setState(() {
                      settings = settings.copyWith(
                        playNextAyahAutomatically: value,
                      );
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () async {
              final repository =
                  ref.read(mushafAudioSettingsRepositoryProvider);
              await repository.save(settings);
              await ref
                  .read(mushafAudioControllerProvider.notifier)
                  .saveSettings(settings);
              ref.invalidate(mushafAudioSettingsProvider);

              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('تم حفظ إعدادات الصوت.')),
                );
              }
            },
            icon: const Icon(Icons.save),
            label: const Text('حفظ'),
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          const Text(
            'تنبيه: لا تستخدم إلا مصادر صوت مرخصة وموثوقة للقراء.',
            textAlign: TextAlign.center,
            style: Tasmee3TextStyles.secondary,
          ),
        ],
      ),
    );
  }
}
