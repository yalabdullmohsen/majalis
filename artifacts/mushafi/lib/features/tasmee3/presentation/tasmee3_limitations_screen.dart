import 'package:flutter/material.dart';

import 'tasmee3_design_tokens.dart';
import 'widgets/tasmee3_app_scaffold.dart';

class Tasmee3LimitationsScreen extends StatelessWidget {
  const Tasmee3LimitationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Tasmee3AppScaffold(
      title: 'حدود ميزة التسميع',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: const [
          _LimitCard(
            title: 'أداة مساعدة وليست حكما شرعيا',
            body:
                'نتائج التسميع دقة تقريبية مبنية على التعرف الصوتي والمطابقة التقنية. لا تعتبر النتائج فتوى أو حكما شرعيا على التلاوة.',
          ),
          _LimitCard(
            title: 'تأثر الدقة بجودة الصوت',
            body:
                'قد تتأثر النتائج بالضوضاء، بُعد الجهاز، سرعة القراءة، ضعف الاتصال بالخادم، أو اختلاف محرك التعرف الصوتي.',
          ),
          _LimitCard(
            title: 'التجويد والتفاصيل الدقيقة',
            body:
                'قد لا يلتقط النظام كل أحكام التجويد أو الفروق الصوتية الدقيقة. الهدف هو المساعدة على المراجعة العامة.',
          ),
          _LimitCard(
            title: 'النطاق القصير أفضل',
            body:
                'للحصول على نتائج أفضل، استخدم نطاقا قصيرا من آية إلى خمس آيات في الجلسة الواحدة.',
          ),
          _LimitCard(
            title: 'خصوصية الصوت',
            body:
                'لا يتم إرسال الصوت للخادم إلا إذا فعّلت الخادم المتقدم وسمحت بذلك صراحة من الإعدادات.',
          ),
        ],
      ),
    );
  }
}

class _LimitCard extends StatelessWidget {
  final String title;
  final String body;

  const _LimitCard({
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: Tasmee3Spacing.md),
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: Tasmee3TextStyles.sectionTitle,
          ),
          const SizedBox(height: Tasmee3Spacing.sm),
          Text(
            body,
            style: Tasmee3TextStyles.body,
          ),
        ],
      ),
    );
  }
}
