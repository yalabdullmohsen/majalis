import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/bookmarks/data/bookmark_repository.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

class BookmarksScreen extends ConsumerWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    final items = ref.watch(bookmarkRepositoryProvider).list();
    return Scaffold(
      backgroundColor: colors.scaffold,
      appBar: AppBar(title: const Text('المفضلة')),
      body: items.isEmpty
          ? const Center(child: Text('لا مفضلات بعد'))
          : ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, i) {
                final b = items[i];
                return ListTile(
                  leading: Icon(Icons.bookmark, color: Color(b.color)),
                  title: Text(b.title),
                  subtitle: Text('${b.ayahKey} — ص ${b.pageNumber}'),
                  onTap: () => context.go('/mushaf?page=${b.pageNumber}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () async {
                      await ref.read(bookmarkRepositoryProvider).remove(b.id);
                      (context as Element).markNeedsBuild();
                    },
                  ),
                );
              },
            ),
    );
  }
}
