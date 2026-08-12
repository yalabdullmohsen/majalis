import 'package:equatable/equatable.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/domain/entities/surah.dart';

class SurahHeaderOnPage extends Equatable {
  const SurahHeaderOnPage({
    required this.surah,
    required this.showBismillah,
  });
  final Surah surah;
  final bool showBismillah;
  @override
  List<Object?> get props => [surah.id, showBismillah];
}

class PageFooterMarkers extends Equatable {
  const PageFooterMarkers({
    this.hizbNumber,
    this.halfHizbLabel,
  });
  final int? hizbNumber;
  final String? halfHizbLabel;
  @override
  List<Object?> get props => [hizbNumber, halfHizbLabel];
}

class QuranPage extends Equatable {
  const QuranPage({
    required this.pageNumber,
    required this.juzNumber,
    required this.surahHeaders,
    required this.ayahs,
    this.footerMarkers = const PageFooterMarkers(),
    this.primarySurahName = '',
  });

  final int pageNumber;
  final int juzNumber;
  final List<SurahHeaderOnPage> surahHeaders;
  final List<Ayah> ayahs;
  final PageFooterMarkers footerMarkers;
  final String primarySurahName;

  @override
  List<Object?> get props => [pageNumber, juzNumber, ayahs];
}
