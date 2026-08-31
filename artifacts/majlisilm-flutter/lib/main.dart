import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'shared/shared.dart';
import 'user_app/user_app.dart';

/// Phase 1 entry — UserApp only. AdminPanel arrives in Phase 2.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  await SystemChrome.setPreferredOrientations(const [
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  final audio = UserAudioPlayerService();
  final quranController = UserQuranAppController();
  final eduController = UserEducationalProgressController();
  audio.onCompleted = quranController.stopAudio;

  runApp(
    MajlisIlmUserApp(
      audio: audio,
      quranController: quranController,
      eduController: eduController,
    ),
  );
}

class MajlisIlmUserApp extends StatelessWidget {
  const MajlisIlmUserApp({
    super.key,
    required this.audio,
    required this.quranController,
    required this.eduController,
  });

  final UserAudioPlayerService audio;
  final UserQuranAppController quranController;
  final UserEducationalProgressController eduController;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<UserAudioPlayerService>.value(value: audio),
        ChangeNotifierProvider<UserQuranAppController>.value(
          value: quranController,
        ),
        ChangeNotifierProvider<UserEducationalProgressController>.value(
          value: eduController,
        ),
      ],
      child: Consumer<UserQuranAppController>(
        builder: (context, quran, _) {
          return MaterialApp(
            title: 'سُنّة',
            debugShowCheckedModeBanner: false,
            locale: const Locale('ar'),
            builder: (context, child) => Directionality(
              textDirection: TextDirection.rtl,
              child: child ?? const SizedBox.shrink(),
            ),
            theme: MajlisTheme.light(),
            darkTheme: MajlisTheme.dark(),
            themeMode: quran.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            home: const UserMainShell(),
          );
        },
      ),
    );
  }
}
