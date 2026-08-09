import { useEffect } from "react";
import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";

const DATA_SOURCES = [
  { name: "dorar.net", desc: "موسوعة الدرر السنية للأحاديث والآثار والتخريج." },
  { name: "sunnah.com", desc: "موسوعة الأحاديث النبوية مع ترجمات متعددة." },
  { name: "aladhan.com", desc: "خدمة حساب مواقيت الصلاة والتقويم الهجري." },
  { name: "alquran.cloud", desc: "بيانات القرآن الكريم بالرسم العثماني وصفحات المصحف." },
  { name: "everyayah.com", desc: "بث تلاوات آية بآية (روابط خارجية؛ لا تُضمَّن ملفات صوت في الحزمة)." },
  { name: "mp3quran.net", desc: "بث سور كاملة وتنزيل اختياري محلي بحدود حجم واضحة." },
  {
    name: "mohsalvi/adhan-audio (jsDelivr)",
    desc: "بث تسجيلات أذان (عام/فجر). تُعرض حاليًا باسم النمط فقط بلا نسبة شخصية حتى التثبّت؛ التفاصيل في CREDITS.md.",
  },
  { name: "shamela.ws", desc: "المكتبة الشاملة — تراث إسلامي رقمي." },
  { name: "dar-alifta.net", desc: "دار الإفتاء المصرية — فتاوى رسمية منشورة." },
  { name: "binbaz.org.sa", desc: "موقع الشيخ ابن باز — فتاوى ومواد محقَّقة." },
  { name: "iifa-fiqh.org", desc: "مجمع الفقه الإسلامي الدولي — قرارات وتوصيات." },
];

export default function SourcesLicensesPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/sources",
      title: "المصادر والتراخيص | المجلس العلمي",
      description:
        "مصادر البيانات والمراجع الخارجية المستخدمة في المجلس العلمي، وملاحظات الترخيص والاستخدام العادل.",
      keywords: ["مصادر", "تراخيص", "المجلس العلمي", "مراجع"],
    });
  }, []);

  return (
    <LegalPageLayout eyebrow="الشفافية" title="المصادر والتراخيص" updatedAt="2026-08-09">
      <LegalSection title="الغرض من هذه الصفحة">
        <p>
          نعرض هنا أبرز المصادر الخارجية التي تُستفاد منها بيانات عامة أو روابط
          مراجعة، دون ادّعاء ملكية نصوصها الكاملة. التفصيل المنهجي للمراجعة
          والاعتماد في صفحة <Link href="/methodology">منهجية التوثيق</Link>.
        </p>
      </LegalSection>

      <LegalSection title="مصادر بيانات ومراجع">
        <ul>
          {DATA_SOURCES.map((s) => (
            <li key={s.name}>
              <strong dir="ltr">{s.name}</strong> — {s.desc}
            </li>
          ))}
        </ul>
        <p>
          أي مادة تُعرض في المنصة تُرفق بمصدرها قدر الإمكان؛ وما لم يُراجع بشريًا
          يبقى موسومًا «قيد المراجعة».
        </p>
      </LegalSection>

      <LegalSection title="التلاوة الصوتية">
        <p>
          التشغيل الافتراضي بثّ حي من{" "}
          <a href="https://everyayah.com" target="_blank" rel="noopener noreferrer">
            everyayah.com
          </a>{" "}
          (آية بآية) و{" "}
          <a href="https://mp3quran.net" target="_blank" rel="noopener noreferrer">
            mp3quran.net
          </a>{" "}
          (سورة كاملة). لا تُحزَم ملفات صوت داخل التطبيق ولا تُعاد استضافتها على
          خوادمنا. التنزيل دون اتصال اختياري وبسقف تخزين موضّح في الإعدادات. قائمة
          القرّاء ومجلداتهم في <code dir="ltr">CREDITS.md</code>. مفتاح تعطيل تشغيلي
          لإخفاء قارئ أو مصدر:{" "}
          <code dir="ltr">/data/quran-audio-remote.json</code>.
        </p>
      </LegalSection>

      <LegalSection title="صوت الأذان">
        <p>
          بث حي من مستودع{" "}
          <a
            href="https://github.com/mohsalvi/adhan-audio"
            target="_blank"
            rel="noopener noreferrer"
          >
            mohsalvi/adhan-audio
          </a>{" "}
          عبر jsDelivr. لا تُحزَم ملفات الأذان في الثنائي. ما لم تُتحقَّق نسبة
          التسجيل إلى مؤذن بعينه يُعرض باسم النمط فقط (مثل «أذان الحرم المكي»).
          جدول التسجيلات وحالة الترخيص في <code dir="ltr">CREDITS.md</code> و{" "}
          <code dir="ltr">LICENSE_RISKS.md</code>. مفتاح تعطيل تشغيلي:{" "}
          <code dir="ltr">/data/adhan-audio-remote.json</code>.
        </p>
      </LegalSection>

      <LegalSection title="التراخيص والاستخدام">
        <ul>
          <li>
            واجهة المجلس العلمي ومكوّناتها البرمجية ملك للمنصة، ويُسمح بالتصفح
            الشخصي والتعليمي وفق{" "}
            <Link href="/terms">شروط الاستخدام</Link>.
          </li>
          <li>
            نصوص القرآن الكريم وبيانات الرسم العثماني تُعرض وفق مصادرها الموثّقة؛
            لا ندّعي حقوقًا حصرية عليها.
          </li>
          <li>
            الأحاديث والفتاوى والقرارات المستوردة تبقى منسوبة لمصادرها؛ الاقتباس
            للتعليم مع العزو، لا لإعادة النشر كمنتج مستقل بلا إذن أصحاب الحقوق
            عند الاقتضاء.
          </li>
          <li>
            مكتبات الواجهة مفتوحة المصدر تُستخدم وفق تراخيصها (MIT وغيرها) كما
            تظهر في مستودع المشروع.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="الإبلاغ عن خطأ في النسبة">
        <p>
          إن وجدت نسبة ناقصة أو خاطئة، راسلنا عبر{" "}
          <Link href="/contact">تواصل معنا</Link> أو استخدم زر الإبلاغ أسفل المادة.
        </p>
      </LegalSection>

      <LegalBackLink />
      <ShareButtons
        title="المصادر والتراخيص — المجلس العلمي"
        url="https://www.majlisilm.com/sources"
      />
    </LegalPageLayout>
  );
}
