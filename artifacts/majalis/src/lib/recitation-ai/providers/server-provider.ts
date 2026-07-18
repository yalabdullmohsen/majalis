/**
 * server-provider.ts
 * ⚠️ غير موصول فعليًا بأي نموذج ASR قرآني حقيقي في هذه الجلسة. القسم 5
 * يطلب "ابحث عن نموذج مفتوح مدرَّب على تلاوة القرآن (مثل tarteel-style
 * fine-tunes على Hugging Face) واستخدم أفضل خيار عملي متاح" — هذا يتطلّب
 * قرار استضافة/تكلفة فعليًا (لا يمكن تشغيل نموذج GPU من Vercel Serverless
 * القائم؛ يحتاج إما Hugging Face Inference Endpoints مدفوعة، أو استضافة
 * ذاتية بخادم GPU) خارج نطاق ما يمكن تنفيذه أو التحقق من دقته الفعلية في
 * بيئة عمل نصية بلا صوت حقيقي ولا حساب استضافة. راجع التقرير النهائي
 * لقائمة الخيارات المرشَّحة (بالاسم) والقرار المطلوب من المالك.
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
