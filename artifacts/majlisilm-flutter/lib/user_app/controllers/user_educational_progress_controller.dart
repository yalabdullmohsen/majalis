import 'package:flutter/foundation.dart';

import '../../shared/models/shared_adhkar_item.dart';
import '../../shared/models/shared_course_progress.dart';
import '../services/user_local_storage_service.dart';

/// Provider ChangeNotifier — course % + daily Adhkar checklists.
class UserEducationalProgressController extends ChangeNotifier {
  UserEducationalProgressController({
    UserLocalStorageService? storage,
    bool hydrate = true,
  }) : _storage = storage ?? UserLocalStorageService.instance {
    _courses = List<SharedCourseProgress>.from(_defaultsCourses);
    _adhkar = List<SharedAdhkarItem>.from(_defaultsAdhkar);
    if (hydrate) {
      _hydrate();
    }
  }

  final UserLocalStorageService _storage;

  static const List<SharedCourseProgress> _defaultsCourses = [
    SharedCourseProgress(
      courseId: 'aqidah',
      titleAr: 'مسار العقيدة والمفهوم الشامل',
      progress: 0.65,
    ),
    SharedCourseProgress(
      courseId: 'fiqh',
      titleAr: 'فقه العبادات للمبتدئين',
      progress: 0.30,
    ),
    SharedCourseProgress(
      courseId: 'sirah',
      titleAr: 'السيرة النبوية العطرة',
      progress: 0.85,
    ),
  ];

  static const List<SharedAdhkarItem> _defaultsAdhkar = [
    SharedAdhkarItem(id: 'morning', titleAr: 'أذكار الصباح', done: true),
    SharedAdhkarItem(id: 'evening', titleAr: 'أذكار المساء', done: false),
    SharedAdhkarItem(id: 'sleep', titleAr: 'أذكار النوم', done: false),
  ];

  late List<SharedCourseProgress> _courses;
  late List<SharedAdhkarItem> _adhkar;

  List<SharedCourseProgress> get courses =>
      List<SharedCourseProgress>.unmodifiable(_courses);
  List<SharedAdhkarItem> get dailyAdhkar =>
      List<SharedAdhkarItem>.unmodifiable(_adhkar);

  Future<void> _hydrate() async {
    final savedCourses = await _storage.loadCourses();
    final savedAdhkar = await _storage.loadAdhkar();
    if (savedCourses != null && savedCourses.isNotEmpty) {
      _courses = savedCourses;
    }
    if (savedAdhkar != null && savedAdhkar.isNotEmpty) {
      _adhkar = savedAdhkar;
    }
    notifyListeners();
  }

  Future<void> _persist() async {
    await _storage.saveCourses(_courses);
    await _storage.saveAdhkar(_adhkar);
  }

  void updateCourseProgress(String courseId, double progress) {
    final idx = _courses.indexWhere((c) => c.courseId == courseId);
    if (idx < 0) return;
    final next = progress.clamp(0.0, 1.0);
    if (_courses[idx].progress == next) return;
    _courses[idx] = _courses[idx].copyWith(progress: next);
    notifyListeners();
    _persist();
  }

  void toggleAdhkar(String id) {
    final idx = _adhkar.indexWhere((a) => a.id == id);
    if (idx < 0) return;
    _adhkar[idx] = _adhkar[idx].copyWith(done: !_adhkar[idx].done);
    notifyListeners();
    _persist();
  }

  void setAdhkar(String id, bool done) {
    final idx = _adhkar.indexWhere((a) => a.id == id);
    if (idx < 0) return;
    if (_adhkar[idx].done == done) return;
    _adhkar[idx] = _adhkar[idx].copyWith(done: done);
    notifyListeners();
    _persist();
  }
}
