import 'dart:convert';

import 'package:http/http.dart' as http;

import '../domain/asr_connection_status.dart';

class AsrServerHealthService {
  Future<AsrConnectionStatus> check({
    required String endpoint,
    required String apiKey,
  }) async {
    final trimmed = endpoint.trim();

    if (trimmed.isEmpty) {
      return AsrConnectionStatus.missingEndpoint();
    }

    try {
      final transcribeUri = Uri.parse(trimmed);
      final healthUri = transcribeUri.replace(path: _healthPath(transcribeUri));

      final response = await http
          .get(
            healthUri,
            headers: {
              if (apiKey.trim().isNotEmpty) 'Authorization': 'Bearer $apiKey',
            },
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);

        if (decoded is Map<String, dynamic>) {
          return AsrConnectionStatus.connected();
        }

        return AsrConnectionStatus.connected();
      }

      if (response.statusCode == 401 || response.statusCode == 403) {
        return AsrConnectionStatus.unauthorized();
      }

      return AsrConnectionStatus.disconnected();
    } catch (e) {
      return AsrConnectionStatus.error(e.toString());
    }
  }

  bool looksLikeWebSocketEndpoint(String endpoint) {
    final value = endpoint.trim().toLowerCase();
    return value.startsWith('ws://') || value.startsWith('wss://');
  }

  String _healthPath(Uri transcribeUri) {
    final path = transcribeUri.path;

    if (path.endsWith('/transcribe')) {
      return path.replaceFirst('/transcribe', '/health');
    }

    if (path == '/' || path.isEmpty) {
      return '/health';
    }

    return '/health';
  }
}
