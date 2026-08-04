import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/core/constants/app_constants.dart';
import 'package:mushafi/core/theme/app_theme.dart';
import 'package:mushafi/features/mushaf/presentation/mushaf_bookmarks_screen.dart';
import 'package:mushafi/features/mushaf/presentation/mushaf_home_screen.dart';
import 'package:mushafi/features/mushaf/presentation/mushaf_index_screen.dart';
import 'package:mushafi/features/mushaf/presentation/mushaf_khatmah_screen.dart';
import 'package:mushafi/features/mushaf/presentation/mushaf_screen.dart';
import 'package:mushafi/features/mushaf/presentation/mushaf_search_screen.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';
import 'package:mushafi/features/quran/presentation/screens/home_shell.dart';
import 'package:mushafi/features/settings/presentation/settings_screen.dart';
import 'package:mushafi/features/tasmee3/presentation/tasmee3_entry_screen.dart';

final _routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const HomeShell()),
      GoRoute(
        path: '/mushaf-home',
        builder: (_, __) => const MushafHomeScreen(),
      ),
      GoRoute(
        path: '/mushaf',
        builder: (context, state) {
          final page = int.tryParse(state.uri.queryParameters['page'] ?? '');
          return MushafScreen(initialPage: page ?? 1);
        },
      ),
      // Legacy paths → new mushaf / tasmee3 only.
      GoRoute(
        path: '/search',
        builder: (_, __) => const MushafSearchScreen(),
      ),
      GoRoute(
        path: '/surahs',
        builder: (_, __) => const MushafIndexScreen(),
      ),
      GoRoute(
        path: '/juz',
        redirect: (_, __) => '/mushaf-home',
      ),
      GoRoute(
        path: '/bookmarks',
        builder: (_, __) => const MushafBookmarksScreen(),
      ),
      GoRoute(
        path: '/khatmah',
        builder: (_, __) => const MushafKhatmahScreen(),
      ),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      GoRoute(
        path: '/tasmee3',
        builder: (_, __) => const Tasmee3EntryScreen(),
      ),
      GoRoute(
        path: '/tasmee3-dashboard',
        redirect: (_, __) => '/tasmee3',
      ),
      // Old AI/recitation aliases → new tasmee3 only.
      GoRoute(
        path: '/ai-recitation',
        redirect: (_, __) => '/tasmee3',
      ),
      GoRoute(
        path: '/old-mushaf',
        redirect: (_, __) => '/mushaf-home',
      ),
      GoRoute(
        path: '/tafsir',
        builder: (_, __) => const Scaffold(
          body: Center(
            child: Text(
              'التفسير: أضف ملفات مصدر موثّق في assets ثم اربط TafsirRepository.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
      GoRoute(
        path: '/notes/new',
        builder: (_, state) => Scaffold(
          appBar: AppBar(title: const Text('ملاحظة')),
          body: Center(child: Text('آية: ${state.extra ?? ''}')),
        ),
      ),
    ],
  );
});

class MushafiApp extends ConsumerWidget {
  const MushafiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(_routerProvider);
    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.of(themeMode),
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        );
      },
      routerConfig: router,
    );
  }
}
