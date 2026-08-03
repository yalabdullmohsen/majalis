import 'package:flutter/material.dart';

class Tasmee3Colors {
  static const background = Color(0xFFFBF7EF);
  static const surface = Color(0xFFFFFCF7);
  static const primary = Color(0xFFA77A48);
  static const primaryDark = Color(0xFF7A5632);
  static const text = Color(0xFF11100E);
  static const secondaryText = Color(0xFF9A8068);
  static const border = Color(0xFFE0C5A3);
  static const success = Color(0xFF2E7D32);
  static const warning = Color(0xFFF57C00);
  static const danger = Color(0xFFC62828);
  static const info = Color(0xFF546E7A);
}

class Tasmee3Spacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
}

class Tasmee3Radius {
  static const sm = 10.0;
  static const md = 14.0;
  static const lg = 18.0;
  static const xl = 22.0;
  static const pill = 999.0;
}

class Tasmee3TextStyles {
  static const title = TextStyle(
    color: Tasmee3Colors.text,
    fontSize: 22,
    fontWeight: FontWeight.bold,
  );

  static const sectionTitle = TextStyle(
    color: Tasmee3Colors.text,
    fontSize: 18,
    fontWeight: FontWeight.bold,
  );

  static const body = TextStyle(
    color: Tasmee3Colors.text,
    fontSize: 15,
    height: 1.6,
  );

  static const secondary = TextStyle(
    color: Tasmee3Colors.secondaryText,
    fontSize: 14,
    height: 1.5,
  );

  static const arabicAyah = TextStyle(
    color: Tasmee3Colors.text,
    fontSize: 25,
    height: 1.9,
    fontWeight: FontWeight.w500,
  );
}
