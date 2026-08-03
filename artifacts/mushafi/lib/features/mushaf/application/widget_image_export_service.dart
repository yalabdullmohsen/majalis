import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';

class WidgetImageExportService {
  const WidgetImageExportService();

  Future<File> exportPng({
    required RenderRepaintBoundary boundary,
    double pixelRatio = 3.0,
  }) async {
    final image = await boundary.toImage(pixelRatio: pixelRatio);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

    if (byteData == null) {
      throw StateError('تعذر إنشاء صورة الآية.');
    }

    final bytes = byteData.buffer.asUint8List();
    final dir = await getTemporaryDirectory();

    final file = File(
      '${dir.path}/mushafi_ayah_${DateTime.now().millisecondsSinceEpoch}.png',
    );

    await file.writeAsBytes(bytes);

    return file;
  }
}
