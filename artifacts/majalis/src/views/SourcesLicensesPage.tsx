import { useEffect } from "react";
import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";

type SourceRow = {
  name: string;
  desc: string;
  status: "ممنوح" | "جزئي" | "مطلوب" | "غير محسوم" | "معطّل";
};

const QURAN_SOURCES: SourceRow[] = [
  {
    name: "خطوط QPC V2 (مجمع الملك فهد / QUL)",
    desc: "عرض المصحف صفحةً بصفحة. الاستخدام في تطبيق متجر يحتاج تأكيد توزيع — موثّق في docs/LICENSES.md.",
    status: "مطلوب",
  },
  {
    name: "Tanzil / AlQuran Cloud — نص عثماني",
    desc: "نص حفص وبيانات السور المحلية. إعادة التوزيع الكامل قد تتطلب موافقة Tanzil.",
    status: "جزئي",
  },
  {
    name: "Quran.com / QUL — تخطيط الصفحات",
    desc: "بيانات تخطيط QPC V2 عبر واجهات qurancdn. لا صور مصحف المدينة في الحزمة.",
    status: "مطلوب",
  },
  {
    name: "Amiri Quran (OFL)",
    desc: "خط احتياطي يونيكود للعرض خارج مجسمات QPC.",
    status: "ممنوح",
  },
];

const AUDIO_SOURCES: SourceRow[] = [
  {
    name: "everyayah.com",
    desc: "بث تلاوات آية بآية (روابط خارجية؛ لا تُضمَّن ملفات صوت في الحزمة).",
    status: "جزئي",
  },
  {
    name: "mp3quran.net",
    desc: "بث سور كاملة وتنزيل اختياري محلي بحدود حجم واضحة.",
    status: "جزئي",
  },
  {
    name: "mohsalvi/adhan-audio (jsDelivr)",
    desc: "بث أذان باسم النمط فقط بلا نسبة شخصية حتى التثبّت.",
    status: "جزئي",
  },
];

const CONTENT_SOURCES: SourceRow[] = [
  {
    name: "Quran.com API — تفاسير",
    desc: "الميسّر وغيره عبر جلب حي مع إسناد؛ لا حزمة تفاسير كاملة دون إذن.",
    status: "جزئي",
  },
  {
    name: "حصن المسلم (إشارات أذكار)",
    desc: "حقوق الجمع والترتيب للمؤلف/الناشر؛ يُعرض مع الإسناد ويُطلب إذن الطبعة قبل التوسعة.",
    status: "مطلوب",
  },
  {
    name: "dorar.net / sunnah.com",
    desc: "مراجع تخريج وعرض أحاديث مع العزو.",
    status: "جزئي",
  },
  {
    name: "aladhan.com",
    desc: "حساب مواقيت الصلاة والتقويم الهجري.",
    status: "جزئي",
  },
  {
    name: "مكتبة المنصة (~١٧٣ كتابًا)",
    desc: "فهرسة فردية ناقصة — معظمها قيد المراجعة ولا تُسوَّق كمرخّصة حتى الجرد.",
    status: "غير محسوم",
  },
  {
    name: "shamela.ws · dar-alifta · binbaz · iifa",
    desc: "مراجع تراث وفتاوى وقرارات مع العزو عند الاقتباس.",
    status: "جزئي",
  },
];

function StatusBadge({ status }: { status: SourceRow["status"] }) {
  return (
    <span className="legal-license-status" data-status={status}>
      {status}
    </span>
  );
}

function SourceList({ rows }: { rows: SourceRow[] }) {
  return (
    <ul className="legal-license-list">
      {rows.map((s) => (
        <li key={s.name}>
          <div className="legal-license-list__head">
            <strong dir="auto">{s.name}</strong>
            <StatusBadge status={s.status} />
          </div>
          <span>{s.desc}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SourcesLicensesPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/sources",
      title: "المصادر والتراخيص | المجلس العلمي",
      description:
        "جرد مصادر البيانات والأصول الرقمية في المجلس العلمي وحالة الإذن والترخيص لكل أصل.",
      keywords: ["مصادر", "تراخيص", "QPC", "المجلس العلمي", "حقوق"],
    });
  }, []);

  return (
    <LegalPageLayout eyebrow="الشفافية" title="المصادر والتراخيص" updatedAt="2026-08-11">
      <LegalSection title="الغرض من هذه الصفحة">
        <p>
          هذه الصفحة ملخص علني لجرد الحقوق. الجدول الكامل وحالات الإذن في{" "}
          <code dir="ltr">docs/LICENSES.md</code>، مع{" "}
          <code dir="ltr">CREDITS.md</code> و<code dir="ltr">LICENSE_RISKS.md</code>. المنهجية في{" "}
          <Link href="/methodology">منهجية التوثيق</Link>.
        </p>
        <p>
          أي أصل حالته «مطلوب» أو «غير محسوم» لا يُوسَّع في إصدار المتجر حتى يُحسم الإذن أو يُستبدل.
        </p>
      </LegalSection>

      <LegalSection title="المصحف والنص والخطوط">
        <SourceList rows={QURAN_SOURCES} />
      </LegalSection>

      <LegalSection title="التلاوة والأذان">
        <SourceList rows={AUDIO_SOURCES} />
        <p>
          التشغيل الافتراضي بثّ حي من{" "}
          <a href="https://everyayah.com" target="_blank" rel="noopener noreferrer">
            everyayah.com
          </a>{" "}
          و{" "}
          <a href="https://mp3quran.net" target="_blank" rel="noopener noreferrer">
            mp3quran.net
          </a>
          . لا تُعاد استضافة الملفات على خوادمنا. مفتاح تعطيل:{" "}
          <code dir="ltr">/data/quran-audio-remote.json</code>.
        </p>
      </LegalSection>

      <LegalSection title="التفاسير والمحتوى والمكتبة">
        <SourceList rows={CONTENT_SOURCES} />
        <p>
          تفسير صوتي: معطّل عمدًا (كتالوج فارغ) حتى توثيق النسبة والترخيص لكل مقطع.
        </p>
      </LegalSection>

      <LegalSection title="البرمجيات مفتوحة المصدر">
        <p>
          واجهة المنصة تستخدم مكتبات (React وVite وCapacitor وغيرها) وفق تراخيص تساهلية
          (MIT / Apache / BSD / ISC…). بوابة CI <code dir="ltr">test:licenses</code> ترفض
          إدخال تبعية بترخيص GPL/AGPL/SSPL صِرف في شجرة الحزم.
        </p>
      </LegalSection>

      <LegalSection title="التراخيص والاستخدام">
        <ul>
          <li>
            واجهة المجلس العلمي ومكوّناتها البرمجية ملك للمنصة، ويُسمح بالتصفح الشخصي
            والتعليمي وفق <Link href="/terms">شروط الاستخدام</Link>.
          </li>
          <li>
            نصوص القرآن تُعرض وفق مصادرها؛ لا ندّعي حقوقًا حصرية على النص العثماني.
          </li>
          <li>
            الأحاديث والفتاوى تبقى منسوبة لمصادرها؛ الاقتباس للتعليم مع العزو.
          </li>
          <li>
            حصن المسلم وغيره من المجاميع الحديثة لها حقوق جمع وترتيب — لا إعادة نشر كمنتج مستقل بلا إذن.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="الإبلاغ عن خطأ في النسبة أو الترخيص">
        <p>
          راسلنا عبر <Link href="/contact">تواصل معنا</Link> أو استخدم زر الإبلاغ أسفل المادة.
          بلاغات الحقوق تُعالَج بأولوية قصوى.
        </p>
      </LegalSection>

      <LegalBackLink />
      <ShareButtons
        title="المصادر والتراخيص — المجلس العلمي"
        url="https://majlisilm.com/sources"
      />
    </LegalPageLayout>
  );
}
