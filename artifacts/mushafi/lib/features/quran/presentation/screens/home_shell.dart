import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/core/constants/app_constants.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

class HomeShell extends ConsumerWidget {
  const HomeShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    final last = ref.watch(settingsRepositoryProvider).lastPage;
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
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFA77A48).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: const Color(0xFFE0C5A3)),
                ),
                child: const Text(
                  'تحديث ظاهر: اضغط «المصحف» أدناه',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF765332),
                    fontWeight: FontWeight.w700,
                  ),
                ),
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
                label: const Text('المصحف'),
              ),
              const SizedBox(height: 10),
              FilledButton(
                onPressed: () => context.go('/mushaf?page=$last'),
                child: Text('متابعة القراءة — ص $last'),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: () => context.go('/surahs'),
                child: const Text('فهرس السور'),
              ),
              OutlinedButton(
                onPressed: () => context.go('/khatmah'),
                child: const Text('الختمة'),
              ),
              OutlinedButton(
                onPressed: () => context.go('/tasmee3'),
                child: const Text('تسميع'),
              ),
              OutlinedButton(
                onPressed: () => context.go('/tasmee3-dashboard'),
                child: const Text('لوحة التسميع'),
              ),
              OutlinedButton(
                onPressed: () => context.go('/settings'),
                child: const Text('الإعدادات'),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
