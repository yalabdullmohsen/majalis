import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mushafi/core/theme/app_theme.dart';
import 'package:mushafi/core/utils/arabic_numbers.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/quran/domain/mushaf_layout_engine.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    final settings = ref.watch(settingsRepositoryProvider);
    return Scaffold(
      backgroundColor: colors.scaffold,
      appBar: AppBar(title: const Text('الإعدادات')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('مظهر القراءة'),
            subtitle: Text(ref.watch(themeModeProvider).name),
            trailing: DropdownButton<MushafiThemeMode>(
              value: ref.watch(themeModeProvider),
              items: MushafiThemeMode.values
                  .map((e) => DropdownMenuItem(value: e, child: Text(e.name)))
                  .toList(),
              onChanged: (v) async {
                if (v == null) return;
                ref.read(themeModeProvider.notifier).state = v;
                await settings.setThemeMode(v);
              },
            ),
          ),
          ListTile(
            title: const Text('وضع العرض'),
            trailing: DropdownButton<MushafReadingMode>(
              value: ref.watch(readingModeProvider),
              items: MushafReadingMode.values
                  .map((e) => DropdownMenuItem(value: e, child: Text(e.name)))
                  .toList(),
              onChanged: (v) async {
                if (v == null) return;
                ref.read(readingModeProvider.notifier).state = v;
                await settings.setReadingMode(v);
              },
            ),
          ),
          ListTile(
            title: Text('حجم الخط (${ref.watch(fontScaleProvider).toStringAsFixed(2)})'),
            subtitle: Slider(
              value: ref.watch(fontScaleProvider),
              min: 0.8,
              max: 1.6,
              onChanged: (v) {
                ref.read(fontScaleProvider.notifier).state = v;
              },
              onChangeEnd: (v) => settings.setFontScale(v),
            ),
          ),
          SwitchListTile(
            title: const Text('أرقام هندية'),
            value: ref.watch(digitStyleProvider) == DigitStyle.easternArabic,
            onChanged: (v) async {
              final style = v ? DigitStyle.easternArabic : DigitStyle.western;
              ref.read(digitStyleProvider.notifier).state = style;
              await settings.setDigitStyle(style);
            },
          ),
          const Divider(),
          const ListTile(
            title: Text('التسميع'),
            subtitle: Text(
              'أداة مساعدة لمراجعة الحفظ عبر الميكروفون. '
              'يمكنك ضبط محرك التسميع من إعداداته داخل لوحة التسميع.',
            ),
          ),
          const Divider(),
          const ListTile(
            title: Text('حول مصحفي'),
            subtitle: Text(
              'تطبيق قراءة هادئ. النص القرآني من ملف عثماني موثّق داخل التطبيق.',
            ),
          ),
          const ListTile(
            title: Text('الخصوصية'),
            subtitle: Text(
              'الملاحظات والحفظ محلياً افتراضياً. '
              'التسميع يعمل على الجهاز افتراضياً، ولا يُرسل الصوت إلا إذا سمحت بذلك.',
            ),
          ),
        ],
      ),
    );
  }
}
