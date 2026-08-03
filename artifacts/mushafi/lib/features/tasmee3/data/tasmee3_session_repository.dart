import '../domain/tasmee3_session_record.dart';

abstract class Tasmee3SessionRepository {
  Future<List<Tasmee3SessionRecord>> getSessions();

  Future<void> saveSession(Tasmee3SessionRecord record);

  Future<void> clearSessions();
}
