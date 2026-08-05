import { useEffect, useMemo } from "react";
import { useSearch } from "wouter";
import { AlertTriangle, Lock, Mail, Plus, Settings2, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { ShareButtons } from "@/components/ContentActions";
import { InstagramAcademyLink } from "@/components/InstagramAcademyLink";
import { applyPageSeo } from "@/lib/seo";
import { CONTACT_EMAIL, mailtoWithSubject } from "@/lib/site-config";

const FAQ = [
  {
    q: "كيف أُبلّغ عن خطأ في حديث أو فتوى؟",
    a: 'أرسل بريداً إلكترونياً بعنوان "تصحيح محتوى" مع ذكر الصفحة والخطأ المقترح وإن أمكن المصدر. سنراجعه خلال 3 أيام عمل.',
  },
  {
    q: "هل يمكنني اقتراح شيخ أو عالم لإضافته؟",
    a: "نعم، أرسل اسم العالم وسيرته المختصرة وأبرز مؤلفاته ودروسه. سنتحقق من المعلومات ونضيفه إن توفرت البيانات الكافية.",
  },
  {
    q: "كيف أطلب حذف بيانات حسابي؟",
    a: 'أرسل طلباً عبر البريد الإلكتروني بعنوان "طلب حذف حساب" من البريد المرتبط بحسابك. سنُنجز الطلب خلال 7 أيام عمل.',
  },
  {
    q: "هل يمكنني المساهمة في المحتوى؟",
    a: 'بالتأكيد. استخدم صفحة "أضف محتوى" لتقديم فوائد ودروس تنتظر المراجعة قبل النشر، أو تواصل معنا مباشرةً للمساهمة المتخصصة.',
  },
  {
    q: "هل تقبلون تمويلاً أو شراكات؟",
    a: "نرحب بالشراكات مع مؤسسات علمية وهيئات شرعية موثوقة. تواصل معنا بتفاصيل الشراكة المقترحة وسنردّ في أقرب وقت.",
  },
];

const TOPICS: { id: string; Icon: LucideIcon; label: string; note: string; subject: string }[] = [
  { id: "report", Icon: AlertTriangle, label: "الإبلاغ عن خطأ في المحتوى", note: "درس / حديث / فتوى / معلومة غير دقيقة", subject: "الإبلاغ عن خطأ" },
  { id: "suggest", Icon: Plus, label: "اقتراح محتوى أو شيخ جديد", note: "علماء / كتب / دروس / فوائد", subject: "اقتراح أو شراكة" },
  { id: "tech", Icon: Settings2, label: "مشكلة تقنية في المنصة", note: "خلل في عرض الصفحات أو الأدوات", subject: "ملاحظة تقنية" },
  { id: "privacy", Icon: Lock, label: "طلب حذف أو تعديل بيانات الحساب", note: "خصوصيتك مكفولة", subject: "استفسار عام" },
  { id: "partner", Icon: Users2, label: "شراكات مؤسسية وعلمية", note: "مؤسسات / هيئات / جامعات", subject: "اقتراح أو شراكة" },
];

function resolveTopicId(raw: string): string | null {
  const t = decodeURIComponent(raw).trim().toLowerCase();
  if (!t) return null;
  if (t === "rate" || t.includes("تقييم") || t.includes("rate")) return "report";
  if (t.includes("خطأ") || t.includes("تصحيح") || t.includes("report") || t.includes("content")) return "report";
  if (t.includes("اقتراح") || t.includes("suggest")) return "suggest";
  if (t.includes("تقنية") || t.includes("tech")) return "tech";
  if (t.includes("حذف") || t.includes("خصوصية") || t.includes("privacy")) return "privacy";
  if (t.includes("شراكة") || t.includes("partner")) return "partner";
  // سياق صفحة محتوى (من ContentReportLink) → إبلاغ
  return "report";
}

export default function ContactPage() {
  const search = useSearch();
  const topicParam = useMemo(() => new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("topic") || "", [search]);
  const activeTopicId = useMemo(() => resolveTopicId(topicParam), [topicParam]);
  const activeTopic = TOPICS.find((t) => t.id === activeTopicId) ?? null;

  useEffect(() => {
    applyPageSeo({
      path: "/contact",
      title: "تواصل معنا | المجلس العلمي",
      description: "تواصل مع فريق المجلس العلمي، تقرير خطأ، اقتراح محتوى، شراكات مؤسسية، أو طلبات تقنية.",
      keywords: ["تواصل", "المجلس العلمي", "الدعم", "اقتراح محتوى", "إبلاغ عن خطأ"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "ContactPage", name: "تواصل مع المجلس العلمي", url: "https://www.majlisilm.com/contact", about: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" } }],
    });
  }, []);

  const mailtoSubject = activeTopic
    ? topicParam && topicParam !== activeTopic.id
      ? `${activeTopic.subject} — ${topicParam}`
      : activeTopic.subject
    : "استفسار عام";

  return (
    <LegalPageLayout eyebrow="التواصل" title="تواصل معنا" updatedAt="2026-08-05">

      <LegalSection title="يسعدنا تواصلك">
        <p>
          فريق المجلس العلمي حريصٌ على الرد على جميع الاستفسارات الشرعية والتقنية
          وملاحظات المحتوى. اختر القناة الأنسب أو وصف موضوعك أدناه.
        </p>
        {activeTopic ? (
          <p className="contact-topic-banner" role="status">
            موضوع مقترَح من الرابط: <strong>{activeTopic.label}</strong>
            {topicParam && topicParam !== activeTopic.id ? (
              <>
                {" "}
                — السياق: <span dir="auto">{topicParam}</span>
              </>
            ) : null}
            . يمكنك المتابعة مباشرة عبر{" "}
            <a href={mailtoWithSubject(mailtoSubject)}>البريد الإلكتروني</a>.
          </p>
        ) : null}
      </LegalSection>

      <LegalSection title="قنوات التواصل">
        <div className="contact-channels">
          <div className="contact-channel">
            <p className="contact-channel__label">البريد الإلكتروني الرسمي والتواصل</p>
            <a href={mailtoWithSubject(mailtoSubject)} className="contact-channel__link">
              {CONTACT_EMAIL}
            </a>
            <p className="contact-channel__note">
              للاستفسارات العامة، والملاحظات التقنية، وتصحيح المحتوى العلمي، والاقتراحات والشراكات.
            </p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="تابعونا">
        <div className="contact-channels">
          <InstagramAcademyLink variant="card" />
        </div>
      </LegalSection>

      <LegalSection title="يمكننا مساعدتك في">
        <div className="contact-topics">
          {TOPICS.map((t) => {
            const selected = activeTopicId === t.id;
            const subject =
              selected && topicParam && topicParam !== t.id
                ? `${t.subject} — ${topicParam}`
                : t.subject;
            return (
              <a
                key={t.label}
                href={mailtoWithSubject(subject)}
                className={`contact-topic contact-topic--link${selected ? " is-selected" : ""}`}
                aria-current={selected ? "true" : undefined}
              >
                <span className="contact-topic__icon" aria-hidden="true">{(() => { const I = t.Icon; return <I size={18} strokeWidth={1.8} />; })()}</span>
                <div>
                  <strong className="contact-topic__label">{t.label}</strong>
                  <p className="contact-topic__note">{t.note}</p>
                </div>
                <Mail size={15} strokeWidth={1.8} className="contact-topic__mail-icon" aria-hidden="true" />
              </a>
            );
          })}
        </div>
      </LegalSection>

      <LegalSection title="أوقات الرد">
        <div className="contact-times">
          <div className="contact-time-row">
            <span>استفسارات عامة</span>
            <strong>خلال 1-3 أيام عمل</strong>
          </div>
          <div className="contact-time-row">
            <span>تصحيح المحتوى العلمي</span>
            <strong>خلال 3-5 أيام عمل</strong>
          </div>
          <div className="contact-time-row">
            <span>مشاكل تقنية</span>
            <strong>خلال 24 ساعة</strong>
          </div>
          <div className="contact-time-row">
            <span>طلبات حذف البيانات</span>
            <strong>خلال 7 أيام عمل</strong>
          </div>
        </div>
        <p>
          نحرص على الرد على جميع الرسائل. إن لم تصلك ردود بعد المدة المذكورة،
          يرجى المراسلة مجدداً مع ذكر بريدك الإلكتروني الأصلي.
        </p>
      </LegalSection>

      <LegalSection title="الأسئلة الشائعة">
        <div className="contact-faq">
          {FAQ.map((item) => (
            <div key={item.q} className="contact-faq__item">
              <p className="contact-faq__q">{item.q}</p>
              <p className="contact-faq__a">{item.a}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <div className="twh-share">
        <ShareButtons title="تواصل مع المجلس العلمي" url="https://www.majlisilm.com/contact" />
      </div>
      <LegalBackLink />
    </LegalPageLayout>
  );
}
