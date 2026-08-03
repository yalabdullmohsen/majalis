import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/tasmee3_daily_goal.dart';

class Tasmee3GoalSettingsScreen extends ConsumerWidget {
  const Tasmee3GoalSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(tasmee3GoalControllerProvider);
    final controller = ref.read(tasmee3GoalControllerProvider.notifier);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('إعدادات هدف التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _section(
              title: 'الهدف اليومي',
              child: Column(
                children: [
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: state.goal.enabled,
                    title: const Text('تفعيل الهدف اليومي'),
                    onChanged: (value) {
                      controller.updateGoal(
                        state.goal.copyWith(enabled: value),
                      );
                    },
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<Tasmee3GoalType>(
                    value: state.goal.type,
                    decoration: const InputDecoration(
                      labelText: 'نوع الهدف',
                      border: OutlineInputBorder(),
                    ),
                    items: Tasmee3GoalType.values.map((type) {
                      return DropdownMenuItem(
                        value: type,
                        child: Text(type.arabicLabel),
                      );
                    }).toList(),
                    onChanged: (type) {
                      if (type == null) return;

                      controller.updateGoal(
                        state.goal.copyWith(type: type),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    value: state.goal.targetValue.clamp(1, 20),
                    decoration: const InputDecoration(
                      labelText: 'قيمة الهدف',
                      border: OutlineInputBorder(),
                    ),
                    items: List.generate(20, (index) {
                      final value = index + 1;
                      return DropdownMenuItem(
                        value: value,
                        child: Text('$value'),
                      );
                    }),
                    onChanged: (value) {
                      if (value == null) return;

                      controller.updateGoal(
                        state.goal.copyWith(targetValue: value),
                      );
                    },
                  ),
                ],
              ),
            ),
            _section(
              title: 'التذكير',
              child: Column(
                children: [
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: state.goal.reminderEnabled,
                    title: const Text('تفعيل التذكير اليومي'),
                    subtitle: const Text(
                      'هذا يحفظ وقت التذكير داخل التطبيق. ربط الإشعارات الفعلية يمكن إضافته لاحقا.',
                    ),
                    onChanged: (value) {
                      controller.updateGoal(
                        state.goal.copyWith(reminderEnabled: value),
                      );
                    },
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    initialValue: state.goal.reminderTime,
                    textDirection: TextDirection.ltr,
                    decoration: const InputDecoration(
                      labelText: 'وقت التذكير',
                      hintText: '20:00',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) {
                      controller.updateGoal(
                        state.goal.copyWith(reminderTime: value.trim()),
                      );
                    },
                  ),
                  if (state.goal.reminderEnabled) ...[
                    const SizedBox(height: 10),
                    Text(
                      'تذكير مفعّل عند ${state.goal.reminderTime}. سيظهر تنبيه داخل التطبيق عند فتح اللوحة إذا لم يكتمل الهدف.',
                      style: const TextStyle(
                        color: Color(0xFF9A8068),
                        height: 1.5,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (state.errorMessage != null) ...[
              const SizedBox(height: 10),
              Text(
                state.errorMessage!,
                style: const TextStyle(color: Colors.red),
              ),
            ],
            const SizedBox(height: 16),
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
                      ref.invalidate(tasmee3DailyGoalProvider);
                      ref.invalidate(tasmee3TodayGoalProgressProvider);

                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('تم حفظ هدف التسميع.'),
                          ),
                        );
                      }
                    },
              icon: const Icon(Icons.save),
              label: const Text('حفظ الهدف'),
            ),
            TextButton.icon(
              onPressed: state.isSaving
                  ? null
                  : () async {
                      await controller.reset();
                      ref.invalidate(tasmee3DailyGoalProvider);
                      ref.invalidate(tasmee3TodayGoalProgressProvider);
                    },
              icon: const Icon(Icons.restore),
              label: const Text('إعادة الافتراضي'),
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
              color: Color(0xFF11100E),
              fontWeight: FontWeight.bold,
              fontSize: 17,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
