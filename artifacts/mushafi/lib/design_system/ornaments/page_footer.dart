import 'package:flutter/material.dart';
import 'package:mushafi/core/utils/arabic_numbers.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/design_system/typography.dart';

class PageFooter extends StatelessWidget {
  const PageFooter({
    super.key,
    required this.pageNumber,
    required this.colors,
    this.hizbLabel,
    this.digitStyle = DigitStyle.easternArabic,
  });

  final int pageNumber;
  final MushafiColors colors;
  final String? hizbLabel;
  final DigitStyle digitStyle;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Row(
          children: [
            Expanded(
              child: Text(
                hizbLabel ?? '',
                style: MushafiTypography.meta(colors),
                textAlign: TextAlign.right,
              ),
            ),
            CustomPaint(
              painter: _OvalFramePainter(colors: colors),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                child: Text(
                  ArabicNumbers.pageLabel(pageNumber, style: digitStyle),
                  style: TextStyle(
                    fontFamily: 'MushafiUi',
                    fontSize: 14,
                    color: colors.ornament,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const Expanded(child: SizedBox()),
          ],
        ),
      ),
    );
  }
}

class _OvalFramePainter extends CustomPainter {
  _OvalFramePainter({required this.colors});
  final MushafiColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final r = RRect.fromRectAndRadius(rect.deflate(0.5), const Radius.circular(20));
    canvas.drawRRect(
      r,
      Paint()
        ..color = colors.ornamentSoft.withValues(alpha: 0.2)
        ..style = PaintingStyle.fill,
    );
    canvas.drawRRect(
      r,
      Paint()
        ..color = colors.ornament
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2,
    );
    canvas.drawRRect(
      r.deflate(3),
      Paint()
        ..color = colors.ornament.withValues(alpha: 0.55)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.8,
    );
  }

  @override
  bool shouldRepaint(covariant _OvalFramePainter oldDelegate) =>
      oldDelegate.colors != colors;
}
