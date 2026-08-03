import '../domain/queued_tasmee3_job.dart';

abstract class Tasmee3FailedJobQueue {
  Future<List<QueuedTasmee3Job>> getJobs();

  Future<void> addJob(QueuedTasmee3Job job);

  Future<void> removeJob(String id);

  Future<void> clear();
}
