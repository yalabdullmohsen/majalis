import 'package:flutter/material.dart';

class Tasmee3NotificationsInfoScreen extends StatelessWidget {
  const Tasmee3NotificationsInfoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('تذكيرات التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: const [
            _InfoCard(
              title: 'لماذا التذكير؟',
              body:
                  'التذكير يساعدك على بناء عادة يومية بسيطة. جلسة قصيرة منتظمة أفضل من انقطاع طويل.',
            ),
            _InfoCard(
              title: 'متى تظهر الإشعارات؟',
              body:
                  'تظهر الإشعارات حسب الوقت الذي تحدده في إعدادات هدف التسميع.',
            ),
            _InfoCard(
              title: 'هل ترسل الإشعارات بيانات للخارج؟',
              body:
                  'لا. التذكير المحلي يتم على جهازك ولا يحتاج إرسال أي صوت أو نص إلى خادم.',
            ),
            _InfoCard(
              title: 'كيف أوقف التذكير؟',
              body:
                  'افتح إعدادات هدف التسميع ثم أوقف خيار التذكير اليومي.',
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final String body;

  const _InfoCard({
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0C5A3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF11100E),
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: const TextStyle(
              color: Color(0xFF11100E),
              height: 1.7,
            ),
          ),
        ],
      ),
    );
  }
}
