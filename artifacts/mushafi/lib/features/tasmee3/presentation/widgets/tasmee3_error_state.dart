import 'package:flutter/material.dart';

import '../tasmee3_design_tokens.dart';

class Tasmee3ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const Tasmee3ErrorState({
    super.key,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Tasmee3Spacing.xxl),
        child: Container(
          padding: const EdgeInsets.all(Tasmee3Spacing.lg),
          decoration: BoxDecoration(
            color: Tasmee3Colors.surface,
            borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
            border: Border.all(
              color: Tasmee3Colors.danger.withValues(alpha: 0.25),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline,
                color: Tasmee3Colors.danger,
                size: 44,
              ),
              const SizedBox(height: Tasmee3Spacing.md),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Tasmee3TextStyles.body,
              ),
              if (onRetry != null) ...[
                const SizedBox(height: Tasmee3Spacing.md),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Tasmee3Colors.primary,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('حاول مرة أخرى'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
