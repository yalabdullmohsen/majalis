import { useEffect } from "react";
import { AlertTriangle, Code2, Lock, Mail, Plus, Settings2, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { ShareButtons } from "@/components/ContentActions";
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

const TOPICS: { Icon: LucideIcon; label: string; note: string; subject: string }[] = [
  { Icon: AlertTriangle, label: "الإبلاغ عن خطأ في المحتوى",     note: "درس / حديث / فتوى / معلومة غير دقيقة", subject: "الإبلاغ عن خطأ" },
  { Icon: Plus,          label: "اقتراح محتوى أو شيخ جديد",       note: "علماء / كتب / دروس / فوائد", subject: "اقتراح أو شراكة" },
  { Icon: Settings2,     label: "مشكلة تقنية في المنصة",          note: "خلل في عرض الصفحات أو الأدوات", subject: "ملاحظة تقنية" },
  { Icon: Lock,          label: "طلب حذف أو تعديل بيانات الحساب", note: "خصوصيتك مكفولة", subject: "استفسار عام" },
  { Icon: Users2,        label: "شراكات مؤسسية وعلمية",           note: "مؤسسات / هيئات / جامعات", subject: "اقتراح أو شراكة" },
  { Icon: Code2,         label: "واجهة برمجية (API) والمطورين",   note: "مفاتيح API / التكامل", subject: "استفسار عام" },
];

export default function ContactPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/contact",
      title: "تواصل معنا | المجلس العلمي",
      description: "تواصل مع فريق المجلس العلمي، تقرير خطأ، اقتراح محتوى، شراكات مؤسسية، أو طلبات تقنية.",
      keywords: ["تواصل", "المجلس العلمي", "الدعم", "اقتراح محتوى", "إبلاغ عن خطأ"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "ContactPage", name: "تواصل مع المجلس العلمي", url: "https://www.majlisilm.com/contact", about: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" } }],
    });
  }, []);

  return (
    <LegalPageLayout eyebrow="التواصل" title="تواصل معنا">

      <LegalSection title="يسعدنا تواصلك">
        <p>
          فريق المجلس العلمي حريصٌ على الرد على جميع الاستفسارات الشرعية والتقنية
          وملاحظات المحتوى. اختر القناة الأنسب أو وصف موضوعك أدناه.
        </p>
      </LegalSection>

      <LegalSection title="قنوات التواصل">
        <div className="contact-channels">
          <div className="contact-channel">
            <p className="contact-channel__label">البريد الإلكتروني الرسمي والتواصل</p>
            <a href={mailtoWithSubject("استفسار عام")} className="contact-channel__link">
              {CONTACT_EMAIL}
            </a>
            <p className="contact-channel__note">
              للاستفسارات العامة، والملاحظات التقنية، وتصحيح المحتوى العلمي، والاقتراحات والشراكات.
            </p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="يمكننا مساعدتك في">
        <div className="contact-topics">
          {TOPICS.map((t) => (
            <a key={t.label} href={mailtoWithSubject(t.subject)} className="contact-topic contact-topic--link">
              <span className="contact-topic__icon" aria-hidden="true">{(() => { const I = t.Icon; return <I size={18} strokeWidth={1.8} />; })()}</span>
              <div>
                <strong className="contact-topic__label">{t.label}</strong>
                <p className="contact-topic__note">{t.note}</p>
              </div>
              <Mail size={15} strokeWidth={1.8} className="contact-topic__mail-icon" aria-hidden="true" />
            </a>
          ))}
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
