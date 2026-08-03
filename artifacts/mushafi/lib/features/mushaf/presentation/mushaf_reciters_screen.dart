import 'package:flutter/material.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../data/reciters_catalog.dart';

class MushafRecitersScreen extends StatelessWidget {
  const MushafRecitersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Tasmee3AppScaffold(
      title: 'القراء',
      body: ListView.separated(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        itemCount: RecitersCatalog.all.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final reciter = RecitersCatalog.all[index];
          final configured = reciter.audioBaseUrl.trim().isNotEmpty;

          return Container(
            decoration: BoxDecoration(
              color: Tasmee3Colors.surface,
              borderRadius: BorderRadius.circular(Tasmee3Radius.md),
              border: Border.all(color: Tasmee3Colors.border),
            ),
            child: ListTile(
              leading: const Icon(
                Icons.record_voice_over,
                color: Tasmee3Colors.primary,
              ),
              title: Text(reciter.nameArabic),
              subtitle: Text(
                configured
                    ? reciter.riwayah
                    : '${reciter.riwayah} - يحتاج مصدر صوت مرخص',
              ),
              trailing: configured
                  ? const Icon(Icons.check_circle, color: Tasmee3Colors.success)
                  : const Icon(Icons.info_outline),
              onTap: () {
                if (!configured) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'الاستماع يحتاج روابط صوت مرخصة. لا تستخدم مصادر غير مرخصة.',
                      ),
                    ),
                  );
                  return;
                }

                Navigator.pop(context, reciter);
              },
            ),
          );
        },
      ),
    );
  }
}
