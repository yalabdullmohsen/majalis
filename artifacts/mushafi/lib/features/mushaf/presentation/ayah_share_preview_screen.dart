import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../tasmee3/domain/quran_ayah.dart';
import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../application/mushaf_providers.dart';
import '../domain/ayah_card_settings.dart';
import '../domain/ayah_card_theme.dart';
import 'widgets/ayah_share_card.dart';

class AyahSharePreviewScreen extends ConsumerStatefulWidget {
  final List<QuranAyah> ayahs;

  const AyahSharePreviewScreen({
    super.key,
    required this.ayahs,
  });

  @override
  ConsumerState<AyahSharePreviewScreen> createState() =>
      _AyahSharePreviewScreenState();
}

class _AyahSharePreviewScreenState
    extends ConsumerState<AyahSharePreviewScreen> {
  final GlobalKey repaintKey = GlobalKey();
  AyahCardSettings settings = const AyahCardSettings.defaults();
  bool isExporting = false;

  @override
  Widget build(BuildContext context) {
    final textBuilder = ref.watch(ayahShareTextBuilderProvider);

    return Tasmee3AppScaffold(
      title: 'مشاركة الآية',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: [
          if (widget.ayahs.length > 5) ...[
            Container(
              margin: const EdgeInsets.only(bottom: Tasmee3Spacing.md),
              padding: const EdgeInsets.all(Tasmee3Spacing.md),
              decoration: BoxDecoration(
                color: Tasmee3Colors.warning.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(Tasmee3Radius.md),
                border: Border.all(
                  color: Tasmee3Colors.warning.withValues(alpha: 0.25),
                ),
              ),
              child: const Text(
                'النطاق المحدد طويل. قد تكون البطاقة أوضح عند مشاركة خمس آيات أو أقل.',
                style: Tasmee3TextStyles.secondary,
                textAlign: TextAlign.center,
              ),
            ),
          ],
          Container(
            height: 420,
            alignment: Alignment.center,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Tasmee3Colors.surface,
              borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
              border: Border.all(color: Tasmee3Colors.border),
            ),
            child: FittedBox(
              fit: BoxFit.contain,
              child: RepaintBoundary(
                key: repaintKey,
                child: AyahShareCard(
                  ayahs: widget.ayahs,
                  settings: settings,
                  textBuilder: textBuilder,
                ),
              ),
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          _SettingsPanel(
            settings: settings,
            onChanged: (value) {
              setState(() => settings = value);
            },
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: isExporting ? null : _shareImage,
            icon: isExporting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.image_outlined),
            label: Text(
              isExporting ? 'جاري تجهيز الصورة...' : 'مشاركة كصورة',
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.sm),
          OutlinedButton.icon(
            onPressed: _copyText,
            icon: const Icon(Icons.copy),
            label: const Text('نسخ كنص'),
          ),
        ],
      ),
    );
  }

  Future<void> _shareImage() async {
    setState(() => isExporting = true);

    try {
      await Future<void>.delayed(const Duration(milliseconds: 300));
      if (!mounted) return;

      final boundaryElement = repaintKey.currentContext;
      if (boundaryElement == null || !boundaryElement.mounted) {
        throw StateError('تعذر الوصول إلى البطاقة.');
      }

      final renderObject = boundaryElement.findRenderObject();
      final boundary = renderObject is RenderRepaintBoundary
          ? renderObject
          : null;
      if (boundary == null) {
        throw StateError('تعذر تجهيز صورة البطاقة.');
      }

      final service = ref.read(widgetImageExportServiceProvider);
      final file = await service.exportPng(boundary: boundary);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'مشاركة من تطبيق مصحفي',
        subject: 'آية من القرآن الكريم',
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر مشاركة الصورة: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => isExporting = false);
      }
    }
  }

  Future<void> _copyText() async {
    final textBuilder = ref.read(ayahShareTextBuilderProvider);
    final text = textBuilder.buildText(widget.ayahs);

    await Clipboard.setData(ClipboardData(text: text));

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم نسخ النص.')),
    );
  }
}

class _SettingsPanel extends StatelessWidget {
  final AyahCardSettings settings;
  final ValueChanged<AyahCardSettings> onChanged;

  const _SettingsPanel({
    required this.settings,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'إعدادات البطاقة',
            style: Tasmee3TextStyles.sectionTitle,
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          DropdownButtonFormField<AyahCardThemeType>(
            value: settings.theme,
            decoration: const InputDecoration(
              labelText: 'الخلفية',
              border: OutlineInputBorder(),
            ),
            items: AyahCardThemeType.values.map((theme) {
              return DropdownMenuItem(
                value: theme,
                child: Text(theme.arabicLabel),
              );
            }).toList(),
            onChanged: (value) {
              if (value == null) return;
              onChanged(settings.copyWith(theme: value));
            },
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          Text('حجم الخط: ${settings.fontSize.round()}'),
          Slider(
            value: settings.fontSize,
            min: 20,
            max: 36,
            divisions: 8,
            label: '${settings.fontSize.round()}',
            activeColor: Tasmee3Colors.primary,
            onChanged: (value) {
              onChanged(settings.copyWith(fontSize: value));
            },
          ),
          SwitchListTile(
            value: settings.showReference,
            title: const Text('إظهار مرجع الآية'),
            activeColor: Tasmee3Colors.primary,
            onChanged: (value) {
              onChanged(settings.copyWith(showReference: value));
            },
          ),
          SwitchListTile(
            value: settings.showBrand,
            title: const Text('إظهار اسم التطبيق'),
            activeColor: Tasmee3Colors.primary,
            onChanged: (value) {
              onChanged(settings.copyWith(showBrand: value));
            },
          ),
          SwitchListTile(
            value: settings.showDivider,
            title: const Text('إظهار الفاصل'),
            activeColor: Tasmee3Colors.primary,
            onChanged: (value) {
              onChanged(settings.copyWith(showDivider: value));
            },
          ),
          SwitchListTile(
            value: settings.centerText,
            title: const Text('توسيط النص'),
            activeColor: Tasmee3Colors.primary,
            onChanged: (value) {
              onChanged(settings.copyWith(centerText: value));
            },
          ),
        ],
      ),
    );
  }
}
