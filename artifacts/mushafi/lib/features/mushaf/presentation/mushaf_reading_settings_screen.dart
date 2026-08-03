import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../application/mushaf_providers.dart';
import '../domain/mushaf_font_family.dart';
import '../domain/mushaf_reading_settings.dart';
import '../domain/mushaf_reading_theme.dart';
import 'mushaf_reading_theme_colors.dart';

class MushafReadingSettingsScreen extends ConsumerWidget {
  const MushafReadingSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(mushafReadingSettingsControllerProvider);
    final controller =
        ref.read(mushafReadingSettingsControllerProvider.notifier);

    final settings = state.settings;
    final previewColors =
        MushafReadingThemeColors.fromTheme(settings.theme);

    return Tasmee3AppScaffold(
      title: 'إعدادات القراءة',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: [
          _PreviewCard(settings: settings, colors: previewColors),
          const SizedBox(height: Tasmee3Spacing.lg),
          _section(
            title: 'المظهر',
            child: Column(
              children: [
                DropdownButtonFormField<MushafReadingTheme>(
                  value: settings.theme,
                  decoration: const InputDecoration(
                    labelText: 'الثيم',
                    border: OutlineInputBorder(),
                  ),
                  items: MushafReadingTheme.values.map((theme) {
                    return DropdownMenuItem(
                      value: theme,
                      child: Text(theme.arabicLabel),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value == null) return;
                    controller.update(settings.copyWith(theme: value));
                  },
                ),
                const SizedBox(height: Tasmee3Spacing.md),
                DropdownButtonFormField<MushafFontFamily>(
                  value: settings.fontFamily,
                  decoration: const InputDecoration(
                    labelText: 'الخط',
                    border: OutlineInputBorder(),
                    helperText:
                        'الخط العثماني يظهر فقط عند توفر خط مرخص باسم UthmanicHafs',
                  ),
                  items: MushafFontFamily.values.map((font) {
                    return DropdownMenuItem(
                      value: font,
                      child: Text(font.arabicLabel),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value == null) return;
                    controller.update(settings.copyWith(fontFamily: value));
                  },
                ),
              ],
            ),
          ),
          _section(
            title: 'حجم النص',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('حجم الخط: ${settings.fontSize.round()}'),
                Slider(
                  value: settings.fontSize,
                  min: 20,
                  max: 34,
                  divisions: 14,
                  label: '${settings.fontSize.round()}',
                  activeColor: Tasmee3Colors.primary,
                  onChanged: (value) {
                    controller.update(settings.copyWith(fontSize: value));
                  },
                ),
                Text(
                  'تباعد الأسطر: ${settings.lineHeight.toStringAsFixed(1)}',
                ),
                Slider(
                  value: settings.lineHeight,
                  min: 1.5,
                  max: 2.4,
                  divisions: 9,
                  label: settings.lineHeight.toStringAsFixed(1),
                  activeColor: Tasmee3Colors.primary,
                  onChanged: (value) {
                    controller.update(settings.copyWith(lineHeight: value));
                  },
                ),
                Text('تباعد الكلمات: ${settings.wordSpacing.round()}'),
                Slider(
                  value: settings.wordSpacing,
                  min: 0,
                  max: 12,
                  divisions: 12,
                  label: '${settings.wordSpacing.round()}',
                  activeColor: Tasmee3Colors.primary,
                  onChanged: (value) {
                    controller.update(settings.copyWith(wordSpacing: value));
                  },
                ),
              ],
            ),
          ),
          _section(
            title: 'عناصر الصفحة',
            child: Column(
              children: [
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: settings.showPageHeader,
                  title: const Text('إظهار أعلى الصفحة'),
                  activeColor: Tasmee3Colors.primary,
                  onChanged: (value) {
                    controller.update(
                      settings.copyWith(showPageHeader: value),
                    );
                  },
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: settings.showPageFooter,
                  title: const Text('إظهار رقم الصفحة'),
                  activeColor: Tasmee3Colors.primary,
                  onChanged: (value) {
                    controller.update(
                      settings.copyWith(showPageFooter: value),
                    );
                  },
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: settings.highlightTappedAyah,
                  title: const Text('تمييز الآية عند الضغط'),
                  activeColor: Tasmee3Colors.primary,
                  onChanged: (value) {
                    controller.update(
                      settings.copyWith(highlightTappedAyah: value),
                    );
                  },
                ),
              ],
            ),
          ),
          if (state.errorMessage != null) ...[
            const SizedBox(height: Tasmee3Spacing.md),
            Text(
              state.errorMessage!,
              style: const TextStyle(color: Tasmee3Colors.danger),
            ),
          ],
          const SizedBox(height: Tasmee3Spacing.lg),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: state.isSaving
                ? null
                : () async {
                    await controller.save();
                    ref.invalidate(mushafReadingSettingsProvider);

                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('تم حفظ إعدادات القراءة.'),
                        ),
                      );
                    }
                  },
            icon: const Icon(Icons.save),
            label: const Text('حفظ الإعدادات'),
          ),
          TextButton.icon(
            onPressed: state.isSaving
                ? null
                : () async {
                    await controller.reset();
                    ref.invalidate(mushafReadingSettingsProvider);
                  },
            icon: const Icon(Icons.restore),
            label: const Text('إعادة الافتراضي'),
          ),
        ],
      ),
    );
  }

  Widget _section({
    required String title,
    required Widget child,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: Tasmee3Spacing.md),
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Tasmee3TextStyles.sectionTitle),
          const SizedBox(height: Tasmee3Spacing.md),
          child,
        ],
      ),
    );
  }
}

class _PreviewCard extends StatelessWidget {
  final MushafReadingSettings settings;
  final MushafReadingThemeColors colors;

  const _PreviewCard({
    required this.settings,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: colors.page,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: colors.border),
      ),
      child: Text(
        'قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝ ٱللَّهُ ٱلصَّمَدُ',
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: settings.fontSize,
          height: settings.lineHeight,
          fontFamily: settings.fontFamily.fontFamily,
          color: colors.text,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
