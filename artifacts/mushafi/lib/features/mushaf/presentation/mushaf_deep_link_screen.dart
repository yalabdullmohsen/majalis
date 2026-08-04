import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/mushaf_providers.dart';
import 'mushaf_screen.dart';
import 'mushaf_design_tokens.dart';

/// يحوّل مسارات الموقع المشتركة (`/mushaf/:surah?ayah=`) إلى صفحة مصحف.
class MushafDeepLinkScreen extends ConsumerStatefulWidget {
  final int? surah;
  final int? ayah;
  final int? page;

  const MushafDeepLinkScreen({
    super.key,
    this.surah,
    this.ayah,
    this.page,
  });

  @override
  ConsumerState<MushafDeepLinkScreen> createState() =>
      _MushafDeepLinkScreenState();
}

class _MushafDeepLinkScreenState extends ConsumerState<MushafDeepLinkScreen> {
  int? _resolvedPage;

  @override
  void initState() {
    super.initState();
    _resolve();
  }

  Future<void> _resolve() async {
    final explicitPage = widget.page;
    if (explicitPage != null && explicitPage >= 1 && explicitPage <= 604) {
      setState(() => _resolvedPage = explicitPage);
      return;
    }

    final surah = widget.surah;
    if (surah == null || surah < 1 || surah > 114) {
      setState(() {
        _resolvedPage = 1;
      });
      return;
    }

    final ayah = (widget.ayah ?? 1).clamp(1, 286);
    try {
      final meta = await ref
          .read(quranPageMetadataRepositoryProvider)
          .findPageForAyah(surah: surah, ayah: ayah);
      if (!mounted) return;
      setState(() {
        _resolvedPage = meta?.pageNumber ?? 1;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _resolvedPage = 1;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final page = _resolvedPage;
    if (page == null) {
      return const Scaffold(
        backgroundColor: MushafColors.background,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return MushafScreen(
      initialPage: page,
      initialHighlightedSurah: widget.surah,
      initialHighlightedAyah: widget.ayah,
    );
  }
}
