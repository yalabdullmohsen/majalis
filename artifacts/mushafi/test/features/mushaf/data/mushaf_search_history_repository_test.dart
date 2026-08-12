import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/data/shared_prefs_mushaf_search_history_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('SharedPrefsMushafSearchHistoryRepository', () {
    test('adds and loads history', () async {
      SharedPreferences.setMockInitialValues({});

      final repository = SharedPrefsMushafSearchHistoryRepository();

      await repository.add('الله');
      final items = await repository.load();

      expect(items.length, 1);
      expect(items.first.query, 'الله');
    });

    test('clears history', () async {
      SharedPreferences.setMockInitialValues({});

      final repository = SharedPrefsMushafSearchHistoryRepository();

      await repository.add('الرحمن');
      await repository.clear();

      final items = await repository.load();

      expect(items, isEmpty);
    });
  });
}
