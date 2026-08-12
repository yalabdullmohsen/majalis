import 'package:flutter/material.dart';

import '../tasmee3_design_tokens.dart';

class Tasmee3PrimaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;

  const Tasmee3PrimaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final style = ElevatedButton.styleFrom(
      backgroundColor: Tasmee3Colors.primary,
      foregroundColor: Colors.white,
      minimumSize: const Size.fromHeight(48),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Tasmee3Radius.md),
      ),
    );

    if (icon == null) {
      return ElevatedButton(
        style: style,
        onPressed: onPressed,
        child: Text(label),
      );
    }

    return ElevatedButton.icon(
      style: style,
      onPressed: onPressed,
      icon: Icon(icon),
      label: Text(label),
    );
  }
}
