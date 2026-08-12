import 'recitation_target.dart';
import 'tasmee3_launch_source.dart';

class Tasmee3LaunchConfig {
  final RecitationTarget? initialTarget;
  final Tasmee3LaunchSource source;
  final bool showSourceBanner;
  final bool returnToMushafAfterCompletion;

  const Tasmee3LaunchConfig({
    this.initialTarget,
    this.source = Tasmee3LaunchSource.dashboard,
    this.showSourceBanner = false,
    this.returnToMushafAfterCompletion = false,
  });

  const Tasmee3LaunchConfig.defaultConfig()
      : initialTarget = null,
        source = Tasmee3LaunchSource.dashboard,
        showSourceBanner = false,
        returnToMushafAfterCompletion = false;

  bool get hasInitialTarget => initialTarget != null;
}
