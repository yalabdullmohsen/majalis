import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:mushafi/core/constants/app_constants.dart';
import 'package:mushafi/core/utils/arabic_normalizer.dart';
import 'package:mushafi/features/quran/data/quran_integrity.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/domain/entities/quran_page.dart';
import 'package:mushafi/features/quran/domain/entities/surah.dart';
import 'package:mushafi/features/quran/domain/repositories/quran_repository.dart';

class LocalQuranRepository implements QuranRepository {
  LocalQuranRepository();

  final _checker = QuranIntegrityChecker();
  final List<Surah> _surahs = [];
  final List<Ayah> _ayahs = [];
  final Map<int, List<Ayah>> _byPage = {};
  IntegrityReport _report = const IntegrityReport(
    ok: false,
    surahCount: 0,
    ayahCount: 0,
    issues: ['لم يُحمَّل بعد'],
    isMock: true,
  );
  bool _mock = true;
  bool _ready = false;

  @override
  bool get isCompleteMushaf => !_mock && _report.ok;

  @override
  bool get isMockSample => _mock;

  @override
  int get pageCount {
    if (_byPage.isEmpty) return 0;
    return _byPage.keys.reduce((a, b) => a > b ? a : b);
  }

  @override
  List<Surah> get surahs => List.unmodifiable(_surahs);

  @override
  IntegrityReport get lastIntegrityReport => _report;

  @override
  Future<void> initialize() async {
    if (_ready) return;
    final raw = await rootBundle.loadString(AppConstants.quranAssetPath);
    final json = jsonDecode(raw) as Map<String, dynamic>;
    _mock = json['isMock'] == true || json['isComplete'] != true;

    _surahs
      ..clear()
      ..addAll(
        (json['surahs'] as List).map((e) {
          final m = e as Map<String, dynamic>;
          return Surah(
            id: m['id'] as int,
            nameArabic: m['nameArabic'] as String,
            nameTransliteration: m['nameTransliteration'] as String? ?? '',
            revelationType: m['revelationType'] as String? ?? 'Meccan',
            ayahCount: m['ayahCount'] as int,
            startPage: m['startPage'] as int,
            startJuz: m['startJuz'] as int,
            bismillahPre: m['bismillahPre'] as bool? ?? true,
          );
        }),
      );

    _ayahs
      ..clear()
      ..addAll(
        (json['ayahs'] as List).map((e) {
          final m = e as Map<String, dynamic>;
          final uthmani = m['textUthmani'] as String;
          final plain = m['textPlain'] as String? ??
              ArabicNormalizer.removeTashkeel(uthmani);
          final words = ArabicNormalizer.tokenizeWords(uthmani)
              .asMap()
              .entries
              .map((e) => AyahWord(index: e.key, text: e.value))
              .toList();
          return Ayah(
            surahId: m['surahId'] as int,
            ayahNumber: m['ayahNumber'] as int,
            globalAyahNumber: m['globalAyahNumber'] as int,
            pageNumber: m['pageNumber'] as int,
            juzNumber: m['juzNumber'] as int,
            hizbQuarter: m['hizbQuarter'] as int,
            textUthmani: uthmani,
            textPlain: plain,
            words: words,
            sajdahType: m['sajdahType'] as String?,
          );
        }),
      );

    _byPage
      ..clear()
      ..addEntries(
        _ayahs.fold<Map<int, List<Ayah>>>({}, (map, a) {
          map.putIfAbsent(a.pageNumber, () => []).add(a);
          return map;
        }).entries,
      );

    _report = _checker.check(surahs: _surahs, ayahs: _ayahs, isMock: _mock);
    _ready = true;
  }

  Surah _surah(int id) => _surahs.firstWhere((s) => s.id == id);

  @override
  Future<QuranPage> getPage(int pageNumber) async {
    await initialize();
    final ayahs = List<Ayah>.from(_byPage[pageNumber] ?? const []);
    if (ayahs.isEmpty) {
      return QuranPage(
        pageNumber: pageNumber,
        juzNumber: 1,
        surahHeaders: const [],
        ayahs: const [],
      );
    }

    final headers = <SurahHeaderOnPage>[];
    for (final a in ayahs) {
      if (a.ayahNumber == 1) {
        final s = _surah(a.surahId);
        headers.add(
          SurahHeaderOnPage(
            surah: s,
            showBismillah: s.bismillahPre && s.id != 1,
          ),
        );
      }
    }

    final hizb = ((ayahs.first.hizbQuarter - 1) ~/ 4) + 1;
    final primary = _surah(ayahs.first.surahId).nameArabic;

    return QuranPage(
      pageNumber: pageNumber,
      juzNumber: ayahs.first.juzNumber,
      surahHeaders: headers,
      ayahs: ayahs,
      primarySurahName: primary,
      footerMarkers: PageFooterMarkers(
        hizbNumber: hizb,
        halfHizbLabel: 'نصف الحزب $hizb',
      ),
    );
  }

  @override
  Future<Ayah?> getAyah(int surahId, int ayahNumber) async {
    await initialize();
    try {
      return _ayahs.firstWhere(
        (a) => a.surahId == surahId && a.ayahNumber == ayahNumber,
      );
    } catch (_) {
      return null;
    }
  }

  @override
  Future<List<Ayah>> search(String query, {int limit = 50}) async {
    await initialize();
    final q = ArabicNormalizer.forSearch(query);
    if (q.isEmpty) return const [];
    final hits = <Ayah>[];
    for (final a in _ayahs) {
      if (ArabicNormalizer.forSearch(a.textUthmani).contains(q) ||
          ArabicNormalizer.forSearch(a.textPlain).contains(q)) {
        hits.add(a);
        if (hits.length >= limit) break;
      }
    }
    return hits;
  }

  @override
  Future<int> pageForSurahAyah(int surahId, int ayahNumber) async {
    final a = await getAyah(surahId, ayahNumber);
    return a?.pageNumber ?? 1;
  }
}
