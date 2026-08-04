import 'dart:convert';
import 'dart:io';

void main() {
  final file = File('assets/quran/quran_uthmani.json');

  if (!file.existsSync()) {
    stderr.writeln('quran_uthmani.json not found.');
    exit(1);
  }

  final raw = file.readAsStringSync();
  final decoded = jsonDecode(raw);

  if (decoded is! List) {
    stderr.writeln('Quran JSON must be a list.');
    exit(1);
  }

  final ayahs = decoded.cast<Map<String, dynamic>>();

  final surahs = ayahs.map((item) => item['surah']).toSet();

  if (surahs.length != 114) {
    stderr.writeln('Invalid surah count: ${surahs.length}');
    exit(1);
  }

  if (ayahs.length != 6236) {
    stderr.writeln('Invalid ayah count: ${ayahs.length}');
    exit(1);
  }

  for (final item in ayahs) {
    if (!item.containsKey('surah') ||
        !item.containsKey('ayah') ||
        !item.containsKey('textUthmani')) {
      stderr.writeln('Missing keys in item: $item');
      exit(1);
    }

    final text = '${item['textUthmani']}'.trim();

    if (text.isEmpty) {
      stderr.writeln('Empty ayah: surah=${item['surah']} ayah=${item['ayah']}');
      exit(1);
    }
  }

  final metadataFile = File('assets/quran/quran_page_metadata.json');

  if (metadataFile.existsSync()) {
    final rawMetadata = metadataFile.readAsStringSync();
    final decodedMetadata = jsonDecode(rawMetadata);

    if (decodedMetadata is! List) {
      stderr.writeln('quran_page_metadata.json must be a list.');
      exit(1);
    }

    if (decodedMetadata.length != 604) {
      stderr.writeln(
        'quran_page_metadata.json has ${decodedMetadata.length} pages, expected 604.',
      );
      exit(1);
    }

    for (final item in decodedMetadata) {
      if (item is! Map) {
        stderr.writeln('Invalid metadata entry: $item');
        exit(1);
      }

      final map = Map<String, dynamic>.from(item);
      const keys = [
        'pageNumber',
        'juz',
        'hizb',
        'rub',
        'fromSurah',
        'fromAyah',
        'toSurah',
        'toAyah',
      ];

      for (final key in keys) {
        if (!map.containsKey(key)) {
          stderr.writeln('Missing metadata key $key in item: $item');
          exit(1);
        }
      }
    }
  }

  stdout.writeln('Quran asset integrity check passed.');
}
