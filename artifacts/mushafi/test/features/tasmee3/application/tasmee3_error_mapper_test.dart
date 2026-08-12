import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_error_mapper.dart';

void main() {
  const mapper = Tasmee3ErrorMapper();

  test('maps missing quran asset', () {
    expect(
      mapper.map(StateError('ملف القرآن غير موجود')),
      contains('ملف القرآن غير موجود'),
    );
  });

  test('maps network failure', () {
    expect(
      mapper.map(Exception('SocketException: Failed host lookup')),
      contains('تعذر الاتصال بالخادم'),
    );
  });

  test('maps unknown error safely', () {
    expect(
      mapper.map(Exception('weird opaque failure')),
      'حدث خطأ غير متوقع. حاول مرة أخرى.',
    );
  });

  test('keeps short Arabic StateError messages', () {
    expect(
      mapper.map(StateError('النطاق المحدد لا يحتوي على آيات.')),
      'النطاق المحدد لا يحتوي على آيات.',
    );
  });
}
