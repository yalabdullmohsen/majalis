import 'package:flutter/material.dart';
import 'package:mushafi/design_system/colors.dart';

/// بطاقة للواجهات الثانوية فقط — لا تُستخدم داخل صفحة المصحف.
class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, required this.colors});
  final Widget child;
  final MushafiColors colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.paper,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.ornament.withValues(alpha: 0.2)),
      ),
      child: child,
    );
  }
}
