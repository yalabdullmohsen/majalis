import 'package:flutter/material.dart';
import 'package:mushafi/design_system/colors.dart';

class AppIconButton extends StatelessWidget {
  const AppIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    required this.colors,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback onPressed;
  final MushafiColors colors;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final btn = IconButton(
      onPressed: onPressed,
      icon: Icon(icon, color: colors.ornament),
      splashRadius: 22,
    );
    return tooltip == null ? btn : Tooltip(message: tooltip!, child: btn);
  }
}
