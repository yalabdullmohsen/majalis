import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_pdf_font_loader.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_pdf_report_service.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/recitation_target.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_result.dart';
import 'package:path_provider_platform_interface/path_provider_platform_interface.dart';

class _FakePathProvider extends PathProviderPlatform {
  @override
  Future<String?> getTemporaryPath() async => Directory.systemTemp.path;

  @override
  Future<String?> getApplicationDocumentsPath() async =>
      Directory.systemTemp.path;

  @override
  Future<String?> getApplicationSupportPath() async =>
      Directory.systemTemp.path;

  @override
  Future<String?> getLibraryPath() async => Directory.systemTemp.path;

  @override
  Future<String?> getApplicationCachePath() async => Directory.systemTemp.path;

  @override
  Future<String?> getDownloadsPath() async => Directory.systemTemp.path;

  @override
  Future<String?> getExternalStoragePath() async => Directory.systemTemp.path;

  @override
  Future<List<String>?> getExternalCachePaths() async =>
      <String>[Directory.systemTemp.path];

  @override
  Future<List<String>?> getExternalStoragePaths({
    StorageDirectory? type,
  }) async =>
      <String>[Directory.systemTemp.path];
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    PathProviderPlatform.instance = _FakePathProvider();
  });

  group('Tasmee3PdfReportService', () {
    test('creates PDF file', () async {
      final service = Tasmee3PdfReportService(
        fontLoader: const Tasmee3PdfFontLoader(),
      );

      final file = await service.buildSessionPdf(
        target: const RecitationTarget(
          from: AyahRef(surah: 112, ayah: 1),
          to: AyahRef(surah: 112, ayah: 1),
          mode: Tasmee3Mode.hifzTest,
        ),
        result: const Tasmee3Result(
          expectedWords: ['قل', 'هو', 'الله', 'احد'],
          recognizedWords: ['قل', 'هو', 'الله', 'احد'],
          mistakes: [],
          accuracy: 1,
        ),
        durationSeconds: 10,
      );

      expect(await file.exists(), isTrue);
      expect(await file.length(), greaterThan(0));
    });
  });
}
