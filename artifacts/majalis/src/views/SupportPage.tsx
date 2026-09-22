import { useEffect, useState } from "react";
import { Check, Copy, Mail, MessageSquare, AlertTriangle, Lightbulb, Clock } from "lucide-react";
import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UtilityScreen } from "@/components/design-system/screens";
import { applyPageSeo } from "@/lib/seo";
import { CONTACT_EMAIL, mailtoWithSubject, absoluteUrl } from "@/lib/site-config";
import "@/styles/pages/contact.css";
import "@/styles/pages/support.css";
import "@/styles/pages/learn-legal-v2.css";

const SUPPORT_SECTIONS = [
  {
    id: "tech",
    Icon: MessageSquare,
    title: "الدعم الفني",
    body: "إذا واجهت مشكلة في التطبيق أو لديك ملاحظة أو اقتراح، يسعدنا التواصل معك.",
    subject: "دعم فني",
  },
  {
    id: "report",
    Icon: AlertTriangle,
    title: "الإبلاغ عن مشكلة",
    body: "أرسل وصف المشكلة مع نوع الجهاز وإصدار التطبيق عبر البريد الرسمي.",
    subject: "إبلاغ عن مشكلة",
  },
  {
    id: "ideas",
    Icon: Lightbulb,
    title: "الاقتراحات",
    body: "نرحب بالأفكار التي تساعد على تطوير سُنّة وتحسين تجربة المستخدم.",
    subject: "اقتراح",
  },
  {
    id: "reply",
    Icon: Clock,
    title: "الرد على الاستفسارات",
    body: "سنبذل جهدنا للرد على الرسائل في أقرب وقت ممكن.",
    subject: "استفسار",
  },
] as const;

const SUPPORT_FAQ = [
  {
    q: "ماذا أكتب عند الإبلاغ عن مشكلة؟",
    a: "صف ما حدث، ومتى يظهر، ونوع الجهاز (iPhone / iPad) وإصدار التطبيق إن أمكن، مع لقطة شاشة عند الحاجة.",
  },
  {
    q: "هل يمكنني اقتراح ميزة جديدة؟",
    a: "نعم. اختر «اقتراح» أو راسلنا بعنوان واضح يصف الفكرة وفائدتها للمستخدم.",
  },
  {
    q: "كم يستغرق الرد؟",
    a: "نراجع الرسائل بأسرع ما يمكن، وقد يختلف الوقت حسب حجم الطلبات وطبيعة المشكلة.",
  },
] as const;

export default function SupportPage() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/support",
      title: "الدعم الفني | سُنّة",
      description:
        "تواصل مع فريق سُنّة للدعم الفني والإبلاغ عن المشكلات والاقتراحات والاستفسارات.",
      keywords: ["دعم فني", "سُنّة", "تواصل", "إبلاغ", "اقتراحات", "استفسارات"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "الدعم الفني | سُنّة",
          url: absoluteUrl("/support"),
          description:
            "تواصل مع فريق سُنّة للدعم الفني والإبلاغ عن المشكلات والاقتراحات والاستفسارات.",
          about: { "@type": "Organization", name: "سُنّة", url: absoluteUrl("/") },
          email: CONTACT_EMAIL,
        },
      ],
    });
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <UtilityScreen compose="mark">
      <LegalPageLayout
        eyebrow="سُنّة"
        title="الدعم الفني"
        density="medium"
        className="contact-page support-page"
      >
        <p className="contact-lead support-page__lead">
          نساعدك في حل المشكلات والإجابة عن الاستفسارات المتعلقة بتطبيق سُنّة.
        </p>

        <LegalSection title="طرق التواصل">
          <div className="contact-channels">
            <div className="contact-email-card">
              <div className="contact-email-card__head">
                <span className="contact-email-card__icon" aria-hidden="true">
                  <Mail size={18} strokeWidth={1.9} />
                </span>
                <div className="contact-email-card__meta">
                  <p className="contact-email-card__label">البريد الرسمي</p>
                  <p className="contact-email-card__address" dir="ltr" lang="en">
                    <a
                      href={mailtoWithSubject("دعم فني — سُنّة")}
                      className="contact-email-card__link"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                </div>
              </div>
              <div className="contact-email-card__actions">
                <a
                  href={mailtoWithSubject("دعم فني — سُنّة")}
                  className="contact-btn contact-btn--primary"
                >
                  إرسال بريد
                </a>
                <button type="button" className="contact-btn contact-btn--ghost" onClick={copyEmail}>
                  {copied ? (
                    <Check size={15} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Copy size={15} strokeWidth={2} aria-hidden="true" />
                  )}
                  {copied ? "تم النسخ" : "نسخ"}
                </button>
              </div>
            </div>
          </div>
        </LegalSection>

        <LegalSection title="كيف نساعدك؟">
          <div className="support-page__sections" role="list">
            {SUPPORT_SECTIONS.map((section) => {
              const Icon = section.Icon;
              return (
                <section
                  key={section.id}
                  className="support-page__card"
                  role="listitem"
                  aria-labelledby={`support-sec-${section.id}`}
                >
                  <div className="support-page__card-head">
                    <span className="support-page__card-icon" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                    <h2 id={`support-sec-${section.id}`} className="support-page__card-title">
                      {section.title}
                    </h2>
                  </div>
                  <p className="support-page__card-body">{section.body}</p>
                  <a href={mailtoWithSubject(section.subject)} className="support-page__card-cta">
                    راسلنا · {section.subject}
                  </a>
                </section>
              );
            })}
          </div>
        </LegalSection>

        <LegalSection title="أسئلة شائعة">
          <Accordion type="single" collapsible className="contact-faq support-page__faq" defaultValue="sf-0">
            {SUPPORT_FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`sf-${i}`} className="contact-faq__item">
                <AccordionTrigger className="contact-faq__trigger text-start hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="contact-faq__a">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </LegalSection>
      </LegalPageLayout>
    </UtilityScreen>
  );
}
