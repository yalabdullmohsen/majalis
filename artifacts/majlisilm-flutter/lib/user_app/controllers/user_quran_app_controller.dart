import 'package:flutter/material.dart';

import '../../shared/constants/majlis_constants.dart';
import '../../shared/theme/majlis_colors.dart';
import '../services/user_local_storage_service.dart';

/// Provider ChangeNotifier — font, theme, selected verse, playing index.
class UserQuranAppController extends ChangeNotifier {
  UserQuranAppController({
    UserLocalStorageService? storage,
    bool hydrate = true,
  }) : _storage = storage ?? UserLocalStorageService.instance {
    if (hydrate) {
      _hydrate();
    }
  }

  final UserLocalStorageService _storage;

  double fontSize = MajlisConstants.fontDefault;
  bool isDarkMode = false;
  Color backgroundColor = MajlisColors.cream;
  int? selectedVerseIndex;
  bool isPlayingAudio = false;
  int? currentPlayingVerse;

  Color get textColor =>
      isDarkMode ? Colors.white.withValues(alpha: 0.87) : Colors.black87;

  Future<void> _hydrate() async {
    fontSize = await _storage.getFontSize();
    isDarkMode = await _storage.getDarkMode();
    backgroundColor = isDarkMode ? MajlisColors.darkBg : MajlisColors.cream;
    selectedVerseIndex = await _storage.getLastVerseIndex();
    notifyListeners();
  }

  Future<void> _persist() async {
    await _storage.saveFontSize(fontSize);
    await _storage.saveDarkMode(isDarkMode);
    if (selectedVerseIndex != null) {
      await _storage.saveLastVerseIndex(selectedVerseIndex!);
    }
  }

  void updateFontSize(double newSize) {
    final next = newSize.clamp(MajlisConstants.fontMin, MajlisConstants.fontMax);
    if (next == fontSize) return;
    fontSize = next;
    notifyListeners();
    _persist();
  }

  void toggleTheme(bool dark) {
    if (isDarkMode == dark) return;
    isDarkMode = dark;
    backgroundColor = dark ? MajlisColors.darkBg : MajlisColors.cream;
    notifyListeners();
    _persist();
  }

  void selectVerse(int index) {
    selectedVerseIndex = index;
    notifyListeners();
    _persist();
  }

  void toggleAudio(int index) {
    if (currentPlayingVerse == index && isPlayingAudio) {
      isPlayingAudio = false;
    } else {
      isPlayingAudio = true;
      currentPlayingVerse = index;
    }
    notifyListeners();
  }

  void stopAudio() {
    if (!isPlayingAudio) return;
    isPlayingAudio = false;
    notifyListeners();
  }
}
