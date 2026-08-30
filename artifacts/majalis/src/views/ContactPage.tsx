import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useSearch } from "wouter";
import { AlertTriangle, Check, Copy, Lock, Mail, MessageSquare, Settings2, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { applyPageSeo } from "@/lib/seo";
import { CONTACT_EMAIL, mailtoWithSubject } from "@/lib/site-config";
import { openExternalUrl } from "@/lib/capacitor-utils";
import "@/styles/pages/contact.css";

const INSTAGRAM_URL = "https://instagram.com/Al_abdalmhsn";
const INSTAGRAM_HANDLE = "Al_abdalmhsn";

const FAQ = [
  {
    q: "كيف أبلغ عن خطأ في حديث أو فتوى؟",
    a: 'أرسل بريداً بعنوان «تصحيح محتوى» مع رابط الصفحة ووصف الخطأ، وإن أمكن المصدر. نراجعه عادة خلال 3–5 أيام عمل.',
  },
  {
    q: "كيف أرسل اقتراحًا أو ملاحظة؟",
    a: "اختر «اقتراحات وملاحظات» من القائمة أدناه، أو راسلنا مباشرة عبر البريد الرسمي. نقرأ كل رسالة ونُجيب قدر الإمكان.",
  },
  {
    q: "كيف أطلب حذف بيانات حسابي؟",
    a: 'من داخل الحساب استخدم مسار حذف الحساب إن وُجد، أو أرسل من البريد المرتبط بحسابك رسالة بعنوان «طلب حذف حساب». ننجز الطلب خلال 7 أيام عمل.',
  },
  {
    q: "هل يمكنني المساهمة في المحتوى؟",
    a: "نعم للمساهمات العلمية الموثقة. راسلنا بموضوع «مساهمة محتوى» مع نبذة عن المادة والمصادر؛ تُراجع قبل أي نشر.",
  },
  {
    q: "هل تقبلون شراكات أو إعلانات؟",
    a: "نرحب بالشراكات العلمية والمؤسسية المتوافقة مع منهجنا. راسلنا عبر البريد أو تواصل عبر إنستقرام شركة العبد المحسن للحج.",
  },
].filter((item) => Boolean(item.q?.trim() && item.a?.trim()));

const TOPICS: { id: string; Icon: LucideIcon; label: string; note: string; subject: string }[] = [
  { id: "suggest", Icon: MessageSquare, label: "اقتراحات وملاحظات", note: "تحسينات عامة على التجربة أو المحتوى", subject: "اقتراحات وملاحظات" },
  { id: "report", Icon: AlertTriangle, label: "بلاغ عن خطأ في المحتوى", note: "درس / حديث / فتوى / معلومة غير دقيقة", subject: "الإبلاغ عن خطأ" },
  { id: "tech", Icon: Settings2, label: "مشكلة تقنية في المنصة", note: "خلل في العرض أو الأدوات", subject: "مشكلة تقنية" },
  { id: "partner", Icon: Users2, label: "شراكات مؤسسية وعلمية", note: "مؤسسات / هيئات / جامعات / إعلان", subject: "شراكة مؤسسية" },
  { id: "privacy", Icon: Lock, label: "طلب حذف أو تعديل بيانات الحساب", note: "خصوصية وحماية البيانات", subject: "طلب حذف حساب" },
];

function resolveTopicId(raw: string): string | null {
  const t = decodeURIComponent(raw).trim().toLowerCase();
  if (!t) return null;
  if (t === "rate" || t.includes("تقييم") || t.includes("rate")) return "suggest";
  if (t.includes("خطأ") || t.includes("تصحيح") || t.includes("report") || t.includes("content")) return "report";
  if (t.includes("اقتراح") || t.includes("suggest") || t.includes("ملاحظة")) return "suggest";
  if (t.includes("تقنية") || t.includes("tech")) return "tech";
  if (t.includes("حذف") || t.includes("خصوصية") || t.includes("privacy")) return "privacy";
  if (t.includes("شراكة") || t.includes("partner") || t.includes("إعلان") || t.includes("اعلان")) return "partner";
  return "suggest";
}

export default function ContactPage() {
  const search = useSearch();
  const topicParam = useMemo(() => new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("topic") || "", [search]);
  const activeTopicId = useMemo(() => resolveTopicId(topicParam), [topicParam]);
  const activeTopic = TOPICS.find((t) => t.id === activeTopicId) ?? null;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/contact",
      title: "تواصل معنا | سُنّة",
      description: "يسعدنا استقبال ملاحظاتك واقتراحاتك وتصحيحاتك عبر البريد الرسمي لسُنّة.",
      keywords: ["تواصل", "سُنّة", "الدعم", "اقتراحات", "إبلاغ عن خطأ"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "تواصل مع سُنّة", url: "https://majlisilm.com/contact", about: { "@type": "Organization", name: "سُنّة", url: "https://majlisilm.com" } }],
    });
  }, []);

  const mailtoSubject = activeTopic
    ? topicParam && topicParam !== activeTopic.id
      ? `${activeTopic.subject} — ${topicParam}`
      : activeTopic.subject
    : "استفسار عام";

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const openInstagram = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    void openExternalUrl(INSTAGRAM_URL);
  };

  return (
    <LegalPageLayout eyebrow="الدعم" title="تواصل معنا" density="medium" className="contact-page">
      <p className="contact-lead">يسعدنا استقبال ملاحظاتك واقتراحاتك وتصحيحاتك.</p>

      {activeTopic ? (
        <p className="contact-topic-banner" role="status">
          موضوع مقترَح من الرابط: <strong>{activeTopic.label}</strong>
          {topicParam && topicParam !== activeTopic.id ? (
            <>
              {" "}
              — السياق: <span dir="auto">{topicParam}</span>
            </>
          ) : null}
        </p>
      ) : null}

      <LegalSection title="قنوات التواصل">
        <div className="contact-channels">
          <div className="contact-email-card">
            <div className="contact-email-card__head">
              <span className="contact-email-card__icon" aria-hidden="true">
                <Mail size={18} strokeWidth={1.9} />
              </span>
              <div className="contact-email-card__meta">
                <p className="contact-email-card__label">البريد الرسمي</p>
                <p className="contact-email-card__address" dir="ltr" lang="en">
                  <a href={mailtoWithSubject(mailtoSubject)} className="contact-email-card__link">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>
            </div>
            <div className="contact-email-card__actions">
              <a href={mailtoWithSubject(mailtoSubject)} className="contact-btn contact-btn--primary">
                إرسال بريد
              </a>
              <button type="button" className="contact-btn contact-btn--ghost" onClick={copyEmail}>
                {copied ? <Check size={15} strokeWidth={2} aria-hidden="true" /> : <Copy size={15} strokeWidth={2} aria-hidden="true" />}
                {copied ? "تم النسخ" : "نسخ"}
              </button>
            </div>
          </div>

          <div className="contact-ig-card">
            <p className="contact-ig-card__label">إنستقرام شركة العبد المحسن للحج</p>
            <p className="contact-ig-card__handle" dir="ltr" lang="en">
              @{INSTAGRAM_HANDLE}
            </p>
            <a
              href={INSTAGRAM_URL}
              className="contact-btn contact-btn--ig"
              target="_blank"
              rel="noopener noreferrer"
              onClick={openInstagram}
            >
              فتح إنستقرام
            </a>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="كيف نساعدك؟">
        <div className="contact-topics">
          {TOPICS.map((t) => {
            const selected = activeTopicId === t.id;
            const subject =
              selected && topicParam && topicParam !== t.id
                ? `${t.subject} — ${topicParam}`
                : t.subject;
            const Icon = t.Icon;
            return (
              <a
                key={t.id}
                href={mailtoWithSubject(subject)}
                className={`contact-topic${selected ? " is-selected" : ""}`}
                aria-current={selected ? "true" : undefined}
              >
                <span className="contact-topic__icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span className="contact-topic__body">
                  <strong className="contact-topic__label">{t.label}</strong>
                  <span className="contact-topic__note">{t.note}</span>
                </span>
              </a>
            );
          })}
        </div>
      </LegalSection>

      <LegalSection title="للإعلان والشراكات">
        <div className="contact-ads-block">
          <p className="contact-ads-block__text">
            للاقتراحات أو الإعلان أو الشراكات، تواصل معنا عبر البريد أو إنستقرام.
          </p>
          <p className="contact-ads-block__meta" dir="ltr" lang="en">
            {CONTACT_EMAIL}
          </p>
          <p className="contact-ads-block__meta">
            إنستقرام شركة العبد المحسن للحج —{" "}
            <a href={INSTAGRAM_URL} dir="ltr" lang="en" onClick={openInstagram} target="_blank" rel="noopener noreferrer">
              @{INSTAGRAM_HANDLE}
            </a>
          </p>
          <div className="contact-email-card__actions">
            <a href={mailtoWithSubject("للإعلان والشراكات")} className="contact-btn contact-btn--primary">
              إرسال بريد
            </a>
            <a
              href={INSTAGRAM_URL}
              className="contact-btn contact-btn--ghost"
              target="_blank"
              rel="noopener noreferrer"
              onClick={openInstagram}
            >
              فتح إنستقرام
            </a>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="أوقات الرد">
        <ul className="contact-times">
          <li className="contact-time-row">
            <span>الاستفسارات العامة</span>
            <strong>1–3 أيام عمل</strong>
          </li>
          <li className="contact-time-row">
            <span>تصحيح المحتوى العلمي</span>
            <strong>3–5 أيام عمل</strong>
          </li>
          <li className="contact-time-row">
            <span>المشاكل التقنية</span>
            <strong>خلال 24 ساعة</strong>
          </li>
          <li className="contact-time-row">
            <span>طلبات حذف البيانات</span>
            <strong>خلال 7 أيام عمل</strong>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="الأسئلة الشائعة">
        <Accordion type="single" collapsible className="contact-faq" defaultValue="faq-0">
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} className="contact-faq__item">
              <AccordionTrigger className="contact-faq__trigger text-start hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="contact-faq__a">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </LegalSection>
    </LegalPageLayout>
  );
}
