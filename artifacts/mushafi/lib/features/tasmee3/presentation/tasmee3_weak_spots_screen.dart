import 'package:flutter/material.dart';

import '../domain/tasmee3_weak_spot.dart';
import 'widgets/tasmee3_empty_state.dart';

class Tasmee3WeakSpotsScreen extends StatelessWidget {
  final List<Tasmee3WeakSpot> weakSpots;

  const Tasmee3WeakSpotsScreen({
    super.key,
    required this.weakSpots,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('مواضع تحتاج مراجعة'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: weakSpots.isEmpty
            ? const Tasmee3EmptyState(
                icon: Icons.check_circle_outline,
                title: 'لا مواضع ظاهرة للمراجعة',
                message:
                    'لم تظهر مواضع تحتاج مراجعة في هذه الجلسة. استمر على نفس الهدوء.',
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: weakSpots.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final spot = weakSpots[index];

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFCF7),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: _borderColor(spot)),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: _color(spot).withValues(alpha: 0.12),
                          child: Icon(
                            _icon(spot),
                            color: _color(spot),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                spot.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: Color(0xFF11100E),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'سورة ${spot.ayahRef.surah} - آية ${spot.ayahRef.ayah}',
                                style: const TextStyle(
                                  color: Color(0xFF9A8068),
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                spot.description,
                                style: const TextStyle(
                                  color: Color(0xFF11100E),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }

  IconData _icon(Tasmee3WeakSpot spot) {
    switch (spot.type) {
      case WeakSpotType.repeatedMistake:
        return Icons.error_outline;
      case WeakSpotType.lowAccuracy:
        return Icons.trending_down;
      case WeakSpotType.missingWords:
        return Icons.remove_circle_outline;
      case WeakSpotType.lowConfidence:
        return Icons.hearing_disabled_outlined;
    }
  }

  Color _color(Tasmee3WeakSpot spot) {
    if (spot.severity >= 3) return Colors.red.shade700;
    if (spot.severity == 2) return Colors.orange.shade800;
    return Colors.blueGrey.shade700;
  }

  Color _borderColor(Tasmee3WeakSpot spot) {
    return _color(spot).withValues(alpha: 0.25);
  }
}
