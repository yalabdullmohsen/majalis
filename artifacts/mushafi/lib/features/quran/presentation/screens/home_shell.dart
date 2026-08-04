import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/core/constants/app_constants.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/mushaf/application/mushaf_providers.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

/// App entry shell. Navigation opens only the new mushaf + new tasmee3.
class HomeShell extends ConsumerWidget {
  const HomeShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    final mushafPage = ref.watch(mushafControllerProvider).currentPage;
    return Scaffold(
      backgroundColor: colors.scaffold,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Text(
                AppConstants.appName,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'MushafiUi',
                  fontSize: 36,
                  color: colors.ornament,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'مصحف هادئ للقراءة والتلاوة ومراجعة الحفظ',
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.secondaryText),
              ),
              const Spacer(),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFA77A48),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 52),
                ),
                onPressed: () => context.go('/mushaf-home'),
                icon: const Icon(Icons.menu_book_outlined),
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('المصحف'),
                    const SizedBox(width: 8),
                    _NewBadge(label: 'الجديد'),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              FilledButton(
                onPressed: () => context.go('/mushaf?page=$mushafPage'),
                child: Text('متابعة القراءة — ص $mushafPage'),
              ),
              const SizedBox(height: 10),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF765332),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 52),
                ),
                onPressed: () => context.go('/tasmee3'),
                icon: const Icon(Icons.mic_none_outlined),
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('التسميع'),
                    const SizedBox(width: 8),
                    _NewBadge(label: 'الجديد'),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: () => context.go('/settings'),
                child: const Text('الإعدادات'),
              ),
              const Spacer(),
              Text(
                'يعمل التطبيق على المصحف الجديد والتسميع الجديد فقط.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: colors.secondaryText,
                  fontSize: 12,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NewBadge extends StatelessWidget {
  const _NewBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.orange.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.orange,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
