import '../../tasmee3/domain/recitation_target.dart';
import '../data/quran_page_metadata_repository.dart';
import '../domain/mushaf_page_range.dart';

typedef MushafPageNumberResolver = Future<int?> Function({
  required int surah,
  required int ayah,
});

class Tasmee3TargetPageRangeMapper {
  final QuranPageMetadataRepository metadataRepository;
  final MushafPageNumberResolver? pageNumberFallback;

  const Tasmee3TargetPageRangeMapper({
    required this.metadataRepository,
    this.pageNumberFallback,
  });

  Future<MushafPageRange?> mapTargetToPageRange(
    RecitationTarget target,
  ) async {
    final fromPageNumber = await _resolvePageNumber(
      surah: target.from.surah,
      ayah: target.from.ayah,
    );

    final toPageNumber = await _resolvePageNumber(
      surah: target.to.surah,
      ayah: target.to.ayah,
    );

    if (fromPageNumber == null || toPageNumber == null) {
      return null;
    }

    final start = fromPageNumber <= toPageNumber
        ? fromPageNumber
        : toPageNumber;

    final end = fromPageNumber <= toPageNumber
        ? toPageNumber
        : fromPageNumber;

    return MushafPageRange(
      fromPage: start,
      toPage: end,
    );
  }

  Future<int?> _resolvePageNumber({
    required int surah,
    required int ayah,
  }) async {
    final metadata = await metadataRepository.findPageForAyah(
      surah: surah,
      ayah: ayah,
    );

    if (metadata != null) {
      return metadata.pageNumber;
    }

    final fallback = pageNumberFallback;
    if (fallback == null) {
      return null;
    }

    return fallback(surah: surah, ayah: ayah);
  }
}
