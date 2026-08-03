import '../domain/ayah_mastery_level.dart';
import '../domain/ayah_mastery_record.dart';
import '../domain/ayah_ref.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_mistake.dart';
import '../domain/tasmee3_result.dart';
import '../domain/tasmee3_review_plan_item.dart';
import '../domain/tasmee3_review_suggestion.dart';

class Tasmee3SrsService {
  const Tasmee3SrsService();

  List<AyahMasteryRecord> updateMasteryFromSession({
    required List<AyahMasteryRecord> currentRecords,
    required RecitationTarget target,
    required Tasmee3Result result,
  }) {
    final currentMap = {
      for (final record in currentRecords) record.ayahRef.key: record,
    };

    final targetAyahs = _expandTarget(target);

    final mistakesByAyah = <String, int>{};

    for (final mistake in result.mistakes) {
      final isRealMistake = mistake.type == Tasmee3MistakeType.missingWord ||
          mistake.type == Tasmee3MistakeType.extraWord ||
          mistake.type == Tasmee3MistakeType.wrongWord;

      if (!isRealMistake) {
        continue;
      }

      final key = mistake.ayahRef.key;
      mistakesByAyah[key] = (mistakesByAyah[key] ?? 0) + 1;
    }

    final updated = <AyahMasteryRecord>[];

    for (final ref in targetAyahs) {
      final old = currentMap[ref.key] ?? AyahMasteryRecord.initial(ref);
      final mistakeCount = mistakesByAyah[ref.key] ?? 0;

      final success = mistakeCount == 0 && result.accuracyPercent >= 85;

      final newScore = _calculateNewScore(
        oldScore: old.masteryScore,
        sessionAccuracy: result.accuracy,
        mistakeCount: mistakeCount,
      );

      final consecutiveSuccesses =
          success ? old.consecutiveSuccesses + 1 : 0;

      final totalMistakes = old.mistakeCount + mistakeCount;
      final reviewCount = old.reviewCount + 1;

      final level = _levelFromScore(
        score: newScore,
        consecutiveSuccesses: consecutiveSuccesses,
        totalMistakes: totalMistakes,
      );

      final nextReviewAt = _nextReviewDate(
        level: level,
        consecutiveSuccesses: consecutiveSuccesses,
        hadMistakes: mistakeCount > 0,
      );

      updated.add(
        AyahMasteryRecord(
          ayahRef: ref,
          level: level,
          masteryScore: newScore,
          reviewCount: reviewCount,
          mistakeCount: totalMistakes,
          consecutiveSuccesses: consecutiveSuccesses,
          lastReviewedAt: DateTime.now(),
          nextReviewAt: nextReviewAt,
        ),
      );
    }

    return updated;
  }

  List<Tasmee3ReviewSuggestion> buildTodaySuggestions(
    List<AyahMasteryRecord> records,
  ) {
    final due = records.where((record) => record.isDue).toList();

    due.sort((a, b) {
      final aWeight = _priorityWeight(a);
      final bWeight = _priorityWeight(b);
      return bWeight.compareTo(aWeight);
    });

    final top = due.take(10).toList();

    if (top.isEmpty) {
      return const [];
    }

    final grouped = _groupConsecutive(top);

    return grouped.map((group) {
      final dominantLevel = _dominantLevel(group);

      return Tasmee3ReviewSuggestion(
        ayahs: group.map((record) => record.ayahRef).toList(),
        title: _titleForLevel(dominantLevel),
        reason: _reasonForLevel(dominantLevel),
        dominantLevel: dominantLevel,
        estimatedMinutes: _estimateMinutes(group.length),
      );
    }).toList();
  }

  Tasmee3ReviewSuggestion? suggestNextRange(
    List<AyahMasteryRecord> records,
  ) {
    final suggestions = buildTodaySuggestions(records);

    if (suggestions.isNotEmpty) {
      return suggestions.first;
    }

    final weakRecords = records.where((record) {
      return record.level == AyahMasteryLevel.weak ||
          record.level == AyahMasteryLevel.learning;
    }).toList();

    weakRecords.sort((a, b) => a.masteryScore.compareTo(b.masteryScore));

    if (weakRecords.isEmpty) {
      return null;
    }

    final selected = weakRecords.take(3).toList();

    return Tasmee3ReviewSuggestion(
      ayahs: selected.map((record) => record.ayahRef).toList(),
      title: 'مراجعة تثبيت',
      reason: 'هذه آيات تحتاج تثبيتا إضافيا بناء على جلساتك السابقة.',
      dominantLevel: selected.first.level,
      estimatedMinutes: _estimateMinutes(selected.length),
    );
  }

  /// خطة مراجعة مبنية على SRS (بدل الاعتماد على أخطاء الجلسات فقط).
  List<Tasmee3ReviewPlanItem> buildReviewPlanFromMastery(
    List<AyahMasteryRecord> records,
  ) {
    final candidates = records.where((record) {
      return record.isDue ||
          record.level == AyahMasteryLevel.weak ||
          record.level == AyahMasteryLevel.learning ||
          record.level == AyahMasteryLevel.newAyah;
    }).toList();

    candidates.sort((a, b) {
      return _priorityWeight(b).compareTo(_priorityWeight(a));
    });

    final now = DateTime.now();

    return candidates.take(20).map((record) {
      final ReviewPriority priority;

      switch (record.level) {
        case AyahMasteryLevel.weak:
          priority = ReviewPriority.high;
          break;
        case AyahMasteryLevel.learning:
        case AyahMasteryLevel.newAyah:
          priority = ReviewPriority.medium;
          break;
        case AyahMasteryLevel.good:
        case AyahMasteryLevel.mastered:
          priority = ReviewPriority.low;
          break;
      }

      final int repeats;

      switch (priority) {
        case ReviewPriority.high:
          repeats = 5;
          break;
        case ReviewPriority.medium:
          repeats = 3;
          break;
        case ReviewPriority.low:
          repeats = 2;
          break;
      }

      return Tasmee3ReviewPlanItem(
        ayahRef: record.ayahRef,
        priority: priority,
        reason:
            '${record.level.arabicLabel} — إتقان ${record.masteryPercent}% — ${record.isDue ? 'مستحقة الآن' : 'تحتاج متابعة'}',
        recommendedRepeats: repeats,
        createdAt: now,
      );
    }).toList();
  }

  List<AyahRef> _expandTarget(RecitationTarget target) {
    if (target.from.surah != target.to.surah) {
      return [target.from];
    }

    return List.generate(
      target.to.ayah - target.from.ayah + 1,
      (index) => AyahRef(
        surah: target.from.surah,
        ayah: target.from.ayah + index,
      ),
    );
  }

  double _calculateNewScore({
    required double oldScore,
    required double sessionAccuracy,
    required int mistakeCount,
  }) {
    final mistakePenalty = (mistakeCount * 0.08).clamp(0, 0.35).toDouble();

    final sessionScore = (sessionAccuracy - mistakePenalty).clamp(0, 1);

    final score = (oldScore * 0.65) + (sessionScore * 0.35);

    return score.clamp(0, 1).toDouble();
  }

  AyahMasteryLevel _levelFromScore({
    required double score,
    required int consecutiveSuccesses,
    required int totalMistakes,
  }) {
    if (score >= 0.92 && consecutiveSuccesses >= 3) {
      return AyahMasteryLevel.mastered;
    }

    if (score >= 0.8 && consecutiveSuccesses >= 2) {
      return AyahMasteryLevel.good;
    }

    if (score >= 0.6) {
      return AyahMasteryLevel.learning;
    }

    if (totalMistakes > 0 || score < 0.6) {
      return AyahMasteryLevel.weak;
    }

    return AyahMasteryLevel.newAyah;
  }

  DateTime _nextReviewDate({
    required AyahMasteryLevel level,
    required int consecutiveSuccesses,
    required bool hadMistakes,
  }) {
    final now = DateTime.now();

    if (hadMistakes) {
      return now.add(const Duration(days: 1));
    }

    switch (level) {
      case AyahMasteryLevel.newAyah:
        return now.add(const Duration(days: 1));
      case AyahMasteryLevel.weak:
        return now.add(const Duration(days: 1));
      case AyahMasteryLevel.learning:
        return now.add(const Duration(days: 2));
      case AyahMasteryLevel.good:
        return now.add(Duration(days: 3 + consecutiveSuccesses));
      case AyahMasteryLevel.mastered:
        return now.add(Duration(days: 7 + consecutiveSuccesses * 2));
    }
  }

  int _priorityWeight(AyahMasteryRecord record) {
    int weight = 0;

    switch (record.level) {
      case AyahMasteryLevel.weak:
        weight += 50;
        break;
      case AyahMasteryLevel.learning:
        weight += 35;
        break;
      case AyahMasteryLevel.newAyah:
        weight += 25;
        break;
      case AyahMasteryLevel.good:
        weight += 15;
        break;
      case AyahMasteryLevel.mastered:
        weight += 5;
        break;
    }

    weight += record.mistakeCount;
    weight += (100 - record.masteryPercent).clamp(0, 100);

    return weight;
  }

  List<List<AyahMasteryRecord>> _groupConsecutive(
    List<AyahMasteryRecord> records,
  ) {
    if (records.isEmpty) {
      return const [];
    }

    final sorted = [...records];

    sorted.sort((a, b) {
      final surahCompare = a.ayahRef.surah.compareTo(b.ayahRef.surah);

      if (surahCompare != 0) {
        return surahCompare;
      }

      return a.ayahRef.ayah.compareTo(b.ayahRef.ayah);
    });

    final groups = <List<AyahMasteryRecord>>[];
    var current = <AyahMasteryRecord>[sorted.first];

    for (int i = 1; i < sorted.length; i++) {
      final prev = current.last;
      final item = sorted[i];

      final consecutive = prev.ayahRef.surah == item.ayahRef.surah &&
          item.ayahRef.ayah == prev.ayahRef.ayah + 1;

      if (consecutive && current.length < 5) {
        current.add(item);
      } else {
        groups.add(current);
        current = [item];
      }
    }

    groups.add(current);
    return groups;
  }

  AyahMasteryLevel _dominantLevel(List<AyahMasteryRecord> records) {
    if (records.any((record) => record.level == AyahMasteryLevel.weak)) {
      return AyahMasteryLevel.weak;
    }

    if (records.any((record) => record.level == AyahMasteryLevel.learning)) {
      return AyahMasteryLevel.learning;
    }

    if (records.any((record) => record.level == AyahMasteryLevel.newAyah)) {
      return AyahMasteryLevel.newAyah;
    }

    if (records.any((record) => record.level == AyahMasteryLevel.good)) {
      return AyahMasteryLevel.good;
    }

    return AyahMasteryLevel.mastered;
  }

  String _titleForLevel(AyahMasteryLevel level) {
    switch (level) {
      case AyahMasteryLevel.newAyah:
        return 'مراجعة آيات جديدة';
      case AyahMasteryLevel.weak:
        return 'أولوية عالية للمراجعة';
      case AyahMasteryLevel.learning:
        return 'تثبيت الحفظ';
      case AyahMasteryLevel.good:
        return 'مراجعة دورية';
      case AyahMasteryLevel.mastered:
        return 'مراجعة بعيدة';
    }
  }

  String _reasonForLevel(AyahMasteryLevel level) {
    switch (level) {
      case AyahMasteryLevel.newAyah:
        return 'هذه الآيات تحتاج بداية متابعة في نظام المراجعة.';
      case AyahMasteryLevel.weak:
        return 'ظهرت أخطاء أو دقة منخفضة في هذه الآيات.';
      case AyahMasteryLevel.learning:
        return 'هذه الآيات في مرحلة التثبيت.';
      case AyahMasteryLevel.good:
        return 'هذه الآيات جيدة وتحتاج مراجعة دورية.';
      case AyahMasteryLevel.mastered:
        return 'هذه الآيات متقنة وتحتاج مراجعة متباعدة.';
    }
  }

  int _estimateMinutes(int ayahCount) {
    return (ayahCount * 2).clamp(2, 15);
  }
}
