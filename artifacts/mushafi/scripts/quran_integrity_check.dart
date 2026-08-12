#!/usr/bin/env dart
// سكربت تحقق سلامة بيانات القرآن.
// التشغيل: dart run scripts/quran_integrity_check.dart

import 'dart:convert';
import 'dart:io';

const expectedSurahs = 114;
const expectedAyahs = 6236;

void main(List<String> args) {
  final path = args.isNotEmpty
      ? args.first
      : 'assets/data/quran_uthmani.json';
  final file = File(path);
  if (!file.existsSync()) {
    stderr.writeln('MISSING: $path');
    exit(2);
  }
  final json = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  final isMock = json['isMock'] == true || json['isComplete'] != true;
  final surahs = json['surahs'] as List? ?? [];
  final ayahs = json['ayahs'] as List? ?? [];
  final issues = <String>[];

  if (isMock) {
    issues.add('MOCK sample — not a complete mushaf');
  } else {
    if (surahs.length != expectedSurahs) {
      issues.add('surahs ${surahs.length} != $expectedSurahs');
    }
    if (ayahs.length != expectedAyahs) {
      issues.add('ayahs ${ayahs.length} != $expectedAyahs');
    }
  }

  for (final a in ayahs) {
    final m = a as Map<String, dynamic>;
    final text = (m['textUthmani'] as String? ?? '').trim();
    if (text.isEmpty) {
      issues.add('empty ayah ${m['surahId']}:${m['ayahNumber']}');
    }
    final page = m['pageNumber'] as int? ?? 0;
    final juz = m['juzNumber'] as int? ?? 0;
    final hq = m['hizbQuarter'] as int? ?? 0;
    if (page < 1) issues.add('bad page $page');
    if (juz < 1 || juz > 30) issues.add('bad juz $juz');
    if (hq < 1 || hq > 240) issues.add('bad hizbQuarter $hq');
  }

  for (final s in surahs) {
    final m = s as Map<String, dynamic>;
    final id = m['id'] as int;
    final bis = m['bismillahPre'] as bool? ?? true;
    if (id == 9 && bis) issues.add('tawbah must not have bismillahPre');
  }

  stdout.writeln('surahs=${surahs.length} ayahs=${ayahs.length} mock=$isMock');
  for (final i in issues) {
    stdout.writeln('ISSUE: $i');
  }
  final ok = isMock
      ? ayahs.isNotEmpty && surahs.isNotEmpty
      : issues.isEmpty;
  stdout.writeln(ok ? 'PASS' : 'FAIL');
  exit(ok ? 0 : 1);
}
