import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../application/tasmee3_controller.dart';
import '../application/tasmee3_providers.dart';
import '../data/surah_catalog.dart';
import '../domain/asr_engine_mode.dart';
import '../domain/ayah_ref.dart';
import '../domain/recitation_target.dart';
import '../domain/surah_info.dart';
import '../domain/tasmee3_mistake.dart';
import '../domain/tasmee3_text_visibility_mode.dart';
import '../domain/tasmee3_voice_command.dart';
import 'tasmee3_asr_settings_screen.dart';
import 'tasmee3_dashboard_screen.dart';
import 'tasmee3_history_screen.dart';
import 'tasmee3_limitations_screen.dart';
import 'tasmee3_mistake_training_screen.dart';
import 'tasmee3_privacy_screen.dart';
import 'tasmee3_report_preview_screen.dart';
import 'tasmee3_weak_spots_screen.dart';
import 'widgets/tasmee3_accuracy_card.dart';
import 'widgets/tasmee3_audio_level_meter.dart';
import 'widgets/tasmee3_ayah_scores_card.dart';
import 'widgets/tasmee3_live_ayah_progress_card.dart';
import 'widgets/tasmee3_live_progress_card.dart';
import 'widgets/tasmee3_mistake_report_sheet.dart';
import 'widgets/tasmee3_mushaf_recitation_view.dart';
import 'widgets/tasmee3_section_card.dart';
import 'widgets/tasmee3_visibility_mode_sheet.dart';

class Tasmee3Screen extends ConsumerStatefulWidget {
  final RecitationTarget? initialTarget;
  final bool startInHifzMode;
  final bool showExpectedTextFirst;

  const Tasmee3Screen({
    super.key,
    this.initialTarget,
    this.startInHifzMode = false,
    this.showExpectedTextFirst = false,
  });

  @override
  ConsumerState<Tasmee3Screen> createState() => _Tasmee3ScreenState();
}

class _Tasmee3ScreenState extends ConsumerState<Tasmee3Screen> {
  int surah = 112;
  int fromAyah = 1;
  int toAyah = 3;
  Tasmee3Mode mode = Tasmee3Mode.showText;
  Tasmee3TextVisibilityMode textVisibilityMode =
      Tasmee3TextVisibilityMode.showAll;
  bool forceRevealAll = false;

  @override
  void initState() {
    super.initState();

    final target = widget.initialTarget;

    if (target != null) {
      surah = target.from.surah;
      fromAyah = target.from.ayah;
      toAyah = target.to.ayah;
      mode = widget.startInHifzMode ? Tasmee3Mode.hifzTest : target.mode;
    }

    if (widget.startInHifzMode) {
      textVisibilityMode = Tasmee3TextVisibilityMode.hifzTest;
    } else {
      textVisibilityMode = _visibilityFromMode(mode);
    }

    if (widget.showExpectedTextFirst) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showExpectedTextSheet();
      });
    }
  }

  Tasmee3TextVisibilityMode _visibilityFromMode(Tasmee3Mode value) {
    switch (value) {
      case Tasmee3Mode.showText:
        return Tasmee3TextVisibilityMode.showAll;
      case Tasmee3Mode.hideText:
        return Tasmee3TextVisibilityMode.hideAll;
      case Tasmee3Mode.firstWordOnly:
        return Tasmee3TextVisibilityMode.firstWordOnly;
      case Tasmee3Mode.hifzTest:
        return Tasmee3TextVisibilityMode.hifzTest;
    }
  }

  void _openVisibilityModeSheet() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: const Color(0xFFFFFCF7),
      builder: (_) {
        return Tasmee3VisibilityModeSheet(
          currentMode: textVisibilityMode,
          onSelected: (selected) {
            setState(() {
              textVisibilityMode = selected;
              forceRevealAll = false;
            });
          },
        );
      },
    );
  }

  Future<void> _showExpectedTextSheet() async {
    final repository = ref.read(quranRepositoryProvider);

    final target = RecitationTarget(
      from: AyahRef(surah: surah, ayah: fromAyah),
      to: AyahRef(surah: surah, ayah: toAyah),
      mode: mode,
    );

    try {
      final ayahs = await repository.getAyahsInTarget(target);

      if (!mounted) return;

      await showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        isScrollControlled: true,
        backgroundColor: const Color(0xFFFFFCF7),
        builder: (sheetContext) {
          final maxHeight = MediaQuery.of(sheetContext).size.height * 0.55;

          return Directionality(
            textDirection: TextDirection.rtl,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: SizedBox(
                  height: maxHeight,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'النص المتوقع للتسميع',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF11100E),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: SingleChildScrollView(
                          child: Text(
                            ayahs.map((ayah) => ayah.textUthmani).join('  '),
                            textAlign: TextAlign.right,
                            style: const TextStyle(
                              fontSize: 24,
                              height: 1.9,
                              color: Color(0xFF11100E),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFA77A48),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: () => Navigator.pop(sheetContext),
                        icon: const Icon(Icons.check),
                        label: const Text('جاهز للتسميع'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('تعذر عرض النص المتوقع: $e'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tasmee3ControllerProvider);
    final controller = ref.read(tasmee3ControllerProvider.notifier);
    final selectedSurah = SurahCatalog.byId(surah);

    ref.listen(tasmee3ControllerProvider, (previous, next) {
      final command = next.lastVoiceCommand;

      if (command != null &&
          previous?.lastVoiceCommand?.detectedAt != command.detectedAt) {
        if (command.type == Tasmee3VoiceCommandType.reveal) {
          setState(() {
            forceRevealAll = true;
          });
        } else if (command.type == Tasmee3VoiceCommandType.hide) {
          setState(() {
            forceRevealAll = false;
          });
        } else if (command.type == Tasmee3VoiceCommandType.repeat) {
          _showExpectedTextSheet();
        }
      }

      if (previous?.status != Tasmee3Status.completed &&
          next.status == Tasmee3Status.completed) {
        ref.invalidate(tasmee3SessionHistoryProvider);
        ref.invalidate(tasmee3TodayGoalProgressProvider);
        ref.invalidate(tasmee3StreakProvider);
        ref.invalidate(tasmee3BadgesProvider);
        ref.invalidate(tasmee3Last7DaysStatsProvider);
        ref.invalidate(tasmee3ReviewPlanProvider);
        ref.invalidate(tasmee3AchievementsProvider);
        ref.invalidate(ayahMasteryRecordsProvider);
        ref.invalidate(tasmee3TodayReviewSuggestionsProvider);
        ref.invalidate(tasmee3NextRangeSuggestionProvider);
      }
    });

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
          actions: [
            IconButton(
              tooltip: 'حدود التسميع',
              icon: const Icon(Icons.info_outline),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const Tasmee3LimitationsScreen(),
                  ),
                );
              },
            ),
            IconButton(
              tooltip: 'لوحة التسميع',
              icon: const Icon(Icons.dashboard_outlined),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const Tasmee3DashboardScreen(),
                  ),
                );
              },
            ),
            IconButton(
              tooltip: 'خصوصية التسميع',
              icon: const Icon(Icons.privacy_tip_outlined),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const Tasmee3PrivacyScreen(),
                  ),
                );
              },
            ),
            IconButton(
              tooltip: 'إعدادات التسميع',
              icon: const Icon(Icons.settings),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const Tasmee3AsrSettingsScreen(),
                  ),
                );
              },
            ),
            IconButton(
              tooltip: 'سجل التسميع',
              icon: const Icon(Icons.history),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const Tasmee3HistoryScreen(),
                  ),
                );
              },
            ),
          ],
        ),
        body: Column(
          children: [
            _targetCard(state, selectedSurah),
            Expanded(child: _content(state)),
            _controls(state, controller),
          ],
        ),
      ),
    );
  }

  Widget _targetCard(Tasmee3State state, SurahInfo selectedSurah) {
    final disabled = state.status == Tasmee3Status.listening;
    final safeToAyah = toAyah.clamp(1, selectedSurah.ayahCount);
    final safeFromAyah = fromAyah.clamp(1, selectedSurah.ayahCount);

    return Tasmee3SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'اختر نطاق التسميع',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.bold,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<int>(
            value: surah,
            decoration: const InputDecoration(
              labelText: 'السورة',
              border: OutlineInputBorder(),
            ),
            items: SurahCatalog.all.map((item) {
              return DropdownMenuItem<int>(
                value: item.id,
                child: Text('${item.id}. ${item.nameArabic}'),
              );
            }).toList(),
            onChanged: disabled
                ? null
                : (value) {
                    if (value == null) return;

                    final info = SurahCatalog.byId(value);

                    setState(() {
                      surah = value;
                      fromAyah = 1;
                      toAyah = info.ayahCount >= 3 ? 3 : info.ayahCount;
                    });
                  },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: safeFromAyah,
                  decoration: const InputDecoration(
                    labelText: 'من آية',
                    border: OutlineInputBorder(),
                  ),
                  items: List.generate(selectedSurah.ayahCount, (index) {
                    final ayah = index + 1;
                    return DropdownMenuItem<int>(
                      value: ayah,
                      child: Text('$ayah'),
                    );
                  }),
                  onChanged: disabled
                      ? null
                      : (value) {
                          if (value == null) return;

                          setState(() {
                            fromAyah = value;
                            if (toAyah < fromAyah) {
                              toAyah = fromAyah;
                            }
                          });
                        },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: safeToAyah,
                  decoration: const InputDecoration(
                    labelText: 'إلى آية',
                    border: OutlineInputBorder(),
                  ),
                  items: List.generate(selectedSurah.ayahCount, (index) {
                    final ayah = index + 1;
                    return DropdownMenuItem<int>(
                      value: ayah,
                      child: Text('$ayah'),
                    );
                  }),
                  onChanged: disabled
                      ? null
                      : (value) {
                          if (value == null) return;

                          setState(() {
                            toAyah = value;
                            if (fromAyah > toAyah) {
                              fromAyah = toAyah;
                            }
                          });
                        },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<Tasmee3Mode>(
            value: mode,
            decoration: const InputDecoration(
              labelText: 'وضع التسميع',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(
                value: Tasmee3Mode.showText,
                child: Text('عرض النص'),
              ),
              DropdownMenuItem(
                value: Tasmee3Mode.hideText,
                child: Text('إخفاء النص'),
              ),
              DropdownMenuItem(
                value: Tasmee3Mode.firstWordOnly,
                child: Text('أول كلمة فقط'),
              ),
              DropdownMenuItem(
                value: Tasmee3Mode.hifzTest,
                child: Text('اختبار حفظ كامل'),
              ),
            ],
            onChanged: disabled
                ? null
                : (value) {
                    if (value != null) {
                      setState(() {
                        mode = value;
                        textVisibilityMode = _visibilityFromMode(value);
                        forceRevealAll = false;
                      });
                    }
                  },
          ),
          const SizedBox(height: 10),
          Text(
            ref.watch(tasmee3UserAsrSettingsProvider).maybeWhen(
                  data: (settings) {
                    if (settings.mode == AsrEngineMode.deviceFallback) {
                      return 'محرك تعرف الجهاز مفعّل.';
                    }
                    if (settings.canUseAdvancedServer) {
                      return 'الخادم المتقدم جاهز (endpoint + إذن الإرسال).';
                    }
                    return 'الخادم المتقدم غير جاهز؛ يعمل التطبيق بوضع تعرف الجهاز.';
                  },
                  orElse: () =>
                      'محرك التسميع غير مضبوط؛ يعمل التطبيق بوضع تعرف الجهاز.',
                ),
            style: const TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'للحصول على دقة تقريبية أفضل، ابدأ بنطاق قصير واقرأ في مكان هادئ. النتائج مساعدة تقنية وليست حكما شرعيا.',
            style: TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 13,
            ),
          ),
          if ((toAyah - fromAyah + 1) > 5) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF3E0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: const Text(
                'النطاق طويل. للحصول على دقة تقريبية أفضل، جرّب 1 إلى 5 آيات في كل جلسة.',
                style: TextStyle(
                  color: Color(0xFFE65100),
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ),
          ],
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: disabled ? null : _showExpectedTextSheet,
            icon: const Icon(Icons.menu_book_outlined),
            label: const Text('عرض النص المتوقع'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: disabled ? null : _openVisibilityModeSheet,
            icon: const Icon(Icons.visibility_outlined),
            label: Text(textVisibilityMode.arabicLabel),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: disabled
                ? null
                : () {
                    setState(() {
                      forceRevealAll = !forceRevealAll;
                    });
                  },
            icon: Icon(forceRevealAll ? Icons.visibility_off : Icons.visibility),
            label: Text(forceRevealAll ? 'إخفاء النص' : 'إظهار النص'),
          ),
        ],
      ),
    );
  }

  Widget _content(Tasmee3State state) {
    switch (state.status) {
      case Tasmee3Status.idle:
        final idleMessage = mode == Tasmee3Mode.hifzTest
            ? 'أنت في وضع اختبار الحفظ. يمكنك عرض النص للمراجعة ثم بدء التسميع.'
            : 'اختر السورة ونطاق الآيات ثم اضغط بدء التسميع.';

        return Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              idleMessage,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                color: Color(0xFF9A8068),
              ),
            ),
          ),
        );

      case Tasmee3Status.requestingPermission:
        return const Center(child: Text('جاري طلب صلاحية الميكروفون...'));

      case Tasmee3Status.loadingQuran:
        return const Center(child: Text('جاري تحميل الآيات...'));

      case Tasmee3Status.listening:
        return _listeningContent(state);

      case Tasmee3Status.uploadingAudio:
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text(
                  'جاري رفع الصوت وتحليله...',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    color: Color(0xFF9A8068),
                  ),
                ),
              ],
            ),
          ),
        );

      case Tasmee3Status.analyzing:
        return const Center(child: CircularProgressIndicator());

      case Tasmee3Status.completed:
        return _resultContent(state);

      case Tasmee3Status.error:
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFCF7),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: Colors.red.withValues(alpha: 0.25),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.error_outline,
                    color: Colors.red.shade700,
                    size: 42,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    state.errorMessage ?? 'حدث خطأ',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 17,
                      color: Color(0xFF11100E),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () {
                      ref.read(tasmee3ControllerProvider.notifier).reset();
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('حاول مرة أخرى'),
                  ),
                ],
              ),
            ),
          ),
        );
    }
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  String _voiceCommandLabel(Tasmee3VoiceCommandType type) {
    switch (type) {
      case Tasmee3VoiceCommandType.repeat:
        return 'أعد';
      case Tasmee3VoiceCommandType.next:
        return 'التالي';
      case Tasmee3VoiceCommandType.reveal:
        return 'أظهر';
      case Tasmee3VoiceCommandType.hide:
        return 'أخف';
      case Tasmee3VoiceCommandType.stop:
        return 'توقف';
      case Tasmee3VoiceCommandType.unknown:
        return '';
    }
  }

  Widget _listeningContent(Tasmee3State state) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFA77A48).withValues(alpha: 0.12),
              border: Border.all(
                color: const Color(0xFFA77A48).withValues(alpha: 0.35),
              ),
            ),
            child: const Icon(
              Icons.mic,
              size: 50,
              color: Color(0xFFA77A48),
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'أستمع الآن...',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'سيتم تمييز الكلمات أثناء التلاوة حسب ما يتعرف عليه النظام.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'المدة: ${state.elapsedSeconds} ثانية',
            style: const TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 12),
          Tasmee3AudioLevelMeter(level: state.audioLevel),
          const SizedBox(height: 10),
          Tasmee3LiveProgressCard(progress: state.liveProgress),
          const SizedBox(height: 10),
          Tasmee3LiveAyahProgressCard(
            ayahProgress: state.liveProgress.ayahProgress,
          ),
          if (state.lastVoiceCommand != null &&
              state.lastVoiceCommand!.type !=
                  Tasmee3VoiceCommandType.unknown) ...[
            const SizedBox(height: 8),
            Text(
              'تم رصد أمر صوتي: ${_voiceCommandLabel(state.lastVoiceCommand!.type)}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFFA77A48),
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
          const SizedBox(height: 8),
          const Text(
            'تجنب الضوضاء، واقرأ النطاق المختار فقط دون زيادة.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _formatDuration(state.sessionDuration),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFFA77A48),
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'اقرأ بهدوء ووضوح. عند الانتهاء اضغط إيقاف وتحليل.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF9A8068)),
          ),
          const SizedBox(height: 18),
          Expanded(
            child: state.expectedAyahs.isNotEmpty
                ? Tasmee3MushafRecitationView(
                    ayahs: state.expectedAyahs,
                    mistakes: const [],
                    visibilityMode: textVisibilityMode,
                    forceRevealAll: forceRevealAll,
                    displayBuilder: ref.watch(tasmee3DisplayBuilderProvider),
                    liveProgress: state.liveProgress,
                  )
                : Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFCF7),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE0C5A3)),
                    ),
                    child: SingleChildScrollView(
                      child: Text(
                        state.recognizedText.isEmpty
                            ? 'سيظهر النص المتعرف عليه هنا...'
                            : state.recognizedText,
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          fontSize: 24,
                          height: 1.8,
                          color: state.recognizedText.isEmpty
                              ? const Color(0xFF9A8068)
                              : const Color(0xFF11100E),
                        ),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _resultContent(Tasmee3State state) {
    final result = state.result;

    if (result == null) {
      return const Center(child: Text('لا توجد نتيجة'));
    }

    final mistakesByIndex = <int, Tasmee3Mistake>{};

    for (final mistake in result.mistakes) {
      if (mistake.type == Tasmee3MistakeType.wrongWord ||
          mistake.type == Tasmee3MistakeType.missingWord ||
          mistake.type == Tasmee3MistakeType.lowConfidence) {
        mistakesByIndex[mistake.globalWordIndex] = mistake;
      }
    }

    final displayBuilder = ref.watch(tasmee3DisplayBuilderProvider);
    final expectedAyahs = state.expectedAyahs;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Tasmee3AccuracyCard(result: result),
          const SizedBox(height: 8),
          const Text(
            'الألوان: الأحمر خطأ، البرتقالي ناقص، الأزرق ثقة منخفضة.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 13,
            ),
          ),
          if (state.alignment?.ayahScores.isNotEmpty == true) ...[
            const SizedBox(height: 10),
            Tasmee3AyahScoresCard(scores: state.alignment!.ayahScores),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFA77A48),
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () {
                    ref.read(tasmee3ControllerProvider.notifier).start(
                          RecitationTarget(
                            from: AyahRef(surah: surah, ayah: fromAyah),
                            to: AyahRef(surah: surah, ayah: toAyah),
                            mode: mode,
                          ),
                        );
                  },
                  icon: const Icon(Icons.replay),
                  label: const Text('إعادة نفس النطاق'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      showDragHandle: true,
                      backgroundColor: const Color(0xFFFFFCF7),
                      builder: (_) =>
                          Tasmee3MistakeReportSheet(result: result),
                    );
                  },
                  icon: const Icon(Icons.analytics_outlined),
                  label: const Text('تقرير الأخطاء الظاهرة'),
                ),
              ),
            ],
          ),
          if (result.mistakesCount > 0) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => Tasmee3MistakeTrainingScreen(
                            mistakes: result.mistakes,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.fitness_center),
                    label: const Text('درّبني على المواضع الظاهرة'),
                  ),
                ),
              ],
            ),
          ],
          if (state.alignment?.weakSpots.isNotEmpty == true) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => Tasmee3WeakSpotsScreen(
                            weakSpots: state.alignment!.weakSpots,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.warning_amber_rounded),
                    label: const Text('مواضع تحتاج مراجعة'),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final target = state.target;
                    final sessionResult = state.result;

                    if (target == null || sessionResult == null) return;

                    final builder =
                        ref.read(tasmee3SessionReportBuilderProvider);

                    final report = builder.buildTextReport(
                      target: target,
                      result: sessionResult,
                      durationSeconds: state.elapsedSeconds,
                    );

                    final messenger = ScaffoldMessenger.of(context);

                    await Clipboard.setData(ClipboardData(text: report));

                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('تم نسخ تقرير الجلسة.'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.copy),
                  label: const Text('نسخ تقرير الجلسة'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final target = state.target;
                    final sessionResult = state.result;

                    if (target == null || sessionResult == null) return;

                    final navigator = Navigator.of(context);
                    final textBuilder =
                        ref.read(tasmee3SessionReportBuilderProvider);
                    final pdfService =
                        ref.read(tasmee3PdfReportServiceProvider);

                    final reportText = textBuilder.buildTextReport(
                      target: target,
                      result: sessionResult,
                      durationSeconds: state.elapsedSeconds,
                    );

                    String? pdfPath;

                    try {
                      final pdfFile = await pdfService.buildSessionPdf(
                        target: target,
                        result: sessionResult,
                        durationSeconds: state.elapsedSeconds,
                      );

                      pdfPath = pdfFile.path;
                    } catch (_) {}

                    await navigator.push(
                      MaterialPageRoute(
                        builder: (_) => Tasmee3ReportPreviewScreen(
                          reportText: reportText,
                          pdfPath: pdfPath,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.preview_outlined),
                  label: const Text('معاينة التقرير'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final target = state.target;
                    final sessionResult = state.result;

                    if (target == null || sessionResult == null) return;

                    final messenger = ScaffoldMessenger.of(context);

                    try {
                      final service =
                          ref.read(tasmee3PdfReportServiceProvider);

                      final file = await service.buildSessionPdf(
                        target: target,
                        result: sessionResult,
                        durationSeconds: state.elapsedSeconds,
                      );

                      await Share.shareXFiles(
                        [XFile(file.path)],
                        text: 'تقرير جلسة التسميع',
                        subject: 'تقرير جلسة التسميع',
                      );
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('تعذر إنشاء تقرير PDF: $e'),
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.picture_as_pdf_outlined),
                  label: const Text('تصدير PDF'),
                ),
              ),
            ],
          ),
          if (state.diagnostics != null &&
              state.diagnostics!.notes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFCF7),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE0C5A3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'تشخيص الجلسة (محلي فقط)',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF11100E),
                    ),
                  ),
                  const SizedBox(height: 6),
                  for (final note in state.diagnostics!.notes)
                    Text(
                      '• $note',
                      style: const TextStyle(
                        color: Color(0xFF9A8068),
                        height: 1.4,
                      ),
                    ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Text(
              'الألوان توضح نتيجة مطابقة كل كلمة مع النص المتوقع.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF9A8068),
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: expectedAyahs.isNotEmpty
                ? Tasmee3MushafRecitationView(
                    ayahs: expectedAyahs,
                    mistakes: result.mistakes,
                    visibilityMode: textVisibilityMode,
                    forceRevealAll: forceRevealAll ||
                        state.status == Tasmee3Status.completed,
                    displayBuilder: displayBuilder,
                  )
                : SingleChildScrollView(
                    child: Wrap(
                      textDirection: TextDirection.rtl,
                      spacing: 8,
                      runSpacing: 10,
                      children: [
                        for (int i = 0; i < result.expectedWords.length; i++)
                          _wordChip(
                            word: result.expectedWords[i],
                            mistake: mistakesByIndex[i],
                          ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _wordChip({
    required String word,
    required Tasmee3Mistake? mistake,
  }) {
    final hasMistake = mistake != null;

    Color bg = Colors.green.withValues(alpha: 0.08);
    Color text = Colors.green.shade900;
    Color border = Colors.green.withValues(alpha: 0.25);

    if (hasMistake) {
      if (mistake.type == Tasmee3MistakeType.missingWord) {
        bg = Colors.orange.withValues(alpha: 0.12);
        text = Colors.orange.shade900;
        border = Colors.orange.withValues(alpha: 0.3);
      } else if (mistake.type == Tasmee3MistakeType.lowConfidence) {
        bg = Colors.blueGrey.withValues(alpha: 0.12);
        text = Colors.blueGrey.shade900;
        border = Colors.blueGrey.withValues(alpha: 0.3);
      } else {
        bg = Colors.red.withValues(alpha: 0.12);
        text = Colors.red.shade900;
        border = Colors.red.withValues(alpha: 0.3);
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Text(
        word,
        style: TextStyle(
          fontSize: 22,
          height: 1.4,
          color: text,
          fontWeight: hasMistake ? FontWeight.bold : FontWeight.w500,
        ),
      ),
    );
  }

  Widget _controls(
    Tasmee3State state,
    Tasmee3Controller controller,
  ) {
    final isListening = state.status == Tasmee3Status.listening;
    final isBusy = state.status == Tasmee3Status.requestingPermission ||
        state.status == Tasmee3Status.loadingQuran ||
        state.status == Tasmee3Status.uploadingAudio ||
        state.status == Tasmee3Status.analyzing;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: const BoxDecoration(
        color: Color(0xFFFFFCF7),
        border: Border(
          top: BorderSide(color: Color(0xFFE0C5A3)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    isListening ? Colors.red.shade700 : const Color(0xFFA77A48),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: isBusy
                  ? null
                  : () async {
                      if (isListening) {
                        controller.stop();
                      } else {
                        final ok = await _showRecordingPrivacyDialog();
                        if (!ok) return;

                        controller.start(
                          RecitationTarget(
                            from: AyahRef(surah: surah, ayah: fromAyah),
                            to: AyahRef(surah: surah, ayah: toAyah),
                            mode: mode,
                          ),
                        );
                      }
                    },
              icon: Icon(isListening ? Icons.stop : Icons.mic),
              label: Text(isListening ? 'إيقاف وتحليل' : 'بدء التسميع'),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            tooltip: 'إعادة ضبط',
            onPressed: isBusy ? null : controller.reset,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
    );
  }

  Future<bool> _showRecordingPrivacyDialog() async {
    final settings = await ref.read(tasmee3UserAsrSettingsProvider.future);

    if (!mounted) return false;

    final usesServer = settings.mode != AsrEngineMode.deviceFallback &&
        settings.canUseAdvancedServer;

    final message = usesServer
        ? 'سيتم استخدام الميكروفون لتسجيل تلاوتك، وقد يتم إرسال التسجيل إلى الخادم الذي ضبطته أنت لتحليل التسميع. تتم المقارنة مع النص القرآني الموجود داخل التطبيق، ولا يتم توليد القرآن بالذكاء الاصطناعي.'
        : 'سيتم استخدام الميكروفون لتسجيل تلاوتك وتحليلها داخل الجهاز قدر الإمكان. لن يتم إرسال التسجيل إلى الخادم لأن الإرسال غير مفعل.';

    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: const Text('تنبيه الخصوصية'),
            content: Text(message),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(dialogContext, false);
                  Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => const Tasmee3PrivacyScreen(),
                    ),
                  );
                },
                child: const Text('سياسة الخصوصية'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(dialogContext, false),
                child: const Text('إلغاء'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(dialogContext, true),
                child: const Text('موافق والبدء'),
              ),
            ],
          ),
        );
      },
    );

    return result ?? false;
  }
}
