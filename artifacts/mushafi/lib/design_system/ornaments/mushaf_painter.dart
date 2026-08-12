import 'package:flutter/material.dart';
import 'package:mushafi/design_system/colors.dart';

/// خلفية صفحة مصحف هادئة — حبيبات خفيفة بدون أصول خارجية.
class MushafPaperPainter extends CustomPainter {
  MushafPaperPainter({required this.colors});
  final MushafiColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = colors.paper,
    );
    final grain = Paint()
      ..color = colors.ornament.withValues(alpha: 0.015)
      ..strokeWidth = 1;
    for (var y = 0.0; y < size.height; y += 7) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y + 0.4), grain);
    }
  }

  @override
  bool shouldRepaint(covariant MushafPaperPainter oldDelegate) =>
      oldDelegate.colors != colors;
}
