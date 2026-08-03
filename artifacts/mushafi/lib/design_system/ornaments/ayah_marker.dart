import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:mushafi/core/utils/arabic_numbers.dart';
import 'package:mushafi/design_system/colors.dart';

class AyahMarker extends StatelessWidget {
  const AyahMarker({
    super.key,
    required this.number,
    required this.colors,
    this.size = 28,
    this.digitStyle = DigitStyle.easternArabic,
  });

  final int number;
  final MushafiColors colors;
  final double size;
  final DigitStyle digitStyle;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _AyahMarkerPainter(colors: colors),
      child: SizedBox(
        width: size,
        height: size,
        child: Center(
          child: Text(
            ArabicNumbers.format(number, style: digitStyle),
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'MushafiUi',
              fontSize: size * 0.36,
              color: colors.ornament,
              fontWeight: FontWeight.w600,
              height: 1,
            ),
          ),
        ),
      ),
    );
  }
}

class _AyahMarkerPainter extends CustomPainter {
  _AyahMarkerPainter({required this.colors});
  final MushafiColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2;
    final fill = Paint()
      ..color = colors.ornamentSoft.withValues(alpha: 0.22)
      ..style = PaintingStyle.fill;
    final stroke = Paint()
      ..color = colors.ornament
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.15;

    canvas.drawCircle(c, r - 1, fill);
    canvas.drawCircle(c, r - 1, stroke);
    canvas.drawCircle(c, r - 4.2, stroke);

    final star = Path();
    for (var i = 0; i < 8; i++) {
      final ang = (i / 8) * math.pi * 2 - math.pi / 2;
      final rr = i.isEven ? r - 2.2 : r - 6.2;
      final p = Offset(c.dx + rr * math.cos(ang), c.dy + rr * math.sin(ang));
      if (i == 0) {
        star.moveTo(p.dx, p.dy);
      } else {
        star.lineTo(p.dx, p.dy);
      }
    }
    star.close();
    canvas.drawPath(
      star,
      Paint()
        ..color = colors.ornament.withValues(alpha: 0.2)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.75,
    );
  }

  @override
  bool shouldRepaint(covariant _AyahMarkerPainter oldDelegate) =>
      oldDelegate.colors != colors;
}
