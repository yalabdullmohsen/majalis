import 'package:flutter/material.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/design_system/typography.dart';

/// ترويسة سورة أصلية — زخرفة خطية ذهبية عبر CustomPainter (ليست أصولًا محمية).
class SurahHeader extends StatelessWidget {
  const SurahHeader({
    super.key,
    required this.surahName,
    required this.colors,
    this.showBismillah = false,
    this.bismillahText = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  });

  final String surahName;
  final MushafiColors colors;
  final bool showBismillah;
  final String bismillahText;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 52,
          child: CustomPaint(
            painter: _SurahBandPainter(colors: colors),
            child: Center(
              child: Text(
                'سُورَةُ $surahName',
                style: MushafiTypography.surahName(colors),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
        if (showBismillah) ...[
          const SizedBox(height: 10),
          Text(
            bismillahText,
            textAlign: TextAlign.center,
            style: MushafiTypography.bismillah(colors),
          ),
          const SizedBox(height: 8),
        ],
      ],
    );
  }
}

class _SurahBandPainter extends CustomPainter {
  _SurahBandPainter({required this.colors});
  final MushafiColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = colors.ornament
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final soft = Paint()
      ..color = colors.ornamentSoft.withValues(alpha: 0.2)
      ..style = PaintingStyle.fill;

    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(8, 6, size.width - 16, size.height - 12),
      const Radius.circular(6),
    );
    canvas.drawRRect(rect, soft);
    canvas.drawRRect(rect, stroke);

    final inner = RRect.fromRectAndRadius(
      Rect.fromLTWH(14, 11, size.width - 28, size.height - 22),
      const Radius.circular(4),
    );
    canvas.drawRRect(inner, stroke);

    // خطوط زخرفية جانبية أصلية
    final midY = size.height / 2;
    final left = Path()
      ..moveTo(22, midY)
      ..cubicTo(36, midY - 10, 48, midY + 10, 62, midY);
    final right = Path()
      ..moveTo(size.width - 22, midY)
      ..cubicTo(size.width - 36, midY - 10, size.width - 48, midY + 10, size.width - 62, midY);
    final decor = Paint()
      ..color = colors.ornament.withValues(alpha: 0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawPath(left, decor);
    canvas.drawPath(right, decor);
  }

  @override
  bool shouldRepaint(covariant _SurahBandPainter oldDelegate) =>
      oldDelegate.colors != colors;
}
