import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/tasmee3_reminder.dart';
import '../domain/tasmee3_reminder_type.dart';

class Tasmee3RemindersScreen extends ConsumerWidget {
  const Tasmee3RemindersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(tasmee3RemindersControllerProvider);
    final controller = ref.read(tasmee3RemindersControllerProvider.notifier);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('إدارة تذكيرات التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'فعّل التذكيرات التي تناسبك. كل التذكيرات محلية على جهازك.',
              style: TextStyle(
                color: Color(0xFF9A8068),
                height: 1.6,
              ),
            ),
            const SizedBox(height: 14),
            ...state.reminders.map((reminder) {
              return _ReminderCard(
                reminder: reminder,
                onChanged: controller.updateReminder,
              );
            }),
            if (state.errorMessage != null) ...[
              const SizedBox(height: 10),
              Text(
                state.errorMessage!,
                style: const TextStyle(color: Colors.red),
              ),
            ],
            const SizedBox(height: 14),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA77A48),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: state.isSaving
                  ? null
                  : () async {
                      final messenger = ScaffoldMessenger.of(context);
                      final service =
                          ref.read(tasmee3NotificationServiceProvider);
                      final granted = await service.requestPermission();

                      if (!granted) {
                        messenger.showSnackBar(
                          const SnackBar(
                            content: Text('لم يتم منح صلاحية الإشعارات.'),
                          ),
                        );
                        return;
                      }

                      final sessions = await ref.read(
                        tasmee3SessionHistoryProvider.future,
                      );

                      await controller.save(sessions: sessions);

                      ref.invalidate(tasmee3RemindersProvider);
                      messenger.showSnackBar(
                        const SnackBar(
                          content: Text('تم حفظ التذكيرات.'),
                        ),
                      );
                    },
              icon: const Icon(Icons.save),
              label: const Text('حفظ وجدولة التذكيرات'),
            ),
            TextButton.icon(
              onPressed: state.isSaving
                  ? null
                  : () async {
                      await controller.reset();
                      ref.invalidate(tasmee3RemindersProvider);
                    },
              icon: const Icon(Icons.restore),
              label: const Text('إعادة الافتراضي'),
            ),
            OutlinedButton.icon(
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                final service = ref.read(tasmee3NotificationServiceProvider);
                final granted = await service.requestPermission();

                if (!granted) {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('لم يتم منح صلاحية الإشعارات.'),
                    ),
                  );
                  return;
                }

                await service.showTestNotification();

                messenger.showSnackBar(
                  const SnackBar(content: Text('تم إرسال إشعار تجريبي.')),
                );
              },
              icon: const Icon(Icons.notifications_active_outlined),
              label: const Text('اختبار إشعار'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReminderCard extends StatelessWidget {
  final Tasmee3Reminder reminder;
  final ValueChanged<Tasmee3Reminder> onChanged;

  const _ReminderCard({
    required this.reminder,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
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
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: reminder.enabled,
            title: Text(reminder.type.arabicLabel),
            subtitle: Text(reminder.body),
            onChanged: (value) {
              onChanged(reminder.copyWith(enabled: value));
            },
          ),
          const SizedBox(height: 10),
          TextFormField(
            initialValue: reminder.time,
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'وقت التذكير',
              hintText: '20:00',
              border: OutlineInputBorder(),
            ),
            onChanged: (value) {
              onChanged(reminder.copyWith(time: value.trim()));
            },
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(7, (index) {
              final weekday = index + 1;
              final selected = reminder.weekdays.contains(weekday);

              return FilterChip(
                selected: selected,
                label: Text(_weekdayLabel(weekday)),
                onSelected: (value) {
                  final updated = [...reminder.weekdays];

                  if (value) {
                    if (!updated.contains(weekday)) {
                      updated.add(weekday);
                    }
                  } else {
                    updated.remove(weekday);
                  }

                  updated.sort();

                  onChanged(reminder.copyWith(weekdays: updated));
                },
              );
            }),
          ),
        ],
      ),
    );
  }

  String _weekdayLabel(int weekday) {
    switch (weekday) {
      case 1:
        return 'الاثنين';
      case 2:
        return 'الثلاثاء';
      case 3:
        return 'الأربعاء';
      case 4:
        return 'الخميس';
      case 5:
        return 'الجمعة';
      case 6:
        return 'السبت';
      case 7:
        return 'الأحد';
      default:
        return '$weekday';
    }
  }
}
