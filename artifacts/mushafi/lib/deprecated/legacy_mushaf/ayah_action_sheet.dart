// DEPRECATED: Do not use in navigation. Replaced by lib/features/mushaf and lib/features/tasmee3.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/design_system/typography.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';

class AyahActionSheet extends StatelessWidget {
  const AyahActionSheet({
    super.key,
    required this.ayah,
    required this.colors,
    this.onPlay,
    this.onRepeatAyah,
    this.onBookmark,
    this.onNote,
    this.onShareText,
    this.onCopy,
    this.onTafsir,
    this.onStartHifz,
  });

  final Ayah ayah;
  final MushafiColors colors;
  final VoidCallback? onPlay;
  final VoidCallback? onRepeatAyah;
  final VoidCallback? onBookmark;
  final VoidCallback? onNote;
  final VoidCallback? onShareText;
  final VoidCallback? onCopy;
  final VoidCallback? onTafsir;
  final VoidCallback? onStartHifz;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: colors.ornamentSoft,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            Text(
              'آية ${ayah.surahId}:${ayah.ayahNumber}',
              textAlign: TextAlign.center,
              style: MushafiTypography.uiTitle(colors),
            ),
            const SizedBox(height: 8),
            Text(
              ayah.textUthmani,
              textAlign: TextAlign.center,
              textDirection: TextDirection.rtl,
              style: MushafiTypography.quranAyah(colors: colors, fontSize: 22),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                _chip('تشغيل', Icons.play_arrow, onPlay),
                _chip('تكرار', Icons.repeat_one, onRepeatAyah),
                _chip('مفضلة', Icons.bookmark_border, onBookmark),
                _chip('ملاحظة', Icons.note_alt_outlined, onNote),
                _chip('مشاركة', Icons.ios_share, onShareText),
                _chip('نسخ', Icons.copy, () {
                  Clipboard.setData(ClipboardData(text: ayah.textUthmani));
                  onCopy?.call();
                }),
                _chip('تفسير', Icons.menu_book_outlined, onTafsir),
                _chip('حفظ', Icons.school_outlined, onStartHifz),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, IconData icon, VoidCallback? onTap) {
    return ActionChip(
      avatar: Icon(icon, size: 18, color: colors.ornament),
      label: Text(label),
      onPressed: onTap,
      backgroundColor: colors.paper,
      side: BorderSide(color: colors.ornament.withValues(alpha: 0.35)),
    );
  }
}
