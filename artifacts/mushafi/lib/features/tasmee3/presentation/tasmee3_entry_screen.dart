import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import 'tasmee3_dashboard_screen.dart';
import 'tasmee3_onboarding_screen.dart';
import 'widgets/tasmee3_error_state.dart';
import 'widgets/tasmee3_loading_state.dart';

class Tasmee3EntryScreen extends ConsumerWidget {
  const Tasmee3EntryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasSeen = ref.watch(tasmee3HasSeenOnboardingProvider);

    return hasSeen.when(
      loading: () => const Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          body: Tasmee3LoadingState(
            message: 'جاري تجهيز تجربة التسميع...',
          ),
        ),
      ),
      error: (error, stackTrace) => Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          body: Tasmee3ErrorState(
            message: 'تعذر تجهيز تجربة التسميع. حاول مرة أخرى.',
            onRetry: () {
              ref.invalidate(tasmee3HasSeenOnboardingProvider);
            },
          ),
        ),
      ),
      data: (seen) {
        if (seen) {
          return const Tasmee3DashboardScreen();
        }

        return const Tasmee3OnboardingScreen();
      },
    );
  }
}
