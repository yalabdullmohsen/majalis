import 'package:flutter/material.dart';

import '../../tasmee3/data/surah_catalog.dart';
import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../domain/mushaf_search_filter.dart';

class MushafSearchFilterSheet extends StatefulWidget {
  final MushafSearchFilter current;

  const MushafSearchFilterSheet({
    super.key,
    required this.current,
  });

  @override
  State<MushafSearchFilterSheet> createState() =>
      _MushafSearchFilterSheetState();
}

class _MushafSearchFilterSheetState extends State<MushafSearchFilterSheet> {
  late MushafSearchFilter filter;

  @override
  void initState() {
    super.initState();
    filter = widget.current;
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Tasmee3Spacing.lg),
          child: ListView(
            shrinkWrap: true,
            children: [
              const Text(
                'فلاتر البحث',
                style: Tasmee3TextStyles.title,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: Tasmee3Spacing.lg),
              DropdownButtonFormField<int?>(
                value: filter.surah,
                decoration: const InputDecoration(
                  labelText: 'السورة',
                  border: OutlineInputBorder(),
                ),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text('كل السور'),
                  ),
                  ...SurahCatalog.all.map((surah) {
                    return DropdownMenuItem<int?>(
                      value: surah.id,
                      child: Text('${surah.id}. ${surah.nameArabic}'),
                    );
                  }),
                ],
                onChanged: (value) {
                  setState(() {
                    filter = filter.copyWith(
                      surah: value,
                      clearSurah: value == null,
                    );
                  });
                },
              ),
              const SizedBox(height: Tasmee3Spacing.md),
              DropdownButtonFormField<int?>(
                value: filter.juz,
                decoration: const InputDecoration(
                  labelText: 'الجزء',
                  border: OutlineInputBorder(),
                ),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text('كل الأجزاء'),
                  ),
                  ...List.generate(30, (index) {
                    final juz = index + 1;
                    return DropdownMenuItem<int?>(
                      value: juz,
                      child: Text('الجزء $juz'),
                    );
                  }),
                ],
                onChanged: (value) {
                  setState(() {
                    filter = filter.copyWith(
                      juz: value,
                      clearJuz: value == null,
                    );
                  });
                },
              ),
              const SizedBox(height: Tasmee3Spacing.md),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                value: filter.includeQuranText,
                title: const Text('البحث في نص القرآن'),
                activeColor: Tasmee3Colors.primary,
                onChanged: (value) {
                  setState(() {
                    filter = filter.copyWith(includeQuranText: value);
                  });
                },
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                value: filter.includeTafsir,
                title: const Text('البحث في التفسير'),
                subtitle: const Text(
                  'يتطلب وجود ملف تفسير مرخص ومتوفر داخل التطبيق.',
                ),
                activeColor: Tasmee3Colors.primary,
                onChanged: (value) {
                  setState(() {
                    filter = filter.copyWith(includeTafsir: value);
                  });
                },
              ),
              const SizedBox(height: Tasmee3Spacing.lg),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Tasmee3Colors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () => Navigator.pop(context, filter),
                icon: const Icon(Icons.check),
                label: const Text('تطبيق الفلاتر'),
              ),
              TextButton.icon(
                onPressed: () {
                  Navigator.pop(context, const MushafSearchFilter.defaults());
                },
                icon: const Icon(Icons.restore),
                label: const Text('إعادة الافتراضي'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
