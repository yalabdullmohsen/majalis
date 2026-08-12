import 'package:flutter_test/flutter_test.dart';
import 'package:majlisilm_flutter/shared/constants/majlis_constants.dart';
import 'package:majlisilm_flutter/user_app/data/user_quran_repository.dart';

void main() {
  test('release version helper constants', () {
    expect(MajlisConstants.fontDefault, 28);
    expect(UserQuranRepository.getVerses().length, 7);
  });
}
