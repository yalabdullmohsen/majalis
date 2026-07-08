import { useEffect } from "react";
import { AlertTriangle, Code2, Lock, Plus, Settings2, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { applyPageSeo } from "@/lib/seo";

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

const TOPICS: { Icon: LucideIcon; label: string; note: string }[] = [
  { Icon: AlertTriangle, label: "الإبلاغ عن خطأ في المحتوى",     note: "درس / حديث / فتوى / معلومة غير دقيقة" },
  { Icon: Plus,          label: "اقتراح محتوى أو شيخ جديد",       note: "علماء / كتب / دروس / فوائد" },
  { Icon: Settings2,     label: "مشكلة تقنية في المنصة",          note: "خلل في عرض الصفحات أو الأدوات" },
  { Icon: Lock,          label: "طلب حذف أو تعديل بيانات الحساب", note: "خصوصيتك مكفولة" },
  { Icon: Users2,        label: "شراكات مؤسسية وعلمية",           note: "مؤسسات / هيئات / جامعات" },
  { Icon: Code2,         label: "واجهة برمجية (API) والمطورين",   note: "مفاتيح API / التكامل" },
];

export default function ContactPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/contact",
      title: "تواصل معنا | المجلس العلمي",
      description: "تواصل مع فريق المجلس العلمي — تقرير خطأ، اقتراح محتوى، شراكات مؤسسية، أو طلبات تقنية.",
      keywords: ["تواصل", "المجلس العلمي", "الدعم", "اقتراح محتوى", "إبلاغ عن خطأ"],
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
            <p className="contact-channel__label">البريد الإلكتروني الرسمي</p>
            <a href="mailto:yalabdullmohsen1@gmail.com" className="contact-channel__link">
              yalabdullmohsen1@gmail.com
            </a>
            <p className="contact-channel__note">للمطوّرين والشراكات والطلبات العامة</p>
          </div>
          <div className="contact-channel">
            <p className="contact-channel__label">تصحيح المحتوى العلمي</p>
            <a href="mailto:yalabdullmohsen1@gmail.com?subject=تصحيح محتوى" className="contact-channel__link">
              يالبدالمحسن — بريد التصحيح
            </a>
            <p className="contact-channel__note">خطأ في حديث / فتوى / معلومة شرعية</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="يمكننا مساعدتك في">
        <div className="contact-topics">
          {TOPICS.map((t) => (
            <div key={t.label} className="contact-topic">
              <span className="contact-topic__icon" aria-hidden="true">{(() => { const I = t.Icon; return <I size={18} strokeWidth={1.8} />; })()}</span>
              <div>
                <strong className="contact-topic__label">{t.label}</strong>
                <p className="contact-topic__note">{t.note}</p>
              </div>
            </div>
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

      <LegalBackLink />
    </LegalPageLayout>
  );
}
