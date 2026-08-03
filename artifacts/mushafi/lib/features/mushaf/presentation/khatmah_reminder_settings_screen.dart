import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../application/mushaf_providers.dart';

class KhatmahReminderSettingsScreen extends ConsumerWidget {
  const KhatmahReminderSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reminderState = ref.watch(khatmahReminderControllerProvider);
    final reminderController =
        ref.read(khatmahReminderControllerProvider.notifier);
    final khatmahState = ref.watch(khatmahPlanControllerProvider);
    final activePlan = khatmahState.activePlan;

    final settings = reminderState.settings;

    return Tasmee3AppScaffold(
      title: 'تذكير الختمة',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: [
          Container(
            padding: const EdgeInsets.all(Tasmee3Spacing.lg),
            decoration: BoxDecoration(
              color: Tasmee3Colors.surface,
              borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
              border: Border.all(color: Tasmee3Colors.border),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  value: settings.enabled,
                  title: const Text('تذكير يومي بالورد'),
                  subtitle: Text(
                    activePlan == null
                        ? 'لا توجد ختمة نشطة حاليا.'
                        : 'وردك اليومي: ${activePlan.dailyPagesTarget} صفحة.',
                  ),
                  onChanged: (value) {
                    reminderController.update(
                      settings.copyWith(enabled: value),
                    );
                  },
                ),
                ListTile(
                  title: const Text('وقت التذكير اليومي'),
                  subtitle: Text(settings.timeLabel),
                  trailing: const Icon(Icons.access_time),
                  onTap: () async {
                    final picked = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay(
                        hour: settings.hour,
                        minute: settings.minute,
                      ),
                    );

                    if (picked == null) return;

                    reminderController.update(
                      settings.copyWith(
                        hour: picked.hour,
                        minute: picked.minute,
                      ),
                    );
                  },
                ),
                const Divider(),
                SwitchListTile(
                  value: settings.lateReminderEnabled,
                  title: const Text('تنبيه عند التأخر عن الخطة'),
                  subtitle: const Text(
                    'يظهر إذا كان تقدمك أقل من المطلوب حسب خطة الختمة.',
                  ),
                  onChanged: (value) {
                    reminderController.update(
                      settings.copyWith(lateReminderEnabled: value),
                    );
                  },
                ),
                ListTile(
                  title: const Text('وقت تنبيه التأخر'),
                  subtitle: Text(settings.lateTimeLabel),
                  trailing: const Icon(Icons.access_time),
                  onTap: () async {
                    final picked = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay(
                        hour: settings.lateReminderHour,
                        minute: settings.lateReminderMinute,
                      ),
                    );

                    if (picked == null) return;

                    reminderController.update(
                      settings.copyWith(
                        lateReminderHour: picked.hour,
                        lateReminderMinute: picked.minute,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          if (reminderState.errorMessage != null) ...[
            Text(
              reminderState.errorMessage!,
              style: const TextStyle(color: Tasmee3Colors.danger),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Tasmee3Spacing.md),
          ],
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: reminderState.isSaving
                ? null
                : () async {
                    await reminderController.save(activePlan: activePlan);

                    if (context.mounted) {
                      ref.invalidate(khatmahReminderSettingsProvider);

                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('تم حفظ تذكير الختمة.'),
                        ),
                      );
                    }
                  },
            icon: const Icon(Icons.save),
            label: Text(reminderState.isSaving ? 'جاري الحفظ...' : 'حفظ'),
          ),
          TextButton.icon(
            onPressed: reminderState.isSaving
                ? null
                : () async {
                    await reminderController.reset();

                    if (context.mounted) {
                      ref.invalidate(khatmahReminderSettingsProvider);

                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('تم إيقاف تذكيرات الختمة.'),
                        ),
                      );
                    }
                  },
            icon: const Icon(Icons.notifications_off_outlined),
            label: const Text('إيقاف التذكيرات'),
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          const Text(
            'التذكيرات محلية على جهازك ولا ترسل أي بيانات خارج التطبيق.',
            textAlign: TextAlign.center,
            style: Tasmee3TextStyles.secondary,
          ),
          const SizedBox(height: Tasmee3Spacing.sm),
          const Text(
            'عند رفض صلاحية الإشعارات لن تُعرض التذكيرات، ولن يتوقف التطبيق.',
            textAlign: TextAlign.center,
            style: Tasmee3TextStyles.secondary,
          ),
        ],
      ),
    );
  }
}
