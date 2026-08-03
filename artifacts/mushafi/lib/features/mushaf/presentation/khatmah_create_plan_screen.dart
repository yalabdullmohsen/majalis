import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../application/mushaf_providers.dart';

class KhatmahCreatePlanScreen extends ConsumerStatefulWidget {
  const KhatmahCreatePlanScreen({super.key});

  @override
  ConsumerState<KhatmahCreatePlanScreen> createState() =>
      _KhatmahCreatePlanScreenState();
}

class _KhatmahCreatePlanScreenState
    extends ConsumerState<KhatmahCreatePlanScreen> {
  final titleController = TextEditingController(text: 'ختمة جديدة');
  int targetDays = 30;
  int startPage = 1;

  @override
  void dispose() {
    titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dailyPages = (604 / targetDays).ceil();

    return Tasmee3AppScaffold(
      title: 'إنشاء خطة ختمة',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: [
          TextField(
            controller: titleController,
            decoration: const InputDecoration(
              labelText: 'اسم الختمة',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          DropdownButtonFormField<int>(
            value: targetDays,
            decoration: const InputDecoration(
              labelText: 'مدة الختمة',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(value: 7, child: Text('7 أيام')),
              DropdownMenuItem(value: 10, child: Text('10 أيام')),
              DropdownMenuItem(value: 15, child: Text('15 يوما')),
              DropdownMenuItem(value: 30, child: Text('30 يوما')),
              DropdownMenuItem(value: 60, child: Text('60 يوما')),
              DropdownMenuItem(value: 90, child: Text('90 يوما')),
            ],
            onChanged: (value) {
              if (value == null) return;
              setState(() => targetDays = value);
            },
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          Text('صفحة البداية: $startPage'),
          Slider(
            value: startPage.toDouble(),
            min: 1,
            max: 604,
            divisions: 603,
            label: '$startPage',
            onChanged: (value) {
              setState(() => startPage = value.round());
            },
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          Container(
            padding: const EdgeInsets.all(Tasmee3Spacing.lg),
            decoration: BoxDecoration(
              color: Tasmee3Colors.surface,
              borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
              border: Border.all(color: Tasmee3Colors.border),
            ),
            child: Text(
              'الورد اليومي التقريبي: $dailyPages صفحة',
              textAlign: TextAlign.center,
              style: Tasmee3TextStyles.sectionTitle,
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () async {
              await ref.read(khatmahPlanControllerProvider.notifier).createPlan(
                    title: titleController.text.trim().isEmpty
                        ? 'ختمة جديدة'
                        : titleController.text.trim(),
                    targetDays: targetDays,
                    startPage: startPage,
                  );

              if (context.mounted) {
                Navigator.pop(context);
              }
            },
            icon: const Icon(Icons.check),
            label: const Text('إنشاء الخطة'),
          ),
        ],
      ),
    );
  }
}
