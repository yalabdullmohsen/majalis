/**
 * verse-alignment-engine.ts
 * محرك المحاذاة التدفقية — طبقة 4 من 9 في القسم 4 من المواصفة. وحدة
 * حالة (stateful) نقية بلا DOM/شبكة: تستقبل كلمة مسموعة واحدة في كل
 * استدعاء (نمط بث لحظي)، وتُصدر أحداث محاذاة (صحيح/خطأ) فور استقرارها
 * بثقة كافية، عبر "نافذة بحث منزلقة" (buffer صغير) تُحاذى بخوارزمية
 * word-alignment.ts (Needleman-Wunsch) مقابل الكلمات المرجعية القادمة.
 *
 * لماذا لا نحسم كل كلمة فور وصولها مباشرة؟ لأن "خطأ حفظ" (تبديل) و"كلمة
 * زائدة تلتها كلمة صحيحة" يتشابهان حتى تصل كلمة أو كلمتان إضافيتان
 * توضّحان أيّ تفسير هو الأصح — بالضبط سبب وجود "نافذة" لا مقارنة فورية.
 */
import type { AlertLevel, AlignmentEvent, ReferenceWord } from "./types";
import { alignFittingWindow, type AlignOp } from "./word-alignment";
import { isBismillahPhrase, normalizeQuranWord, SURAH_WITHOUT_BISMILLAH, SURAH_WHERE_BISMILLAH_IS_AYAH_ONE } from "./quran-normalize";

const LOOKAHEAD = 6;     // حجم نافذة المرجع القادمة
const COMMIT_LAG = 1;    // عدد الكلمات المسموعة الأخيرة التي تبقى معلَّقة (غير محسومة) لحل الغموض
const REPETITION_LOOKBACK = 8; // عدد الكلمات الماضية المفحوصة لاكتشاف التكرار

/**
 * عتبة تصنيف "غير واضح" (0-100): كلمة تبدو "خطأ استبدال" (substitute)
 * لكن مزوّد ASR أبلغ ثقة تعرّف أقل من هذه القيمة لهذه الكلمة تحديدًا ⇒
 * السبب الأرجح ضعف التقاط الصوت لا خطأ حفظ حقيقي، فتُصنَّف "غير واضح"
 * بدل "خطأ" (القسم 9: التصنيف الحادي عشر). عتبة أدنى من عتبة ملاحظات
 * التجويد (85%، حقل منفصل تمامًا) عمدًا: هذه ثقة *تعرّف الكلمة نفسها*
 * الخام من محرك ASR عامّ (غير مخصَّص للقرآن)، تكون عادة أدنى طبيعيًا من
 * ثقة نموذج تجويد متخصص حتى في نتائج صحيحة — عتبة عالية هنا كانت ستُصنِّف
 * أخطاء حفظ حقيقية كثيرة كـ"غير واضح" زورًا فتُضعِف قيمة الميزة التصحيحية.
 */
export const UNCLEAR_CONFIDENCE_THRESHOLD = 60;

export type EngineConfig = {
  referenceWords: ReferenceWord[]; // كامل النطاق المُختار مسبقًا (سورة/نطاق آيات/صفحة/جزء)
  alertLevel?: AlertLevel;
  /** يُستدعى فور اكتشاف توقف طويل نسبيًا لسرعة قراءة المستخدم الفعلية. */
  longPauseThresholdMultiplier?: number;
};

type PendingHeard = { raw: string; norm: string; atMs: number; confidence?: number };

export class VerseAlignmentEngine {
  private readonly ref: ReferenceWord[];
  private cursor = 0;                 // فهرس أول كلمة مرجعية لم تُحسَم بعد
  private readonly buffer: PendingHeard[] = [];
  private readonly committedCorrect: ReferenceWord[] = []; // للتكرار وحساب سرعة القراءة
  private lastWordAtMs: number | null = null;
  private readonly interWordGapsMs: number[] = [];
  private finished = false;
  private lastAyahAnnounced: string | null = null;
  /** مرة واحدة فقط لكل جلسة: هل تقرَّر مصير كلمات البسملة المحتملة في مطلع النطاق (بسملة فعلية فتُحذَف، أو محتوى حقيقي فيُترَك)؟ */
  private bismillahChecked = false;

  constructor(private readonly config: EngineConfig) {
    this.ref = config.referenceWords;
  }

  get progress(): { cursor: number; total: number } {
    return { cursor: this.cursor, total: this.ref.length };
  }

  get isComplete(): boolean {
    return this.cursor >= this.ref.length && this.buffer.length === 0;
  }

  /** عتبة "توقف طويل" متكيّفة: 2.5× متوسط الفاصل الفعلي بين كلمات هذا المستخدم في هذه الجلسة. */
  private longPauseThresholdMs(): number {
    const mult = this.config.longPauseThresholdMultiplier ?? 2.5;
    if (this.interWordGapsMs.length < 3) return 6000; // قبل تكوّن متوسط موثوق: عتبة ثابتة معقولة
    const avg = this.interWordGapsMs.reduce((a, b) => a + b, 0) / this.interWordGapsMs.length;
    return Math.max(2500, avg * mult);
  }

  /**
   * يُغذّي المحرك بكلمة واحدة نُطقت فعليًا (بعد استقرار نتيجة ASR
   * الجزئية — ليس كل partial update، بل الكلمات المؤكَّدة فقط؛ هذا قرار
   * الطبقة الأعلى StreamingTranscription/الجلسة، لا هذا المحرك).
   */
  feedWord(rawWord: string, atMs: number, confidence?: number): AlignmentEvent[] {
    if (this.finished) return [];
    const events: AlignmentEvent[] = [];

    // كشف التوقف الطويل قبل هذه الكلمة
    if (this.lastWordAtMs !== null) {
      const gap = atMs - this.lastWordAtMs;
      if (this.cursor < this.ref.length && gap > this.longPauseThresholdMs()) {
        events.push({
          kind: "error",
          errorType: "long_pause",
          ref: this.ref[this.cursor] ?? null,
          heardWord: null,
          confidence: 90,
          note: `توقف ${Math.round(gap / 1000)}ث قبل هذه الكلمة`,
        });
      }
      this.interWordGapsMs.push(gap);
      if (this.interWordGapsMs.length > 30) this.interWordGapsMs.shift();
    }
    this.lastWordAtMs = atMs;

    const norm = normalizeQuranWord(rawWord);
    this.buffer.push({ raw: rawWord, norm, atMs, confidence });

    events.push(...this.resolveBuffer(/* finalFlush */ false));
    return events;
  }

  /** يُستدعى عند إنهاء الجلسة — يحسم كل ما تبقى في الـ buffer دفعة واحدة. */
  finalize(): AlignmentEvent[] {
    if (this.finished) return [];
    const events = this.resolveBuffer(/* finalFlush */ true);
    this.finished = true;
    return events;
  }

  private currentAyahKey(ref: ReferenceWord): string {
    return `${ref.surah}:${ref.ayah}`;
  }

  private resolveBuffer(finalFlush: boolean): AlignmentEvent[] {
    const events: AlignmentEvent[] = [];

    // كشف تكرار: هل آخر ما في الـ buffer يطابق كلمات سبق أن أُحسِمت بنجاح؟
    const repetition = this.detectRepetition();
    if (repetition) {
      this.buffer.length = 0;
      events.push({
        kind: "error",
        errorType: "repetition",
        ref: null,
        heardWord: repetition.join(" "),
        confidence: 80,
        note: "تكرار مقطع سبق نطقه بشكل صحيح",
      });
      return events;
    }

    // تجاوز البسملة إن وقعت في بداية سورة (عدا الفاتحة/التوبة، مُدارة عبر REFERENCE نفسه)
    // — قرار **مرة واحدة فقط** لكل جلسة (bismillahChecked)، لا فحص متكرر
    // كل مرة يكون فيها cursor=0: أول تنفيذ كان يُعيد الفحص عند كل استدعاء
    // طالما لم يتقدَّم cursor، فإن سبقت كلمات البسملة كلمات محتوى حقيقية
    // قليلة (<4) في الـbuffer بعد حذف البسملة، كانت تُحجَب عن الحسم إلى
    // الأبد (لا بسملة أخرى قادمة لتُكمل الأربع وتُطلق القرار) — خلل حقيقي
    // مُكتشَف عبر تحقّق حي لوضع "التسميع الحر" (سورة الإخلاص القصيرة).
    let awaitingBismillahDecision = false;
    if (!this.bismillahChecked && this.cursor === 0 && this.ref.length > 0) {
      const surah = this.ref[0].surah;
      const isFatihaOrTawbah =
        SURAH_WHERE_BISMILLAH_IS_AYAH_ONE.has(surah) || SURAH_WITHOUT_BISMILLAH.has(surah);
      if (isFatihaOrTawbah) {
        this.bismillahChecked = true;
      } else if (this.buffer.length >= 4) {
        const words = this.buffer.slice(0, 4).map((b) => b.norm);
        if (isBismillahPhrase(words)) {
          this.buffer.splice(0, 4);
        }
        this.bismillahChecked = true;
      } else if (finalFlush) {
        this.bismillahChecked = true; // جلسة أُنهيت بأقل من 4 كلمات إجمالاً — لا حسم بسملة، تُعامَل كمحتوى مباشرة
      } else {
        // لم تصل كلمات كافية بعد للحسم — لا نُحاذي المعلَّق حتى الآن ضد
        // المرجع، وإلا حاذاها المحرك خطأً ضد أول كلمات الآية الحقيقية.
        awaitingBismillahDecision = true;
      }
    }

    if (this.buffer.length === 0) return events;
    if (awaitingBismillahDecision) return events;

    while (this.buffer.length > (finalFlush ? 0 : COMMIT_LAG) && this.cursor < this.ref.length) {
      const refWindow = this.ref.slice(this.cursor, this.cursor + LOOKAHEAD).map((r) => r.normalized);
      const heardWindow = this.buffer.map((b) => b.norm);
      const ops = alignFittingWindow(heardWindow, refWindow);

      const commitCount = finalFlush ? ops.length : this.leadingStableOpCount(ops);
      if (commitCount === 0) break;

      const { consumedHeard, consumedRef } = this.commitOps(ops.slice(0, commitCount), events);
      this.buffer.splice(0, consumedHeard);
      this.cursor += consumedRef;

      if (!finalFlush && consumedHeard === 0 && consumedRef === 0) break; // أمان: تفادي حلقة لا نهائية
    }

    // كلمات زائدة تجاوزت كل النطاق المرجعي (انتهت التلاوة المطلوبة والمستخدم استمر بالكلام)
    if (this.cursor >= this.ref.length && this.buffer.length > 0 && (finalFlush || this.buffer.length > COMMIT_LAG)) {
      const extra = finalFlush ? this.buffer.splice(0) : this.buffer.splice(0, this.buffer.length - COMMIT_LAG);
      for (const w of extra) {
        events.push({ kind: "error", errorType: "extra_word", ref: null, heardWord: w.raw, confidence: 70 });
      }
    }

    return events;
  }

  /** كلمة/كلمتان في نهاية عمليات المحاذاة قد تنقلبان بوصول كلمة جديدة — نُبقيها معلَّقة، ما عداها "مستقر". */
  private leadingStableOpCount(ops: AlignOp[]): number {
    if (ops.length === 0) return 0;
    // نتجنّب حسم آخر عملية "insert" (قد تكون بداية تبديل غامض) ما لم يكن flush نهائيًا.
    let stable = ops.length;
    while (stable > 0 && ops[stable - 1].type === "insert") stable -= 1;
    return stable;
  }

  private commitOps(ops: AlignOp[], events: AlignmentEvent[]): { consumedHeard: number; consumedRef: number } {
    let consumedHeard = 0;
    let consumedRef = 0;
    let lastAyahKey: string | null = null;

    for (const op of ops) {
      if (op.refIndex !== null) {
        const ref = this.ref[this.cursor + op.refIndex];
        lastAyahKey = this.currentAyahKey(ref);
      }

      switch (op.type) {
        case "match": {
          const ref = this.ref[this.cursor + op.refIndex!];
          events.push({ kind: "correct", ref, confidence: 95 });
          this.committedCorrect.push(ref);
          if (this.committedCorrect.length > REPETITION_LOOKBACK) this.committedCorrect.shift();
          consumedHeard += 1;
          consumedRef += 1;
          break;
        }
        case "substitute": {
          const ref = this.ref[this.cursor + op.refIndex!];
          const heard = this.buffer[op.heardIndex!];
          if (typeof heard.confidence === "number" && heard.confidence < UNCLEAR_CONFIDENCE_THRESHOLD) {
            events.push({ kind: "unclear", ref, heardWord: heard.raw, confidence: heard.confidence });
          } else {
            events.push({ kind: "error", errorType: "wrong_word", ref, heardWord: heard.raw, confidence: 75 });
          }
          consumedHeard += 1;
          consumedRef += 1;
          break;
        }
        case "delete": {
          const ref = this.ref[this.cursor + op.refIndex!];
          events.push({ kind: "error", errorType: "missing_word", ref, heardWord: null, confidence: 70 });
          consumedRef += 1;
          break;
        }
        case "insert": {
          const heard = this.buffer[op.heardIndex!];
          events.push({ kind: "error", errorType: "extra_word", ref: null, heardWord: heard.raw, confidence: 60 });
          consumedHeard += 1;
          break;
        }
      }
    }

    if (lastAyahKey && lastAyahKey !== this.lastAyahAnnounced) {
      const isLastWordOfAyah =
        consumedRef > 0 &&
        this.cursor + consumedRef < this.ref.length &&
        this.currentAyahKey(this.ref[this.cursor + consumedRef]) !== lastAyahKey;
      const reachedEnd = this.cursor + consumedRef >= this.ref.length;
      if (isLastWordOfAyah || reachedEnd) {
        const [surah, ayah] = lastAyahKey.split(":").map(Number);
        events.push({ kind: "ayah_complete", surah, ayah });
        this.lastAyahAnnounced = lastAyahKey;
      }
    }

    return { consumedHeard, consumedRef };
  }

  private detectRepetition(): string[] | null {
    if (this.buffer.length < 2 || this.committedCorrect.length === 0) return null;
    const bufferNorms = this.buffer.map((b) => b.norm);
    const recentNorms = this.committedCorrect.map((r) => r.normalized);

    // نبحث عن تطابق تام لكامل الـ buffer كتتابع فرعي متصل في آخر الكلمات المُحسَمة بنجاح.
    for (let start = Math.max(0, recentNorms.length - bufferNorms.length); start <= recentNorms.length - bufferNorms.length; start++) {
      if (start < 0) break;
      let allMatch = true;
      for (let k = 0; k < bufferNorms.length; k++) {
        if (recentNorms[start + k] !== bufferNorms[k]) { allMatch = false; break; }
      }
      if (allMatch) return this.buffer.map((b) => b.raw);
    }
    return null;
  }
}
