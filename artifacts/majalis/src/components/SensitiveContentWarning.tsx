/**
 * SensitiveContentWarning — تنبيه المسائل الحساسة
 * يُعرض عند اكتشاف مسائل تحتاج إلى إفتاء متخصص.
 */
import { AlertTriangle, ExternalLink } from "lucide-react";

const SENSITIVE_KEYWORDS = [
  "طلاق", "طلقة", "خلع", "فراق", "فسخ",
  "ميراث", "إرث", "تركة", "وصية", "وارث",
  "قصاص", "دية", "حد", "عقوبة",
  "كفارة", "نذر",
  "ربا", "معاملة مالية",
  "نزاع", "خلاف أسري",
  "طبي", "علاج", "دواء", "تشريح",
  "حمل", "ولادة", "إجهاض",
  "زواج عرفي", "زواج سري",
] as const;

export function detectSensitiveContent(text: string): boolean {
  return SENSITIVE_KEYWORDS.some((kw) => text.includes(kw));
}

type Props = {
  topic?: string | null;
  forceShow?: boolean;
  referralUrl?: string;
};

export function SensitiveContentWarning({ topic, forceShow, referralUrl }: Props) {
  const isSensitive = forceShow || (topic ? detectSensitiveContent(topic) : false);
  if (!isSensitive) return null;

  return (
    <aside className="scw-banner" role="note" aria-label="تنبيه مسألة حساسة" dir="rtl">
      <AlertTriangle size={18} strokeWidth={1.8} className="scw-banner__icon" aria-hidden="true" />
      <div className="scw-banner__body">
        <p className="scw-banner__title">هذه المسألة تستلزم استشارة مختص</p>
        <p className="scw-banner__text">
          المعلومات الواردة هنا ذات طابع تعليمي عام. المسائل المتعلقة بالطلاق، والميراث، والنذور، والكفارات
          المعقدة، والقضايا الطبية والأسرية تحتاج إلى فتوى شخصية من عالم متخصص مطّلع على تفاصيل حالتك.
        </p>
        {referralUrl && (
          <a
            href={referralUrl}
            target="_blank" rel="noopener noreferrer"
            className="scw-banner__link"
          >
            استشر دار الإفتاء <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
      </div>
    </aside>
  );
}
