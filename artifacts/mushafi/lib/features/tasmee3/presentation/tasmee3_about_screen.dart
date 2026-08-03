import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import 'quran_integrity_screen.dart';
import 'quran_sources_screen.dart';
import 'tasmee3_asr_settings_screen.dart';
import 'tasmee3_design_tokens.dart';
import 'tasmee3_limitations_screen.dart';
import 'tasmee3_privacy_screen.dart';
import 'widgets/tasmee3_app_scaffold.dart';
import 'widgets/tasmee3_error_state.dart';
import 'widgets/tasmee3_loading_state.dart';

class Tasmee3AboutScreen extends ConsumerWidget {
  const Tasmee3AboutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appInfo = ref.watch(tasmee3AppInfoProvider);

    return Tasmee3AppScaffold(
      title: 'حول التطبيق',
      body: appInfo.when(
        loading: () => const Tasmee3LoadingState(
          message: 'جاري تحميل معلومات التطبيق...',
        ),
        error: (error, stackTrace) => Tasmee3ErrorState(
          message: ref.read(tasmee3ErrorMapperProvider).map(error),
          onRetry: () {
            ref.invalidate(tasmee3AppInfoProvider);
          },
        ),
        data: (info) {
          return ListView(
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
                    const Icon(
                      Icons.menu_book_outlined,
                      color: Tasmee3Colors.primary,
                      size: 58,
                    ),
                    const SizedBox(height: Tasmee3Spacing.md),
                    Text(
                      info.appName,
                      textAlign: TextAlign.center,
                      style: Tasmee3TextStyles.title,
                    ),
                    const SizedBox(height: Tasmee3Spacing.sm),
                    Text(
                      'الإصدار ${info.versionLabel}',
                      textAlign: TextAlign.center,
                      style: Tasmee3TextStyles.secondary,
                    ),
                    const SizedBox(height: Tasmee3Spacing.sm),
                    const Text(
                      'تطبيق يساعدك على مراجعة حفظ القرآن بجلسات تسميع وتقارير وخطة مراجعة.',
                      textAlign: TextAlign.center,
                      style: Tasmee3TextStyles.secondary,
                    ),
                    const SizedBox(height: Tasmee3Spacing.sm),
                    const Text(
                      'نتائج التسميع تقديرية ومساعدة تقنية، وليست حكما شرعيا على التلاوة.',
                      textAlign: TextAlign.center,
                      style: Tasmee3TextStyles.secondary,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Tasmee3Spacing.lg),
              _AboutTile(
                icon: Icons.privacy_tip_outlined,
                title: 'سياسة الخصوصية',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const Tasmee3PrivacyScreen(),
                    ),
                  );
                },
              ),
              _AboutTile(
                icon: Icons.info_outline,
                title: 'حدود ميزة التسميع',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const Tasmee3LimitationsScreen(),
                    ),
                  );
                },
              ),
              _AboutTile(
                icon: Icons.source_outlined,
                title: 'مصادر النص القرآني',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const QuranSourcesScreen(),
                    ),
                  );
                },
              ),
              _AboutTile(
                icon: Icons.verified_outlined,
                title: 'فحص ملف القرآن',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const QuranIntegrityScreen(),
                    ),
                  );
                },
              ),
              _AboutTile(
                icon: Icons.settings_outlined,
                title: 'إعدادات محرك التسميع',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const Tasmee3AsrSettingsScreen(),
                    ),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class _AboutTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _AboutTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: Tasmee3Spacing.sm),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.md),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: ListTile(
        leading: Icon(icon, color: Tasmee3Colors.primary),
        title: Text(title),
        trailing: const Icon(Icons.chevron_left),
        onTap: onTap,
      ),
    );
  }
}
