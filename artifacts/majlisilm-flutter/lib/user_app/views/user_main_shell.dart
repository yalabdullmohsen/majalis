import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../shared/constants/majlis_constants.dart';
import '../../shared/theme/majlis_colors.dart';
import '../controllers/user_quran_app_controller.dart';
import 'user_educational_paths_view.dart';
import 'user_quran_reader_view.dart';

/// Bottom nav shell — headers live inside each tab as floating SliverAppBars.
class UserMainShell extends StatefulWidget {
  const UserMainShell({super.key});

  @override
  State<UserMainShell> createState() => _UserMainShellState();
}

class _UserMainShellState extends State<UserMainShell> {
  int _tab = 0;

  Future<void> _openSearch(BuildContext context) async {
    final quran = context.read<UserQuranAppController>();
    await showSearch<void>(
      context: context,
      delegate: _UserSmartSearchDelegate(
        onSelectVerseIndex: (i) {
          quran.selectVerse(i);
          setState(() => _tab = 0);
        },
      ),
    );
  }

  void _openSettings(BuildContext context) {
    Scaffold.of(context).openEndDrawer();
  }

  @override
  Widget build(BuildContext context) {
    final quran = context.watch<UserQuranAppController>();

    return Scaffold(
      backgroundColor: quran.backgroundColor,
      endDrawer: _UserPrefsDrawer(quran: quran),
      body: Builder(
        builder: (bodyContext) {
          return IndexedStack(
            index: _tab,
            children: [
              UserQuranReaderView(
                title: 'المصحف الشريف',
                onSearch: () => _openSearch(bodyContext),
                onOpenSettings: () => _openSettings(bodyContext),
              ),
              UserEducationalPathsView(
                title: 'المسارات والأذكار',
                onSearch: () => _openSearch(bodyContext),
                onOpenSettings: () => _openSettings(bodyContext),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        backgroundColor: quran.backgroundColor,
        indicatorColor: MajlisColors.brown.withValues(alpha: 0.2),
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.menu_book_outlined),
            selectedIcon: Icon(Icons.menu_book_rounded),
            label: 'المصحف',
          ),
          NavigationDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school_rounded),
            label: 'المسارات',
          ),
        ],
      ),
    );
  }
}

class _UserPrefsDrawer extends StatelessWidget {
  const _UserPrefsDrawer({required this.quran});

  final UserQuranAppController quran;

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'إعدادات القراءة',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 24),
              Text('حجم الخط: ${quran.fontSize.round()}'),
              Slider(
                value: quran.fontSize,
                min: MajlisConstants.fontMin,
                max: MajlisConstants.fontMax,
                divisions: (MajlisConstants.fontMax - MajlisConstants.fontMin)
                    .round(),
                activeColor: MajlisColors.brown,
                onChanged: quran.updateFontSize,
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('الوضع الداكن'),
                value: quran.isDarkMode,
                activeThumbColor: MajlisColors.brown,
                onChanged: quran.toggleTheme,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _UserSmartSearchDelegate extends SearchDelegate<void> {
  _UserSmartSearchDelegate({required this.onSelectVerseIndex});

  final ValueChanged<int> onSelectVerseIndex;

  static const _filters = ['الكل', 'قرآن', 'فقه', 'سيرة', 'حديث'];
  String _chip = 'الكل';

  static const _db = <_SearchHit>[
    _SearchHit('قرآن', 'الفاتحة ١', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 0),
    _SearchHit('فقه', 'نية الصلاة', 'النية شرط في العبادات', null),
    _SearchHit('سيرة', 'غزوة بدر', 'أول مواجهة كبرى مع قريش', null),
    _SearchHit('حديث', 'إنما الأعمال بالنيات', 'متفق عليه', null),
  ];

  @override
  String get searchFieldLabel => 'بحث في المجلس…';

  @override
  List<Widget>? buildActions(BuildContext context) => [
        if (query.isNotEmpty)
          IconButton(
            onPressed: () => query = '',
            icon: const Icon(Icons.clear),
          ),
      ];

  @override
  Widget? buildLeading(BuildContext context) => IconButton(
        onPressed: () => close(context, null),
        icon: const Icon(Icons.arrow_back),
      );

  @override
  Widget buildResults(BuildContext context) => _buildBody(context);

  @override
  Widget buildSuggestions(BuildContext context) => _buildBody(context);

  Widget _buildBody(BuildContext context) {
    final q = query.trim();
    final filtered = _db.where((h) {
      final chipOk = _chip == 'الكل' || h.category == _chip;
      final textOk = q.isEmpty ||
          h.title.contains(q) ||
          h.subtitle.contains(q) ||
          h.category.contains(q);
      return chipOk && textOk;
    }).toList();

    return Column(
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: _filters.map((f) {
              final on = _chip == f;
              return Padding(
                padding: const EdgeInsetsDirectional.only(end: 8),
                child: ChoiceChip(
                  label: Text(f),
                  selected: on,
                  onSelected: (_) {
                    _chip = f;
                    final current = query;
                    query = '$current ';
                    query = current;
                  },
                ),
              );
            }).toList(),
          ),
        ),
        Expanded(
          child: filtered.isEmpty
              ? const Center(child: Text('لا نتائج'))
              : ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (context, i) {
                    final hit = filtered[i];
                    return ListTile(
                      leading: const Icon(Icons.search),
                      title: Text(hit.title),
                      subtitle: Text('${hit.category} — ${hit.subtitle}'),
                      onTap: () {
                        if (hit.verseIndex != null) {
                          onSelectVerseIndex(hit.verseIndex!);
                        }
                        close(context, null);
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _SearchHit {
  const _SearchHit(this.category, this.title, this.subtitle, this.verseIndex);
  final String category;
  final String title;
  final String subtitle;
  final int? verseIndex;
}
