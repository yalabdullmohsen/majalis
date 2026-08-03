import '../domain/mushaf_search_history_item.dart';

abstract class MushafSearchHistoryRepository {
  Future<List<MushafSearchHistoryItem>> load();

  Future<void> add(String query);

  Future<void> clear();
}
