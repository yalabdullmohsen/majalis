/**
 * freeform-start-detector.ts
 * "التسميع الحر" (القسم 2، الوضع 6): تحديد تلقائي لموضع البدء (سورة:آية)
 * من أول كلمات ينطقها المستخدم — بلا اختيار سورة/نطاق مسبق. يعتمد على
 * فهرس مواضع الرباعيات المحسوب فعليًا (scripts/build-quran-position-index.mjs،
 * public/data/quran/quran-position-index.json) بلا أي طلب شبكي إضافي أثناء
 * الحسم نفسه — كل التحقّق محلي بمجرد تحميل الفهرس مرة واحدة.
 *
 * المنهجية: أول رباعية كلمات (4 كلمات) تُعطي مرشَّحًا محتملًا واحدًا أو
 * أكثر (93% من رباعيات المصحف فريدة تمامًا فتُحسَم فورًا من أول 4 كلمات).
 * عند التباس أكثر من مرشَّح واحد (غالبًا بسملة أو عبارة قرآنية متكرِّرة)،
 * تُستخدَم كل كلمة إضافية تصل لتشكيل رباعية جديدة منزلقة (نافذة تبدأ من
 * الكلمة التالية) والتقاطع مع المرشَّحين الحاليين — **بلا أي طلب شبكي
 * إضافي**: كل التحقّق يعتمد فقط على الفهرس المُحمَّل مسبقًا نفسه.
 *
 * `streamIndex` فهرس الكلمة ضمن **كامل كلمات السورة متضمِّنةً البسملة**
 * (متواصل عبر كل آياتها، لا يتصفّر عند كل آية) — يُستخدَم فقط للتحقّق من
 * التتالي هنا داخليًا (مقارنة "+1")، ولا علاقة له بـReferenceWord.globalIndex
 * (ذلك الأخير يفصل البسملة المدمَجة، بينما هذا الفهرس يتعمَّد إبقاءها —
 * راجع تعليق build-quran-position-index.mjs لسبب هذا الاختيار: أي مستخدم
 * قد يبدأ ببسملة قبل أي سورة، لا الفاتحة فقط). عند الحسم، تُستهلَك `ayah`
 * فقط (بداية الجلسة الفعلية دومًا عبر buildReferenceWords العادية التي
 * تفصل البسملة كالمعتاد — هذا الفهرس أداة اكتشاف لا مرجع تصحيح).
 */

export type PositionCandidate = { surah: number; ayah: number; streamIndex: number };
export type PositionIndexRaw = Record<string, Array<[number, number, number]>>;

const QUADGRAM_SIZE = 4;
/** إن لم يُحسَم الغموض خلال هذا العدد من الكلمات، نتوقف ونطلب اختيارًا يدويًا (القسم 12: صدق حين يتعذّر التحديد). */
export const MAX_WORDS_BEFORE_GIVEUP = 10;

let cachedIndex: Promise<PositionIndexRaw> | null = null;

/** يُحمَّل مرة واحدة فقط لكل تحميل صفحة (~3 ميغابايت خام، ~600 كيلوبايت مضغوطًا) — فقط عند اختيار وضع "التسميع الحر" فعليًا. */
export async function loadPositionIndex(): Promise<PositionIndexRaw> {
  if (!cachedIndex) {
    cachedIndex = fetch("/data/quran/quran-position-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`تعذّر تحميل فهرس المواضع (HTTP ${res.status})`);
        return res.json() as Promise<PositionIndexRaw>;
      })
      .catch((err) => {
        cachedIndex = null;
        throw err;
      });
  }
  return cachedIndex;
}

/**
 * وحدة حالة نقية (بلا شبكة/DOM) تستهلك كلمات مطبَّعة (normalizeQuranWord)
 * واحدة تلو الأخرى، وتُعيد:
 *   - `null`: لم يُحسَم بعد (كلمات غير كافية أو غموض لم يُحلّ بعد) — استمر بالتغذية.
 *   - مصفوفة بعنصر واحد: تحديد ناجح.
 *   - مصفوفة فارغة `[]`: استسلام — تجاوز MAX_WORDS_BEFORE_GIVEUP بلا حسم غموض.
 */
export class FreeformStartDetector {
  private readonly words: string[] = [];

  constructor(private readonly index: PositionIndexRaw) {}

  feedWord(normalizedWord: string): PositionCandidate[] | null {
    this.words.push(normalizedWord);
    return this.resolve();
  }

  private resolve(): PositionCandidate[] | null {
    if (this.words.length < QUADGRAM_SIZE) return null;

    let candidates = this.quadgramPositions(0);
    for (let start = 1; candidates.length > 1 && start + QUADGRAM_SIZE <= this.words.length; start++) {
      const next = this.quadgramPositions(start);
      candidates = candidates.filter((c) =>
        next.some((n) => n.surah === c.surah && n.streamIndex === c.streamIndex + start),
      );
    }

    if (candidates.length === 1) return candidates;
    if (candidates.length === 0 || this.words.length >= MAX_WORDS_BEFORE_GIVEUP) return [];
    return null;
  }

  private quadgramPositions(start: number): PositionCandidate[] {
    const gram = this.words.slice(start, start + QUADGRAM_SIZE).join(" ");
    const raw = this.index[gram] ?? [];
    return raw.map(([surah, ayah, streamIndex]) => ({ surah, ayah, streamIndex }));
  }
}
