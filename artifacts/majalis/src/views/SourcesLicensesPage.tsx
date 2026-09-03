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
    desc: "نص حفص وبيانات السور. إعادة التوزيع الكامل قد تتطلب موافقة Tanzil.",
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

const HADITH_SOURCES: SourceRow[] = [
  {
    name: "fawazahmed0/hadith-api (صحيح البخاري ومسلم)",
    desc: "نصوص عربية مع رقم الحديث والكتاب. الصحة منسوبة للمجموعة لا لكل سند على حدة.",
    status: "جزئي",
  },
  {
    name: "sunnah.com / dorar.net",
    desc: "مراجع تخريج وروابط خارجية للكتب الستة وغيرها.",
    status: "جزئي",
  },
];

const ADHKAR_SOURCES: SourceRow[] = [
  {
    name: "حصن المسلم — إشارات أذكار",
    desc: "نصوص الأذكار مع العزو (المصدر/المرجع). حقوق الجمع والترتيب للمؤلف/الناشر.",
    status: "مطلوب",
  },
  {
    name: "الأحاديث في الأذكار",
    desc: "كل ذكر مرتبط بحديث يُعرض مع كتابه ورقمه والحكم عند الحاجة — لا «السنة النبوية» كمصدر وحيد.",
    status: "جزئي",
  },
];

const LESSON_SOURCES: SourceRow[] = [
  {
    name: "حسابات إنستغرام/تليجرام/مواقع خارجية",
    desc: "الدروس المستوردة: عنوان، شيخ، وقت، مكان، ورابط المنشور الأصلي فقط — لا نص طويل ولا صور كاملة.",
    status: "جزئي",
  },
  {
    name: "دليل الجهات (/sources)",
    desc: "فهرسة الحسابات مع روابط مباشرة. المحتوى مملوك لأصحابه؛ سُنّة وسيط روابط.",
    status: "ممنوح",
  },
];

const TAFSIR_SOURCES: SourceRow[] = [
  {
    name: "Quran.com API — تفاسير",
    desc: "الميسّر وغيره عبر جلب حي مع إسناد؛ لا حزمة تفاسير كاملة دون إذن.",
    status: "جزئي",
  },
];

const LIBRARY_SOURCES: SourceRow[] = [
  {
    name: "فهرس مصادر المنصة (~١٧٣ كتابًا)",
    desc: "بطاقات مرجعية (عنوان/مؤلف/وصف) أو رابط خارجي للمصدر — لا نص كامل مستضاف إلا بترخيص صريح.",
    status: "غير محسوم",
  },
  {
    name: "shamela.ws · sunnah.com · dar-alifta",
    desc: "روابط قراءة خارجية عند توفرها؛ يُوضّح أنها روابط للمصدر.",
    status: "جزئي",
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
      path: "/data-licenses",
      title: "المصادر والتراخيص | سُنّة",
      description:
        "مصادر القرآن والحديث والأذكار والدروس والمكتبة في سُنّة — روابط وتراخيص دون وعود عامة.",
      keywords: ["مصادر", "تراخيص", "QPC", "سُنّة", "حقوق"],
    });
  }, []);

  return (
    <LegalPageLayout eyebrow="الشفافية" title="المصادر والتراخيص" updatedAt="2026-09-01">
      <LegalSection title="الغرض">
        <p>
          ملخص علني لمصادر البيانات وحالة الإذن. التفاصيل في{" "}
          <code dir="ltr">docs/LICENSES.md</code> و{" "}
          <Link href="/methodology">منهجية التوثيق</Link>.
          {" "}
          <Link href="/sources">دليل الجهات</Link> للحسابات الخارجية.
        </p>
        <p>
          <strong>لا إعادة استضافة:</strong> الدروس والمنشورات الخارجية تُعرض كمعلومة وجدول
          ورابط مصدر — لا نص طويل ولا صور كاملة من إنستغرام/تليجرام.
        </p>
      </LegalSection>

      <LegalSection title="القرآن والمصحف">
        <SourceList rows={QURAN_SOURCES} />
      </LegalSection>

      <LegalSection title="الأحاديث">
        <SourceList rows={HADITH_SOURCES} />
        <p>
          كل حديث يُعرض مع كتابه ورقمه ومصدره. الصحيحان: الصحة منسوبة لعضوية الكتاب.
          صفحات الضعيف/الموضوع للتنبيه التعليمي فقط.
        </p>
      </LegalSection>

      <LegalSection title="الأذكار">
        <SourceList rows={ADHKAR_SOURCES} />
      </LegalSection>

      <LegalSection title="التفاسير">
        <SourceList rows={TAFSIR_SOURCES} />
      </LegalSection>

      <LegalSection title="الدروس والحلقات">
        <SourceList rows={LESSON_SOURCES} />
        <p>
          روابط الدروس تحيل للمصدر الأصلي. لا نعيد نشر المنشور كاملًا.
          راجع <Link href="/sources">دليل الجهات</Link>.
        </p>
      </LegalSection>

      <LegalSection title="المكتبة">
        <SourceList rows={LIBRARY_SOURCES} />
        <p>
          الكتب إما بطاقة مرجعية (عنوان/مؤلف) أو رابط خارجي للقراءة.
          لا نعرض كتابًا كاملًا دون حق عرض صريح.
        </p>
      </LegalSection>

      <LegalSection title="التلاوة والأذان">
        <SourceList rows={AUDIO_SOURCES} />
        <p>لا تُعاد استضافة الملفات على خوادمنا — بث حي من المصدر.</p>
      </LegalSection>

      <LegalSection title="البرمجيات مفتوحة المصدر">
        <p>
          واجهة المنصة (React, Vite, Capacitor…) وفق تراخيص تساهلية.
          بوابة CI <code dir="ltr">test:licenses</code> ترفض GPL/AGPL/SSPL صِرف.
        </p>
      </LegalSection>

      <LegalSection title="الإبلاغ">
        <p>
          بلاغات الحقوق أو خطأ في النسبة عبر{" "}
          <Link href="/contact">تواصل معنا</Link> — أولوية قصوى.
        </p>
      </LegalSection>

      <LegalBackLink />
      <ShareButtons
        title="المصادر والتراخيص — سُنّة"
        url="https://www.ssunnah.com/data-licenses"
      />
    </LegalPageLayout>
  );
}
