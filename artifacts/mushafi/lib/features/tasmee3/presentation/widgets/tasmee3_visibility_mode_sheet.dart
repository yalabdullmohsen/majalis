import 'package:flutter/material.dart';

import '../../domain/tasmee3_text_visibility_mode.dart';

class Tasmee3VisibilityModeSheet extends StatelessWidget {
  final Tasmee3TextVisibilityMode currentMode;
  final ValueChanged<Tasmee3TextVisibilityMode> onSelected;

  const Tasmee3VisibilityModeSheet({
    super.key,
    required this.currentMode,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'وضع عرض النص',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF11100E),
                ),
              ),
              const SizedBox(height: 12),
              ...Tasmee3TextVisibilityMode.values.map((mode) {
                final selected = mode == currentMode;

                return ListTile(
                  leading: Icon(
                    selected
                        ? Icons.radio_button_checked
                        : Icons.radio_button_off,
                    color: selected
                        ? const Color(0xFFA77A48)
                        : const Color(0xFF9A8068),
                  ),
                  title: Text(mode.arabicLabel),
                  onTap: () {
                    onSelected(mode);
                    Navigator.pop(context);
                  },
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}
