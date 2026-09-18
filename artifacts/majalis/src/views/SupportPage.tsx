import { useEffect, useState } from "react";
import { Check, Copy, Mail, MessageSquare, AlertTriangle, Lightbulb, Clock } from "lucide-react";
import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { UtilityScreen } from "@/components/design-system/screens";
import { applyPageSeo } from "@/lib/seo";
import { CONTACT_EMAIL, mailtoWithSubject, absoluteUrl } from "@/lib/site-config";
import "@/styles/pages/contact.css";
import "@/styles/pages/support.css";

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
    body: "يمكنك إرسال وصف المشكلة مع معلومات جهازك وإصدار التطبيق إلى البريد الرسمي.",
    subject: "إبلاغ عن مشكلة",
  },
  {
    id: "ideas",
    Icon: Lightbulb,
    title: "الاقتراحات",
    body: "نرحب بالاقتراحات والأفكار التي تساعد على تطوير سُنّة وتحسين تجربة المستخدم.",
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

        <LegalSection title="التواصل">
          <div className="contact-channels">
            <div className="contact-email-card">
              <div className="contact-email-card__head">
                <span className="contact-email-card__icon" aria-hidden="true">
                  <Mail size={18} strokeWidth={1.9} />
                </span>
                <div className="contact-email-card__meta">
                  <p className="contact-email-card__label">للدعم الفني والاستفسارات</p>
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
                {section.id === "report" ? (
                  <p className="support-page__card-email" dir="ltr" lang="en">
                    <a href={mailtoWithSubject(section.subject)} className="contact-email-card__link">
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                ) : (
                  <a
                    href={mailtoWithSubject(section.subject)}
                    className="support-page__card-cta"
                  >
                    راسلنا · {section.subject}
                  </a>
                )}
              </section>
            );
          })}
        </div>
      </LegalPageLayout>
    </UtilityScreen>
  );
}
