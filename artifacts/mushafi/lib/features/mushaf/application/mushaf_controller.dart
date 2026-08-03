import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/domain/quran_ayah.dart';
import '../data/mushaf_local_repository.dart';
import '../domain/khatmah_progress.dart';
import '../domain/mushaf_bookmark.dart';
import '../domain/mushaf_favorite_ayah.dart';
import '../domain/mushaf_note.dart';
import '../domain/mushaf_reading_position.dart';

class MushafState {
  final int currentPage;
  final Set<String> selectedAyahKeys;
  final List<MushafBookmark> bookmarks;
  final List<MushafFavoriteAyah> favorites;
  final List<MushafNote> notes;
  final KhatmahProgress khatmahProgress;
  final bool selectionMode;
  final bool isLoading;
  final String? errorMessage;

  const MushafState({
    required this.currentPage,
    required this.selectedAyahKeys,
    required this.bookmarks,
    required this.favorites,
    required this.notes,
    required this.khatmahProgress,
    required this.selectionMode,
    this.isLoading = false,
    this.errorMessage,
  });

  factory MushafState.initial() {
    return MushafState(
      currentPage: 1,
      selectedAyahKeys: const {},
      bookmarks: const [],
      favorites: const [],
      notes: const [],
      khatmahProgress: KhatmahProgress.initial(),
      selectionMode: false,
    );
  }

  MushafState copyWith({
    int? currentPage,
    Set<String>? selectedAyahKeys,
    List<MushafBookmark>? bookmarks,
    List<MushafFavoriteAyah>? favorites,
    List<MushafNote>? notes,
    KhatmahProgress? khatmahProgress,
    bool? selectionMode,
    bool? isLoading,
    String? errorMessage,
  }) {
    return MushafState(
      currentPage: currentPage ?? this.currentPage,
      selectedAyahKeys: selectedAyahKeys ?? this.selectedAyahKeys,
      bookmarks: bookmarks ?? this.bookmarks,
      favorites: favorites ?? this.favorites,
      notes: notes ?? this.notes,
      khatmahProgress: khatmahProgress ?? this.khatmahProgress,
      selectionMode: selectionMode ?? this.selectionMode,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

class MushafController extends StateNotifier<MushafState> {
  final MushafLocalRepository repository;

  MushafController({
    required this.repository,
  }) : super(MushafState.initial());

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final last = await repository.getLastPosition();
      final bookmarks = await repository.getBookmarks();
      final favorites = await repository.getFavorites();
      final notes = await repository.getNotes();
      final khatmah = await repository.getKhatmahProgress();

      state = state.copyWith(
        isLoading: false,
        currentPage: last?.pageNumber ?? khatmah.lastPage,
        bookmarks: bookmarks,
        favorites: favorites,
        notes: notes,
        khatmahProgress: khatmah,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> updateReadingPosition({
    required int pageNumber,
    required QuranAyah? firstVisibleAyah,
  }) async {
    final previous = state.khatmahProgress;
    state = state.copyWith(currentPage: pageNumber);

    if (firstVisibleAyah != null) {
      await repository.saveLastPosition(
        MushafReadingPosition(
          pageNumber: pageNumber,
          surah: firstVisibleAyah.ref.surah,
          ayah: firstVisibleAyah.ref.ayah,
          updatedAt: DateTime.now(),
        ),
      );
    }

    final readPages =
        pageNumber > previous.pagesRead ? pageNumber : previous.pagesRead;

    final progress = previous.copyWith(
      lastPage: pageNumber,
      pagesRead: readPages,
      updatedAt: DateTime.now(),
    );

    await repository.saveKhatmahProgress(progress);

    state = state.copyWith(khatmahProgress: progress);
  }

  void startSelection(QuranAyah ayah) {
    state = state.copyWith(
      selectionMode: true,
      selectedAyahKeys: {ayah.ref.key},
    );
  }

  void toggleSelection(QuranAyah ayah) {
    final key = ayah.ref.key;
    final updated = {...state.selectedAyahKeys};

    if (updated.contains(key)) {
      updated.remove(key);
    } else {
      updated.add(key);
    }

    state = state.copyWith(
      selectedAyahKeys: updated,
      selectionMode: updated.isNotEmpty,
    );
  }

  void clearSelection() {
    state = state.copyWith(
      selectedAyahKeys: const {},
      selectionMode: false,
    );
  }

  Future<void> addBookmark({
    required int pageNumber,
    required QuranAyah ayah,
    required String colorHex,
  }) async {
    final bookmark = MushafBookmark(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      pageNumber: pageNumber,
      surah: ayah.ref.surah,
      ayah: ayah.ref.ayah,
      colorHex: colorHex,
      createdAt: DateTime.now(),
    );

    await repository.saveBookmark(bookmark);

    final bookmarks = await repository.getBookmarks();
    state = state.copyWith(bookmarks: bookmarks);
  }

  Future<void> removeBookmark(String id) async {
    await repository.removeBookmark(id);
    final bookmarks = await repository.getBookmarks();
    state = state.copyWith(bookmarks: bookmarks);
  }

  Future<void> toggleFavorite(QuranAyah ayah) async {
    final favorite = MushafFavoriteAyah(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      surah: ayah.ref.surah,
      ayah: ayah.ref.ayah,
      createdAt: DateTime.now(),
    );

    await repository.toggleFavorite(favorite);

    final favorites = await repository.getFavorites();
    state = state.copyWith(favorites: favorites);
  }

  bool isFavorite(QuranAyah ayah) {
    return state.favorites.any((item) => item.key == ayah.ref.key);
  }

  Future<void> saveNote({
    required QuranAyah ayah,
    required String text,
  }) async {
    final existing = state.notes.where((note) => note.key == ayah.ref.key);
    final now = DateTime.now();

    final note = existing.isEmpty
        ? MushafNote(
            id: now.microsecondsSinceEpoch.toString(),
            surah: ayah.ref.surah,
            ayah: ayah.ref.ayah,
            text: text,
            createdAt: now,
            updatedAt: now,
          )
        : MushafNote(
            id: existing.first.id,
            surah: ayah.ref.surah,
            ayah: ayah.ref.ayah,
            text: text,
            createdAt: existing.first.createdAt,
            updatedAt: now,
          );

    await repository.saveNote(note);

    final notes = await repository.getNotes();
    state = state.copyWith(notes: notes);
  }

  Future<void> removeNote(String id) async {
    await repository.removeNote(id);
    final notes = await repository.getNotes();
    state = state.copyWith(notes: notes);
  }

  Future<void> resetKhatmah() async {
    await repository.resetKhatmahProgress();
    final progress = KhatmahProgress.initial();
    state = state.copyWith(khatmahProgress: progress);
  }
}
