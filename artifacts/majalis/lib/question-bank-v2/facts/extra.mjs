/** @fileoverview حقائق إضافية — عدد آيات ومصطلحات */

function b(cat, sub, diff, q, a, d, expl, ref, book = ref, num = null) {
  return {
    title: q.slice(0, 50),
    questionText: q,
    correctAnswer: a,
    distractors: d,
    explanation: expl || `الإجابة: ${a}.`,
    evidence: ref,
    reference: ref.includes('قرآن') || ref.includes('سورة') ? 'القرآن الكريم' : ref,
    source: ref,
    bookName: book,
    referenceNumber: num,
    categorySlug: cat,
    subCategory: sub,
    difficulty: diff,
    keywords: [sub],
  };
}

const NAMES_41_114 = [
  'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق',
  'الذاريات', 'الطور', 'النجm', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة',
];

export function getExtraFacts() {
  return [];
}
