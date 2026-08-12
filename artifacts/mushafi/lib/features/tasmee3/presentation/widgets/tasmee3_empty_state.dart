import 'package:flutter/material.dart';

import '../tasmee3_design_tokens.dart';

class Tasmee3EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const Tasmee3EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Tasmee3Spacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 54,
              color: Tasmee3Colors.primary,
            ),
            const SizedBox(height: Tasmee3Spacing.lg),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Tasmee3TextStyles.sectionTitle,
            ),
            const SizedBox(height: Tasmee3Spacing.sm),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Tasmee3TextStyles.secondary,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: Tasmee3Spacing.lg),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Tasmee3Colors.primary,
                  foregroundColor: Colors.white,
                ),
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
