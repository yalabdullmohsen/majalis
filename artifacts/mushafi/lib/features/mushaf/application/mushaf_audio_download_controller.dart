import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/domain/quran_ayah.dart';
import '../data/reciters_catalog.dart';
import '../domain/mushaf_audio_download.dart';
import 'mushaf_audio_download_service.dart';

class MushafAudioDownloadState {
  final bool isDownloading;
  final int completed;
  final int total;
  final String? errorMessage;

  const MushafAudioDownloadState({
    this.isDownloading = false,
    this.completed = 0,
    this.total = 0,
    this.errorMessage,
  });

  double get progress {
    if (total <= 0) return 0;
    return (completed / total).clamp(0, 1).toDouble();
  }

  MushafAudioDownloadState copyWith({
    bool? isDownloading,
    int? completed,
    int? total,
    String? errorMessage,
  }) {
    return MushafAudioDownloadState(
      isDownloading: isDownloading ?? this.isDownloading,
      completed: completed ?? this.completed,
      total: total ?? this.total,
      errorMessage: errorMessage,
    );
  }
}

class MushafAudioDownloadController
    extends StateNotifier<MushafAudioDownloadState> {
  final MushafAudioDownloadService service;

  MushafAudioDownloadController({
    required this.service,
  }) : super(const MushafAudioDownloadState());

  Future<List<MushafAudioDownload>> downloadAyahs({
    required String reciterId,
    required List<QuranAyah> ayahs,
  }) async {
    state = MushafAudioDownloadState(
      isDownloading: true,
      completed: 0,
      total: ayahs.length,
    );

    try {
      final reciter = RecitersCatalog.byId(reciterId);

      final result = await service.downloadRange(
        reciter: reciter,
        ayahs: ayahs,
        onProgress: (completed, total) {
          state = state.copyWith(
            completed: completed,
            total: total,
          );
        },
      );

      state = const MushafAudioDownloadState();

      return result;
    } catch (e) {
      final message = e is StateError ? e.message : e.toString();

      state = MushafAudioDownloadState(
        isDownloading: false,
        errorMessage: message,
      );

      rethrow;
    }
  }
}
