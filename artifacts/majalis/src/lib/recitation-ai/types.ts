/** أنواع مشتركة لمحرك "اختبار التسميع بالذكاء الاصطناعي" — بلا اعتماد على DOM. */

export type PrecisionLevel = "hifz" | "tajweed";

export type RecitationMode =
  | "full_hide"
  | "assisted"
  | "word_follow"
  | "interactive_mushaf"
  | "teacher_test";

export type AlertLevel = "gentle" | "medium" | "immediate";

/** كلمة مرجعية واحدة من النص القرآني الموثَّق، مع موقعها الدقيق. */
export type ReferenceWord = {
  surah: number;
  ayah: number;
  wordIndex: number;   // فهرس الكلمة داخل الآية (0-based)
  globalIndex: number; // فهرس الكلمة عبر كامل النطاق المُختار (0-based)
  raw: string;          // النص الأصلي الكامل بتشكيله — لا يُعرَض إلا كما هو
  normalized: string;   // نسخة مطبَّعة (ذاكرة فقط) لغرض المقارنة
};

export type ErrorType =
  | "wrong_word"
  | "missing_word"
  | "extra_word"
  | "out_of_order"
  | "wrong_ayah_jump"
  | "repetition"
  | "long_pause"
  | "wrong_start";

export type AlignmentEvent =
  | { kind: "correct"; ref: ReferenceWord; confidence: number }
  | { kind: "error"; errorType: ErrorType; ref: ReferenceWord | null; heardWord: string | null; confidence: number; note?: string }
  | { kind: "ayah_complete"; surah: number; ayah: number };

export type TajweedNote = {
  ref: ReferenceWord;
  rule: string;         // 'madd_lazim' | 'ghunnah' | 'idgham' | ...
  confidencePct: number; // < 85 ⇒ يُعرض بصيغة "قد توجد ملاحظة" لا جزم
  message: string;
};
