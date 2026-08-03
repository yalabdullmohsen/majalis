import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../domain/quran_ayah.dart';
import '../domain/recitation_target.dart';
import 'quran_repository.dart';

class AssetsQuranRepository implements QuranRepository {
  static const String assetPath = 'assets/quran/quran_uthmani.json';

  List<QuranAyah>? _cache;

  Future<List<QuranAyah>> _loadAll() async {
    if (_cache != null) {
      return _cache!;
    }

    try {
      final raw = await rootBundle.loadString(assetPath);
      final decoded = jsonDecode(raw) as List<dynamic>;

      final ayahs = decoded
          .map((item) => QuranAyah.fromJson(item as Map<String, dynamic>))
          .toList();

      _validate(ayahs);

      _cache = ayahs;
      return ayahs;
    } on FlutterError {
      throw StateError(
        'ملف القرآن غير موجود. أضف quran_uthmani.json في assets/quran',
      );
    } on FormatException {
      throw StateError(
        'صيغة ملف القرآن غير صحيحة. يجب أن يكون JSON صالحا.',
      );
    }
  }

  @override
  Future<List<QuranAyah>> getAyahsInTarget(RecitationTarget target) async {
    if (!target.isValid) {
      throw StateError('نطاق التسميع غير صحيح.');
    }

    final all = await _loadAll();

    return all.where((ayah) => target.contains(ayah.ref)).toList();
  }

  void _validate(List<QuranAyah> ayahs) {
    if (ayahs.isEmpty) {
      throw StateError('ملف القرآن فارغ.');
    }

    final emptyAyahs = ayahs.where((a) => a.textUthmani.trim().isEmpty).toList();
    if (emptyAyahs.isNotEmpty) {
      throw StateError('يوجد آيات فارغة في ملف القرآن.');
    }

    final surahs = ayahs.map((a) => a.ref.surah).toSet();

    if (surahs.length != 114) {
      throw StateError(
        'عدد السور غير صحيح. الموجود: ${surahs.length}. المتوقع: 114',
      );
    }

    if (ayahs.length != 6236) {
      throw StateError(
        'عدد الآيات غير صحيح. الموجود: ${ayahs.length}. المتوقع: 6236',
      );
    }
  }
}
