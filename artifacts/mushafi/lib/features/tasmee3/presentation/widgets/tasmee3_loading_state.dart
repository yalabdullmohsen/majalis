import 'package:flutter/material.dart';

import '../tasmee3_design_tokens.dart';

class Tasmee3LoadingState extends StatelessWidget {
  final String message;

  const Tasmee3LoadingState({
    super.key,
    this.message = 'جاري التحميل...',
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Tasmee3Spacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
              color: Tasmee3Colors.primary,
            ),
            const SizedBox(height: Tasmee3Spacing.lg),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Tasmee3TextStyles.secondary,
            ),
          ],
        ),
      ),
    );
  }
}
