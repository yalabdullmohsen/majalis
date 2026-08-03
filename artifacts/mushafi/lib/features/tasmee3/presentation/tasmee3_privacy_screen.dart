import 'package:flutter/material.dart';

class Tasmee3PrivacyScreen extends StatelessWidget {
  const Tasmee3PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('خصوصية التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: const [
            _PrivacyCard(
              title: 'مصدر النص القرآني',
              body:
                  'لا يتم توليد نص القرآن بالذكاء الاصطناعي. تتم المقارنة مع ملف القرآن الموجود داخل التطبيق.',
            ),
            _PrivacyCard(
              title: 'التسجيل الصوتي',
              body:
                  'تستخدم ميزة التسميع الميكروفون لتسجيل تلاوتك وتحليلها. التسجيل يستخدم فقط لغرض المقارنة والتسميع.',
            ),
            _PrivacyCard(
              title: 'الخادم المتقدم',
              body:
                  'إذا فعّلت محرك الخادم المتقدم وسمحت بإرسال الصوت، سيتم إرسال التسجيل إلى endpoint الذي وضعته أنت في الإعدادات.',
            ),
            _PrivacyCard(
              title: 'التخزين المحلي',
              body:
                  'سجل التسميع والإعدادات تحفظ محليا على الجهاز. مفتاح API يحفظ في التخزين الآمن عند توفره.',
            ),
            _PrivacyCard(
              title: 'نصيحة أمان',
              body:
                  'لا تستخدم خادما عاما لا تثق به. عند النشر الحقيقي استخدم HTTPS و API key ولا تفتح الخادم للعامة دون حماية.',
            ),
          ],
        ),
      ),
    );
  }
}

class _PrivacyCard extends StatelessWidget {
  final String title;
  final String body;

  const _PrivacyCard({
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
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: const TextStyle(
              height: 1.7,
              color: Color(0xFF11100E),
            ),
          ),
        ],
      ),
    );
  }
}
