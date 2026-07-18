/**
 * server-provider.ts
 * ⚠️ غير موصول فعليًا بأي نموذج ASR قرآني حقيقي في هذه الجلسة. القسم 5
 * يطلب "ابحث عن نموذج مفتوح مدرَّب على تلاوة القرآن... واستخدم أفضل خيار
 * عملي متاح" — بحث فعلي (2026-07-18، لا نشر) حدَّد أفضل مرشَّح مفتوح
 * فعليًا: **`tarteel-ai/whisper-base-ar-quran`** على Hugging Face
 * (مبني على معمارية Whisper الأساسية، رخصة Apache 2.0 — استخدام تجاري
 * حر — WER مُبلَّغ 5.7544% على بيانات اختبار قرآنية). بطاقة النموذج نفسها
 * تنص صراحة: "This model isn't deployed by any Inference Provider" —
 * يحتاج استضافة يدوية فعلية (خيارات واقعية: HF Inference Endpoints
 * مدفوعة، أو Replicate، أو Modal) قبل إمكانية الاستخدام، وكلها **تتطلب
 * حساب دفع مملوك لإدارة المنصة** — خارج صلاحية أي تنفيذ برمجي محلي أو
 * قرار تقني بحت. لا يمكن تشغيل نموذج GPU من Vercel Serverless القائم.
 * القرار المطلوب من المالك تحديدًا: فتح حساب استضافة (أيّ من الثلاثة
 * أعلاه) وربط مفتاح API هنا — عندها فقط يصبح `isAvailable()` حقيقيًا.
 *
 * هذا المزوّد **لا يُعيد نتائج وهمية أبدًا** (القسم 14 يمنع ذلك صراحة) —
 * كل استدعاء يرفض بخطأ NOT_CONFIGURED واضح. هو الوحيد المؤهَّل نظريًا
 * لمستوى "إتقان التجويد" (القسم 5) — وبما أنه غير موصول، مستوى التجويد
 * **معطَّل بصدق في الواجهة** (راجع src/lib/recitation-ai/precision-level.ts)
 * لا "يعمل" بنتائج ملفَّقة.
 */
import type { ASRSession, AudioChunk, FinalResult, PartialResult, QuranASRProvider, RecitationConfig } from "../asr-provider";
import { ASRProviderUnavailableError } from "../asr-provider";

const NOT_CONFIGURED_MESSAGE =
  "مزوّد التعرّف الصوتي القرآني الخادمي غير مُهيَّأ بعد — يحتاج قرار استضافة نموذج من إدارة المنصة. راجع التقرير النهائي.";

export class ServerQuranASRProvider implements QuranASRProvider {
  readonly id = "server";
  readonly supportsStreaming = true;
  readonly supportsTajweed = true; // مؤهَّل نظريًا فقط — راجع isAvailable()
  readonly worksOffline = false;
  readonly capturesAudioInternally = false;

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async startSession(_config: RecitationConfig): Promise<ASRSession> {
    throw new ASRProviderUnavailableError({ code: "NOT_CONFIGURED", message: NOT_CONFIGURED_MESSAGE });
  }

  async transcribeChunk(_session: ASRSession, _chunk: AudioChunk): Promise<PartialResult | null> {
    throw new ASRProviderUnavailableError({ code: "NOT_CONFIGURED", message: NOT_CONFIGURED_MESSAGE });
  }

  async endSession(_session: ASRSession): Promise<FinalResult> {
    throw new ASRProviderUnavailableError({ code: "NOT_CONFIGURED", message: NOT_CONFIGURED_MESSAGE });
  }
}
