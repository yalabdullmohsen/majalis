/** أنواع مشتركة لمحرك "اختبار التسميع بالذكاء الاصطناعي" — بلا اعتماد على DOM. */

export type PrecisionLevel = "hifz" | "tajweed";

export type RecitationMode =
  | "full_hide"
  | "assisted"
  | "word_follow"
  | "interactive_mushaf"
  | "teacher_test"
  | "freeform";

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

/**
 * نظام ثقة ثلاثي (لا ثنائي) — TASMEE_AUDIT.md القسم 5، بند 3:
 *   - ثقة عالية (>= NEEDS_REPEAT_CONFIDENCE_THRESHOLD، أو ثقة غير مُبلَّغة
 *     أصلاً): "error" — خطأ مؤكَّد، يُسجَّل ويُعرض بتنبيه أحمر.
 *   - ثقة متوسطة (بين العتبتين): "needs_repeat" — "يحتاج إعادة"، يُسجَّل
 *     ويظهر في التقرير، لكن **دون تنبيه أحمر** (تمييز بصري أهدأ) — قد
 *     يكون خطأ حفظ حقيقيًا أو مجرد التقاط غير حاسم، فلا جزم كامل.
 *   - ثقة منخفضة (< UNCLEAR_CONFIDENCE_THRESHOLD): "unclear" — "لم أسمع
 *     بوضوح"، **لا يُحتسب خطأ إطلاقًا** ولا يُدرَج في إحصاء الأخطاء.
 */
export type AlignmentEvent =
  | { kind: "correct"; ref: ReferenceWord; confidence: number }
  | { kind: "error"; errorType: ErrorType; ref: ReferenceWord | null; heardWord: string | null; confidence: number; note?: string }
  // "غير واضح" — بند تفوّق صريح على المنافسين (لا جزم خاطئ بالخطأ حين
  // يكون سبب عدم التطابق ضعف التقاط الصوت نفسه لا خطأ حفظ حقيقي).
  // مستقل تصميميًا عن "error" (لا يُحتسب ضمن إحصاء الأخطاء المؤكَّدة في
  // نسبة الإتقان) — يطلب إعادة النطق بدل الحكم. يُصدَر فقط حين يتوفر
  // مزوّد ASR يُبلِّغ ثقة تعرّف حقيقية دون العتبة لهذه الكلمة تحديدًا.
  | { kind: "unclear"; ref: ReferenceWord; heardWord: string; confidence: number }
  // "يحتاج إعادة" — المستوى الأوسط بين "unclear" و"error" المؤكَّد؛
  // يُسجَّل في التقرير (خلافًا لـ"unclear") لكن بلا تنبيه أحمر فوري ولا
  // احتساب ضمن الأخطاء المؤكَّدة (خلافًا لـ"error").
  | { kind: "needs_repeat"; ref: ReferenceWord; heardWord: string; confidence: number }
  | { kind: "ayah_complete"; surah: number; ayah: number };

export type TajweedNote = {
  ref: ReferenceWord;
  rule: string;         // 'madd_lazim' | 'ghunnah' | 'idgham' | ...
  confidencePct: number; // < 85 ⇒ يُعرض بصيغة "قد توجد ملاحظة" لا جزم
  message: string;
};
