import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import 'tasmee3_dashboard_screen.dart';
import 'tasmee3_design_tokens.dart';
import 'widgets/tasmee3_primary_button.dart';

class Tasmee3OnboardingScreen extends ConsumerStatefulWidget {
  const Tasmee3OnboardingScreen({super.key});

  @override
  ConsumerState<Tasmee3OnboardingScreen> createState() =>
      _Tasmee3OnboardingScreenState();
}

class _Tasmee3OnboardingScreenState
    extends ConsumerState<Tasmee3OnboardingScreen> {
  final PageController _controller = PageController();
  int _index = 0;

  final _pages = const [
    _OnboardingPageData(
      icon: Icons.menu_book_outlined,
      title: 'تسميع بهدوء',
      body:
          'اختر سورة ونطاق آيات، ثم ابدأ التسميع بصوت واضح وفي مكان هادئ.',
    ),
    _OnboardingPageData(
      icon: Icons.mic_none_outlined,
      title: 'خصوصية صوتك',
      body:
          'الميكروفون يعمل فقط عند بدء الجلسة. ولا يُرسل الصوت للخادم إلا إذا سمحت بذلك من الإعدادات.',
    ),
    _OnboardingPageData(
      icon: Icons.auto_awesome,
      title: 'مراجعة ذكية',
      body:
          'بعد كل جلسة، يقترح التطبيق مواضع مراجعة بناء على أخطائك الظاهرة ومستوى إتقانك.',
    ),
    _OnboardingPageData(
      icon: Icons.verified_outlined,
      title: 'تنبيه مهم',
      body:
          'نتائج التسميع مساعدة تقنية وليست حكما شرعيا على صحة التلاوة أو التجويد. الدقة تقريبية وتساعدك على المراجعة.',
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    final repository = ref.read(tasmee3OnboardingRepositoryProvider);
    await repository.markSeen();
    ref.invalidate(tasmee3HasSeenOnboardingProvider);

    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => const Tasmee3DashboardScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Tasmee3Colors.background,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(Tasmee3Spacing.lg),
            child: Column(
              children: [
                Expanded(
                  child: PageView.builder(
                    controller: _controller,
                    itemCount: _pages.length,
                    onPageChanged: (index) {
                      setState(() => _index = index);
                    },
                    itemBuilder: (context, index) {
                      final page = _pages[index];

                      return Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            page.icon,
                            size: 84,
                            color: Tasmee3Colors.primary,
                          ),
                          const SizedBox(height: Tasmee3Spacing.xxl),
                          Text(
                            page.title,
                            textAlign: TextAlign.center,
                            style: Tasmee3TextStyles.title,
                          ),
                          const SizedBox(height: Tasmee3Spacing.md),
                          Text(
                            page.body,
                            textAlign: TextAlign.center,
                            style: Tasmee3TextStyles.secondary.copyWith(
                              fontSize: 16,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_pages.length, (index) {
                    final selected = index == _index;

                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: selected ? 22 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: selected
                            ? Tasmee3Colors.primary
                            : Tasmee3Colors.border,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: Tasmee3Spacing.lg),
                Tasmee3PrimaryButton(
                  label: _index == _pages.length - 1 ? 'ابدأ' : 'التالي',
                  icon: _index == _pages.length - 1
                      ? Icons.check
                      : Icons.arrow_back,
                  onPressed: () async {
                    if (_index < _pages.length - 1) {
                      await _controller.nextPage(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOut,
                      );
                      return;
                    }

                    await _finish();
                  },
                ),
                TextButton(
                  onPressed: _finish,
                  child: const Text('تخطي'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OnboardingPageData {
  final IconData icon;
  final String title;
  final String body;

  const _OnboardingPageData({
    required this.icon,
    required this.title,
    required this.body,
  });
}
