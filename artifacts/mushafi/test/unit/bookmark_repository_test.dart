import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/bookmarks/data/bookmark_repository.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('BookmarkRepository add and remove', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final repo = BookmarkRepository(prefs);
    const ayah = Ayah(
      surahId: 112,
      ayahNumber: 1,
      globalAyahNumber: 6222,
      pageNumber: 2,
      juzNumber: 30,
      hizbQuarter: 240,
      textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      textPlain: 'قل هو الله أحد',
      words: [],
    );
    final b = await repo.addForAyah(ayah, title: 'اختبار');
    expect(repo.list(), isNotEmpty);
    expect(repo.list().first.id, b.id);
    await repo.remove(b.id);
    expect(repo.list(), isEmpty);
  });
}
