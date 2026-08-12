import 'package:flutter/material.dart';

class MushafColors {
  /// خلفية عامة أسطع قليلاً مع ورق قراءة واضح.
  static const background = Color(0xFFFDF9F1);
  /// سطح صفحة القراءة — أبيض ورقي ساطع.
  static const paper = Color(0xFFFFFDF7);
  static const surface = Color(0xFFFFFDF7);
  /// برونزي أغمق قليلاً لتباين أوضح مع النص الأبيض على الأزرار.
  static const primary = Color(0xFF8F6638);
  static const primaryDark = Color(0xFF6B4A28);
  static const text = Color(0xFF12110F);
  /// ثانوي أغمق ≥4.5:1 تقريباً على الورق الكريمي.
  static const mutedText = Color(0xFF6F5A45);
  static const border = Color(0xFFD9C0A0);
  static const success = Color(0xFF1F6B38);
  static const warning = Color(0xFFC45F00);
  static const danger = Color(0xFFB71C1C);
  static const nightBackground = Color(0xFF12100C);
  static const nightSurface = Color(0xFF1C1711);
  static const nightText = Color(0xFFF6ECDD);
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
