import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/queued_tasmee3_job.dart';
import 'tasmee3_failed_job_queue.dart';

class LocalTasmee3FailedJobQueue implements Tasmee3FailedJobQueue {
  static const String _key = 'tasmee3_failed_jobs';

  @override
  Future<List<QueuedTasmee3Job>> getJobs() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const [];
    }

    final decoded = jsonDecode(raw) as List<dynamic>;

    return decoded
        .map((item) => QueuedTasmee3Job.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> addJob(QueuedTasmee3Job job) async {
    final prefs = await SharedPreferences.getInstance();
    final jobs = await getJobs();

    final updated = [job, ...jobs].take(20).toList();

    await prefs.setString(
      _key,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> removeJob(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final jobs = await getJobs();

    final updated = jobs.where((job) => job.id != id).toList();

    await prefs.setString(
      _key,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
