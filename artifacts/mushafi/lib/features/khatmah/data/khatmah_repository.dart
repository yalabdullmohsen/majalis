import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mushafi/features/khatmah/domain/khatmah_models.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

class KhatmahRepository {
  KhatmahRepository(this._prefs);
  final SharedPreferences _prefs;
  static const _key = 'khatmah_v1';
  final _uuid = const Uuid();

  List<KhatmahPlan> list({bool includeArchived = false}) {
    final raw = _prefs.getString(_key);
    if (raw == null) return const [];
    final items = (jsonDecode(raw) as List).map((e) {
      final m = e as Map<String, dynamic>;
      return KhatmahPlan(
        id: m['id'] as String,
        title: m['title'] as String,
        dailyGoal: m['dailyGoal'] as int,
        unit: KhatmahGoalUnit.values.byName(m['unit'] as String),
        startDate: DateTime.parse(m['startDate'] as String),
        expectedEnd: DateTime.parse(m['expectedEnd'] as String),
        completedUnits: m['completedUnits'] as int,
        totalUnits: m['totalUnits'] as int,
        streak: m['streak'] as int,
        missedDays: m['missedDays'] as int,
        lastPage: m['lastPage'] as int,
        archived: m['archived'] as bool? ?? false,
      );
    }).toList();
    if (includeArchived) return items;
    return items.where((e) => !e.archived).toList();
  }

  Future<void> _save(List<KhatmahPlan> items) async {
    await _prefs.setString(
      _key,
      jsonEncode(items.map((p) => {
            'id': p.id,
            'title': p.title,
            'dailyGoal': p.dailyGoal,
            'unit': p.unit.name,
            'startDate': p.startDate.toIso8601String(),
            'expectedEnd': p.expectedEnd.toIso8601String(),
            'completedUnits': p.completedUnits,
            'totalUnits': p.totalUnits,
            'streak': p.streak,
            'missedDays': p.missedDays,
            'lastPage': p.lastPage,
            'archived': p.archived,
          }).toList()),
    );
  }

  Future<KhatmahPlan> create({
    String title = 'ختمة جديدة',
    int dailyGoal = 4,
    KhatmahGoalUnit unit = KhatmahGoalUnit.pages,
    int totalUnits = 604,
  }) async {
    final start = DateTime.now();
    final plan = KhatmahPlan(
      id: _uuid.v4(),
      title: title,
      dailyGoal: dailyGoal,
      unit: unit,
      startDate: start,
      expectedEnd: KhatmahProgressCalculator.expectedEnd(
        start: start,
        total: totalUnits,
        dailyGoal: dailyGoal,
      ),
      completedUnits: 0,
      totalUnits: totalUnits,
      streak: 0,
      missedDays: 0,
      lastPage: 1,
      archived: false,
    );
    final all = list(includeArchived: true)..insert(0, plan);
    await _save(all);
    return plan;
  }

  Future<KhatmahPlan?> addProgress(String id, int units, {int? lastPage}) async {
    final all = list(includeArchived: true);
    final i = all.indexWhere((e) => e.id == id);
    if (i < 0) return null;
    final p = all[i];
    final updated = p.copyWith(
      completedUnits: (p.completedUnits + units).clamp(0, p.totalUnits),
      streak: p.streak + 1,
      lastPage: lastPage ?? p.lastPage,
    );
    all[i] = updated;
    await _save(all);
    return updated;
  }
}

final khatmahRepositoryProvider = Provider<KhatmahRepository>((ref) {
  return KhatmahRepository(ref.watch(sharedPreferencesProvider));
});
