import 'package:flutter/material.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/domain/entities/quran_page.dart';

enum MushafReadingMode { pageMode, adaptiveMode, lineMode }

class AyahHit {
  const AyahHit({required this.ayah, required this.rect});
  final Ayah ayah;
  final Rect rect;
}

/// تجريد تخطيط المصحف — page / adaptive / line + hit-test.
class MushafLayoutEngine {
  MushafLayoutEngine({this.mode = MushafReadingMode.pageMode});

  MushafReadingMode mode;

  double fontSizeFor(MushafReadingMode m, double userScale) => switch (m) {
        MushafReadingMode.pageMode => 26 * userScale,
        MushafReadingMode.adaptiveMode => 28 * userScale,
        MushafReadingMode.lineMode => 30 * userScale,
      };

  double lineHeightFor(MushafReadingMode m) => switch (m) {
        MushafReadingMode.pageMode => 2.05,
        MushafReadingMode.adaptiveMode => 2.2,
        MushafReadingMode.lineMode => 2.35,
      };

  /// تقدير صناديق الآيات للضغط المطوّل (بدون بيانات مواضع خارجية).
  List<AyahHit> approximateAyahBoxes({
    required QuranPage page,
    required Size pageSize,
    required EdgeInsets padding,
  }) {
    if (page.ayahs.isEmpty) return const [];
    final contentH = pageSize.height - padding.vertical;
    final contentW = pageSize.width - padding.horizontal;
    final each = contentH / page.ayahs.length;
    final hits = <AyahHit>[];
    for (var i = 0; i < page.ayahs.length; i++) {
      hits.add(
        AyahHit(
          ayah: page.ayahs[i],
          rect: Rect.fromLTWH(
            padding.left,
            padding.top + i * each,
            contentW,
            each,
          ),
        ),
      );
    }
    return hits;
  }

  Ayah? wordHitTest(Offset local, List<AyahHit> boxes) {
    for (final h in boxes) {
      if (h.rect.contains(local)) return h.ayah;
    }
    return null;
  }
}
