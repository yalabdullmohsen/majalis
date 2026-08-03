import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/asr_connection_status.dart';
import '../domain/asr_engine_mode.dart';

class Tasmee3AsrSettingsScreen extends ConsumerStatefulWidget {
  const Tasmee3AsrSettingsScreen({super.key});

  @override
  ConsumerState<Tasmee3AsrSettingsScreen> createState() =>
      _Tasmee3AsrSettingsScreenState();
}

class _Tasmee3AsrSettingsScreenState
    extends ConsumerState<Tasmee3AsrSettingsScreen> {
  late TextEditingController endpointController;
  late TextEditingController apiKeyController;
  late TextEditingController liveWsEndpointController;

  @override
  void initState() {
    super.initState();

    final state = ref.read(tasmee3AsrSettingsControllerProvider);
    endpointController = TextEditingController(text: state.settings.endpoint);
    apiKeyController = TextEditingController(text: state.settings.apiKey);
    liveWsEndpointController = TextEditingController(
      text: state.settings.liveWebSocketEndpoint,
    );
  }

  @override
  void dispose() {
    endpointController.dispose();
    apiKeyController.dispose();
    liveWsEndpointController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<dynamic>>(tasmee3UserAsrSettingsProvider, (
      previous,
      next,
    ) {
      next.whenData((settings) {
        if (endpointController.text.isEmpty && settings.endpoint.isNotEmpty) {
          endpointController.text = settings.endpoint;
        }
        if (apiKeyController.text.isEmpty && settings.apiKey.isNotEmpty) {
          apiKeyController.text = settings.apiKey;
        }
        if (liveWsEndpointController.text.isEmpty &&
            settings.liveWebSocketEndpoint.isNotEmpty) {
          liveWsEndpointController.text = settings.liveWebSocketEndpoint;
        }

        final current = ref.read(tasmee3AsrSettingsControllerProvider);
        if (current.settings.endpoint.isEmpty && settings.endpoint.isNotEmpty) {
          ref
              .read(tasmee3AsrSettingsControllerProvider.notifier)
              .updateSettings(settings);
        }
      });
    });

    final state = ref.watch(tasmee3AsrSettingsControllerProvider);
    final controller = ref.read(tasmee3AsrSettingsControllerProvider.notifier);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('إعدادات محرك التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _section(
              title: 'اختيار المحرك',
              child: DropdownButtonFormField<AsrEngineMode>(
                value: state.settings.mode,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: 'محرك التسميع',
                ),
                items: AsrEngineMode.values.map((mode) {
                  return DropdownMenuItem(
                    value: mode,
                    child: Text(mode.arabicLabel),
                  );
                }).toList(),
                onChanged: (mode) {
                  if (mode == null) return;

                  controller.updateSettings(
                    state.settings.copyWith(mode: mode),
                  );
                },
              ),
            ),
            _section(
              title: 'الخادم المتقدم',
              child: Column(
                children: [
                  TextFormField(
                    controller: endpointController,
                    textDirection: TextDirection.ltr,
                    decoration: const InputDecoration(
                      labelText: 'ASR Endpoint',
                      hintText: 'http://IP:8000/transcribe',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) {
                      controller.updateSettings(
                        state.settings.copyWith(endpoint: value.trim()),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: liveWsEndpointController,
                    textDirection: TextDirection.ltr,
                    decoration: const InputDecoration(
                      labelText: 'Live WebSocket Endpoint اختياري',
                      hintText: 'ws://IP:8000/ws/live',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) {
                      controller.updateSettings(
                        state.settings.copyWith(
                          liveWebSocketEndpoint: value.trim(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: state.settings.enableLiveWebSocket,
                    title: const Text('تفعيل التسميع المباشر WebSocket'),
                    subtitle: const Text(
                      'ميزة تجريبية. إذا فشلت، استخدم الخادم العادي أو تعرف الجهاز.',
                    ),
                    onChanged: (value) {
                      controller.updateSettings(
                        state.settings.copyWith(enableLiveWebSocket: value),
                      );
                    },
                  ),
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      'تنبيه: البث المباشر WebSocket ميزة متقدمة وتجريبية. للحصول على ثبات أعلى استخدم الخادم العادي إذا واجهت تقطع.',
                      style: TextStyle(
                        color: Colors.orange,
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: state.settings.enableNativePcmStreaming,
                    title: const Text('استخدام Native PCM Streaming'),
                    subtitle: const Text(
                      'تجريبي ومتقدم. يعطي بثا صوتيا أفضل إذا كان مدعوما على الجهاز.',
                    ),
                    onChanged: (value) {
                      controller.updateSettings(
                        state.settings.copyWith(
                          enableNativePcmStreaming: value,
                        ),
                      );
                    },
                  ),
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      'إذا لم يعمل PCM Streaming على جهازك، عطله وسيستخدم التطبيق WebSocket chunks أو الخادم العادي.',
                      style: TextStyle(
                        color: Colors.orange,
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: apiKeyController,
                    textDirection: TextDirection.ltr,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'API Key اختياري',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) {
                      controller.updateSettings(
                        state.settings.copyWith(apiKey: value.trim()),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: state.settings.allowServerAudioUpload,
                    title: const Text('السماح بإرسال التسجيل للخادم'),
                    subtitle: const Text(
                      'إذا كان الخيار مغلقا، سيتم استخدام تعرف الجهاز فقط.',
                    ),
                    onChanged: (value) {
                      controller.updateSettings(
                        state.settings.copyWith(
                          allowServerAudioUpload: value,
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                  _connectionCard(state.connectionStatus),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: state.isChecking
                              ? null
                              : () async {
                                  await controller.checkConnection();
                                  ref
                                      .read(
                                        tasmee3ConnectionStatusProvider
                                            .notifier,
                                      )
                                      .state = ref
                                          .read(
                                            tasmee3AsrSettingsControllerProvider,
                                          )
                                          .connectionStatus;
                                },
                          icon: state.isChecking
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.wifi_tethering),
                          label: const Text('اختبار الاتصال'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            _section(
              title: 'المحاولات التلقائية',
              child: Column(
                children: [
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: state.settings.enableAutoRetry,
                    title: const Text('إعادة المحاولة تلقائيا'),
                    subtitle: const Text(
                      'إذا فشل رفع الصوت، يحاول التطبيق مرة أخرى.',
                    ),
                    onChanged: (value) {
                      controller.updateSettings(
                        state.settings.copyWith(enableAutoRetry: value),
                      );
                    },
                  ),
                  DropdownButtonFormField<int>(
                    value: state.settings.maxRetryCount,
                    decoration: const InputDecoration(
                      labelText: 'عدد المحاولات',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 0, child: Text('بدون إعادة')),
                      DropdownMenuItem(value: 1, child: Text('محاولة واحدة')),
                      DropdownMenuItem(value: 2, child: Text('محاولتان')),
                      DropdownMenuItem(value: 3, child: Text('3 محاولات')),
                    ],
                    onChanged: (value) {
                      if (value == null) return;

                      controller.updateSettings(
                        state.settings.copyWith(maxRetryCount: value),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: state.settings.saveFailedSessionsQueue,
                    title: const Text('حفظ الجلسات الفاشلة في قائمة انتظار'),
                    subtitle: const Text(
                      'يفيد إذا كان الخادم غير متوفر مؤقتا.',
                    ),
                    onChanged: (value) {
                      controller.updateSettings(
                        state.settings.copyWith(
                          saveFailedSessionsQueue: value,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            _section(
              title: 'الخصوصية',
              child: const Text(
                'لا يتم توليد النص القرآني بالذكاء الاصطناعي. يتم استخدام النص القرآني الموجود داخل التطبيق للمقارنة. إذا فعّلت الخادم المتقدم، قد يتم إرسال التسجيل الصوتي إلى الخادم المحدد فقط.',
                style: TextStyle(
                  height: 1.6,
                  color: Color(0xFF11100E),
                ),
              ),
            ),
            if (state.errorMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                state.errorMessage!,
                style: const TextStyle(color: Colors.red),
              ),
            ],
            const SizedBox(height: 12),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA77A48),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: state.isSaving
                  ? null
                  : () async {
                      await controller.save();

                      if (context.mounted) {
                        ref.invalidate(tasmee3UserAsrSettingsProvider);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('تم حفظ إعدادات التسميع.'),
                          ),
                        );
                      }
                    },
              icon: const Icon(Icons.save),
              label: const Text('حفظ الإعدادات'),
            ),
            const SizedBox(height: 10),
            TextButton.icon(
              onPressed: state.isSaving
                  ? null
                  : () async {
                      await controller.reset();

                      endpointController.text = '';
                      apiKeyController.text = '';
                      liveWsEndpointController.text = '';

                      if (context.mounted) {
                        ref.invalidate(tasmee3UserAsrSettingsProvider);
                      }
                    },
              icon: const Icon(Icons.restore),
              label: const Text('إعادة الإعدادات الافتراضية'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section({
    required String title,
    required Widget child,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0C5A3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _connectionCard(AsrConnectionStatus status) {
    Color color;
    IconData icon;

    switch (status.type) {
      case AsrConnectionStatusType.connected:
        color = Colors.green.shade700;
        icon = Icons.check_circle_outline;
        break;
      case AsrConnectionStatusType.unauthorized:
        color = Colors.orange.shade800;
        icon = Icons.lock_outline;
        break;
      case AsrConnectionStatusType.missingEndpoint:
        color = Colors.orange.shade800;
        icon = Icons.link_off;
        break;
      case AsrConnectionStatusType.disconnected:
      case AsrConnectionStatusType.error:
        color = Colors.red.shade700;
        icon = Icons.error_outline;
        break;
      case AsrConnectionStatusType.unknown:
        color = Colors.blueGrey.shade700;
        icon = Icons.help_outline;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              status.message,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
