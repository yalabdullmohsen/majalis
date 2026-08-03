import 'package:flutter/material.dart';

import '../../mushaf/presentation/quran_page_metadata_integrity_screen.dart';
import '../../mushaf/presentation/tafsir_integrity_screen.dart';
import 'quran_integrity_screen.dart';
import 'tasmee3_design_tokens.dart';
import 'widgets/tasmee3_app_scaffold.dart';

class QuranSourcesScreen extends StatelessWidget {
  const QuranSourcesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Tasmee3AppScaffold(
      title: 'مصادر النص القرآني',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: [
          const _SourceCard(
            title: 'مصدر النص',
            body:
                'يعتمد التطبيق على ملف قرآن موجود داخل التطبيق في assets/quran/quran_uthmani.json. يجب أن يكون الملف من مصدر موثوق ومرخص قبل النشر.',
          ),
          const _SourceCard(
            title: 'لا يوجد توليد بالذكاء الاصطناعي',
            body:
                'لا يتم توليد الآيات أو تعديلها بالذكاء الاصطناعي. أي عرض أو مقارنة يعتمد على النص المخزن في ملف القرآن.',
          ),
          const _SourceCard(
            title: 'مسؤولية الناشر',
            body:
                'قبل نشر التطبيق، يجب على الناشر التأكد من صحة ملف القرآن ومطابقته للمصحف المعتمد والرواية المطلوبة.',
          ),
          const _SourceCard(
            title: 'فحص البيانات',
            body:
                'يوفر التطبيق فحصا تقنيا لعدد السور والآيات وعدم وجود فراغات أو تكرارات، لكنه لا يغني عن المراجعة العلمية المعتمدة.',
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const QuranIntegrityScreen(),
                ),
              );
            },
            icon: const Icon(Icons.verified_outlined),
            label: const Text('فحص ملف القرآن'),
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const QuranPageMetadataIntegrityScreen(),
                ),
              );
            },
            icon: const Icon(Icons.layers_outlined),
            label: const Text('فحص بيانات صفحات المصحف'),
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const TafsirIntegrityScreen(),
                ),
              );
            },
            icon: const Icon(Icons.menu_book_outlined),
            label: const Text('فحص ملف التفسير'),
          ),
        ],
      ),
    );
  }
}

class _SourceCard extends StatelessWidget {
  final String title;
  final String body;

  const _SourceCard({
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
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
          Text(
            title,
            style: Tasmee3TextStyles.sectionTitle,
          ),
          const SizedBox(height: Tasmee3Spacing.sm),
          Text(
            body,
            style: Tasmee3TextStyles.body,
          ),
        ],
      ),
    );
  }
}
