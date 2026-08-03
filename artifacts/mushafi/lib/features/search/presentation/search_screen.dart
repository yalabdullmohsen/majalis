import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  List<dynamic> _hits = const [];

  Future<void> _run(String q) async {
    final repo = ref.read(quranRepositoryProvider);
    final hits = await repo.search(q);
    setState(() => _hits = hits);
  }

  @override
  Widget build(BuildContext context) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    return Scaffold(
      backgroundColor: colors.scaffold,
      appBar: AppBar(title: const Text('بحث في القرآن')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _controller,
              textDirection: TextDirection.rtl,
              decoration: const InputDecoration(
                hintText: 'ابحث بدون تشكيل...',
                border: OutlineInputBorder(),
              ),
              onChanged: _run,
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.separated(
                itemCount: _hits.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, i) {
                  final a = _hits[i];
                  return ListTile(
                    title: Text(
                      a.textUthmani,
                      textDirection: TextDirection.rtl,
                      style: const TextStyle(fontFamily: 'MushafiQuran', fontSize: 18),
                    ),
                    subtitle: Text('${a.surahId}:${a.ayahNumber} — ص ${a.pageNumber}'),
                    onTap: () => context.go('/mushaf?page=${a.pageNumber}'),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
