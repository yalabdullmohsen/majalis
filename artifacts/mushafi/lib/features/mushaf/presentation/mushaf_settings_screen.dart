import 'package:flutter/material.dart';

import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import 'mushaf_audio_settings_screen.dart';
import 'mushaf_design_tokens.dart';
import 'mushaf_reading_settings_screen.dart';

/// مركز إعدادات المصحف الجديد (قراءة + صوت).
class MushafSettingsScreen extends StatelessWidget {
  const MushafSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Tasmee3AppScaffold(
      title: 'إعدادات المصحف',
      titleBadge: 'المصحف الجديد',
      body: ListView(
        padding: const EdgeInsets.all(MushafSpacing.lg),
        children: [
          _SettingsTile(
            icon: Icons.text_fields_rounded,
            title: 'حجم الخط والمظهر',
            subtitle: 'الثيم الليلي، تباعد الأسطر، ومعلومات الصفحة',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const MushafReadingSettingsScreen(),
                ),
              );
            },
          ),
          const SizedBox(height: MushafSpacing.md),
          _SettingsTile(
            icon: Icons.headphones_outlined,
            title: 'إعدادات الصوت',
            subtitle: 'القارئ والتنزيلات والتلاوة',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const MushafAudioSettingsScreen(),
                ),
              );
            },
          ),
          const SizedBox(height: MushafSpacing.xl),
          Text(
            'الإعدادات هنا لراحة القراءة فقط، ولا تغيّر نص القرآن.',
            textAlign: TextAlign.center,
            style: MushafTextStyles.secondary,
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: MushafColors.surface,
      borderRadius: BorderRadius.circular(MushafRadius.lg),
      child: InkWell(
        borderRadius: BorderRadius.circular(MushafRadius.lg),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(MushafSpacing.lg),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(MushafRadius.lg),
            border: Border.all(color: MushafColors.border),
          ),
          child: Row(
            children: [
              Icon(icon, color: MushafColors.primary, size: 28),
              const SizedBox(width: MushafSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: MushafTextStyles.sectionTitle),
                    const SizedBox(height: 4),
                    Text(subtitle, style: MushafTextStyles.secondary),
                  ],
                ),
              ),
              const Icon(Icons.chevron_left, color: MushafColors.mutedText),
            ],
          ),
        ),
      ),
    );
  }
}
