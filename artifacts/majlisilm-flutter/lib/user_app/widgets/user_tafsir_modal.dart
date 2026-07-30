import 'package:flutter/material.dart';

import '../../shared/theme/majlis_colors.dart';

/// Nested modal for tafsir text.
class UserTafsirModal extends StatelessWidget {
  const UserTafsirModal({
    super.key,
    required this.verseText,
    required this.tafsirText,
  });

  final String verseText;
  final String tafsirText;

  static Future<void> show(
    BuildContext context, {
    required String verseText,
    required String tafsirText,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: MajlisColors.parchmentSoft,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => UserTafsirModal(
        verseText: verseText,
        tafsirText: tafsirText,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.55;
    return SizedBox(
      height: height,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 45,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.shade400,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: MajlisColors.brown.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                verseText,
                textAlign: TextAlign.center,
                textDirection: TextDirection.rtl,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  height: 1.8,
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'التفسير',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: MajlisColors.brown,
              ),
            ),
            const Divider(),
            Expanded(
              child: SingleChildScrollView(
                child: Text(
                  tafsirText,
                  textDirection: TextDirection.rtl,
                  style: const TextStyle(fontSize: 16, height: 1.8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
