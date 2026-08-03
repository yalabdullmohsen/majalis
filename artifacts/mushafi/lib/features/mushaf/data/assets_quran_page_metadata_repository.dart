import 'dart:convert';

import 'package:flutter/services.dart';

import '../domain/quran_page_metadata.dart';
import 'quran_page_metadata_repository.dart';

class AssetsQuranPageMetadataRepository
    implements QuranPageMetadataRepository {
  static const String assetPath = 'assets/quran/quran_page_metadata.json';

  List<QuranPageMetadata>? _cache;

  @override
  Future<List<QuranPageMetadata>> loadAll() async {
    final cached = _cache;

    if (cached != null) {
      return cached;
    }

    final raw = await rootBundle.loadString(assetPath);
    final decoded = jsonDecode(raw) as List<dynamic>;

    final pages = decoded
        .map(
          (item) => QuranPageMetadata.fromJson(
            item as Map<String, dynamic>,
          ),
        )
        .toList();

    pages.sort((a, b) => a.pageNumber.compareTo(b.pageNumber));

    _cache = pages;
    return pages;
  }

  @override
  Future<QuranPageMetadata?> findPageForAyah({
    required int surah,
    required int ayah,
  }) async {
    final pages = await loadAll();

    for (final page in pages) {
      if (page.containsAyah(surah: surah, ayah: ayah)) {
        return page;
      }
    }

    return null;
  }

  @override
  Future<QuranPageMetadata?> findPageByNumber(int pageNumber) async {
    final pages = await loadAll();

    for (final page in pages) {
      if (page.pageNumber == pageNumber) {
        return page;
      }
    }

    return null;
  }
}
