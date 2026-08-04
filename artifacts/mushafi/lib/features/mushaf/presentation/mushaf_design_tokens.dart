import 'package:flutter/material.dart';

class MushafColors {
  /// خلفية عامة أصلية للمصحف (هوية مصحفي — ليست نسخًا لتطبيق خارجي).
  static const background = Color(0xFFFBF7EF);
  /// سطح صفحة القراءة.
  static const paper = Color(0xFFFFFCF3);
  static const surface = Color(0xFFFFFCF3);
  static const primary = Color(0xFFA77A48);
  static const primaryDark = Color(0xFF765332);
  static const text = Color(0xFF11100E);
  static const mutedText = Color(0xFF9A8068);
  static const border = Color(0xFFE0C5A3);
  static const success = Color(0xFF2E7D32);
  static const warning = Color(0xFFF57C00);
  static const danger = Color(0xFFC62828);
  static const nightBackground = Color(0xFF0F0C09);
  static const nightSurface = Color(0xFF17120D);
  static const nightText = Color(0xFFF4E9D8);
}

class MushafSpacing {
  static const xxs = 3.0;
  static const xs = 6.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 22.0;
  static const xxl = 28.0;
}

class MushafRadius {
  static const sm = 10.0;
  static const md = 14.0;
  static const lg = 20.0;
  static const xl = 26.0;
  static const pill = 999.0;
}

class MushafTextStyles {
  static const title = TextStyle(
    color: MushafColors.text,
    fontSize: 22,
    fontWeight: FontWeight.bold,
  );

  static const sectionTitle = TextStyle(
    color: MushafColors.text,
    fontSize: 18,
    fontWeight: FontWeight.bold,
  );

  static const body = TextStyle(
    color: MushafColors.text,
    fontSize: 15,
    height: 1.6,
  );

  static const secondary = TextStyle(
    color: MushafColors.mutedText,
    fontSize: 13.5,
    height: 1.5,
  );

  static const ayah = TextStyle(
    color: MushafColors.text,
    fontSize: 25,
    height: 1.9,
    fontWeight: FontWeight.w600,
  );
}
