import { useEffect } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/discover-islam.css";

export default function HowToBecomeMuslimPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/discover-islam/how-to-convert",
      title: "كيف أصبح مسلمًا؟ | التعريف بالإسلام",
      description: "دليل هادئ وواضح لمعنى الدخول في الإسلام، والشهادتين، والخطوات الأولى — بلا ضغط وبلا استعجال.",
    });
  }, []);

  return (
    <div className="page-shell narrow dii-question-page">
      <PageHeader eyebrow="التعريف بالإسلام" title="كيف أصبح مسلمًا؟" subtitle="لا حاجة لموعد أو مناسبة أو وسيط — القرار قرارك وحدك، ومتى ما استقر قلبك عليه فالطريق بسيط وواضح." />

      <div className="ui-card">
        <span className="page-tag">معنى الدخول في الإسلام</span>
        <p className="page-desc dii-detailed-answer">
          الدخول في الإسلام هو إعلان الإيمان بالله وحده لا شريك له، وبأن محمدًا ﷺ رسوله وخاتم أنبيائه، وذلك بنطق الشهادتين
          مع اعتقاد معناهما بالقلب. لا يشترط لهذا حضور شخص آخر، ولا احتفال، ولا موافقة أي جهة أو مؤسسة — العلاقة بينك وبين الله مباشرة.
        </p>
      </div>

      <div className="ui-card" style={{ marginTop: "1rem" }}>
        <span className="page-tag">الشهادتان</span>
        <p className="dii-shahada-ar">أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ</p>
        <p className="dii-shahada-translit">Ash-hadu an lā ilāha illa Allah, wa ash-hadu anna Muhammadan rasūlu Allah</p>
        <p className="page-desc">ومعناها: أشهد أنه لا معبود بحق إلا الله، وأشهد أن محمدًا رسول الله أرسله للناس كافة.</p>
      </div>

      <div className="ui-card" style={{ marginTop: "1rem" }}>
        <span className="page-tag">ما الذي يجب الإيمان به؟</span>
        <ul className="dii-belief-list">
          <li>الإيمان بالله وحده، وأنه لا شريك له في ألوهيته وربوبيته وأسمائه وصفاته.</li>
          <li>الإيمان بجميع الملائكة.</li>
          <li>الإيمان بجميع الكتب المنزلة من عند الله، وأن القرآن آخرها وناسخها.</li>
          <li>الإيمان بجميع الرسل، وأن محمدًا ﷺ خاتمهم.</li>
          <li>الإيمان باليوم الآخر: البعث والحساب والجزاء.</li>
          <li>الإيمان بالقدر خيره وشرّه.</li>
        </ul>
        <p className="page-desc">لا يُشترط الإحاطة بكل تفاصيل هذه الأركان قبل النطق بالشهادتين — يكفي الإيمان الإجمالي بها، والتفصيل يأتي بالتعلم التدريجي بعد ذلك.</p>
      </div>

      <div className="ui-card" style={{ marginTop: "1rem" }}>
        <span className="page-tag">أسئلة شائعة قبل أن تبدأ</span>
        <div className="dii-faq-mini">
          <p><strong>هل يجب تغيير اسمي؟</strong> لا يلزم ذلك إلا إذا كان الاسم يحمل معنى محرَّمًا (كعبودية لغير الله)، وحينها يُستحب تغييره فقط، لا يُشترط فورًا.</p>
          <p><strong>هل يجب أن أخبر أسرتي فورًا؟</strong> لا. إخبار من حولك قرار شخصي بالكامل، ولك أن تختار التوقيت والطريقة الأنسب لظروفك، أو ألا تخبر أحدًا إن كان ذلك أسلم لك.</p>
          <p><strong>ماذا لو كنت أخاف على نفسي؟</strong> سلامتك أولوية. تواصل سرّي مع داعية موثوق يمكن أن يساعدك على التفكير في الخطوات المناسبة لظروفك الخاصة دون أي إلزام بالإفصاح لأحد.</p>
          <p><strong>هل يلزمني تعلّم كل شيء دفعة واحدة؟</strong> لا إطلاقًا. الدين يُتعلَّم تدريجيًا طوال العمر، ومسار «المسلم الجديد» صُمِّم خصيصًا لهذا التدرّج.</p>
        </div>
      </div>

      <div className="ui-card" style={{ marginTop: "1rem" }}>
        <span className="page-tag">الخطوات العملية الأولى</span>
        <ol className="dii-belief-list">
          <li>الاغتسال (غُسل كامل للجسد) — يُستحب بعد نطق الشهادتين، وليس شرطًا لصحة الإسلام نفسه.</li>
          <li>تعلّم الوضوء والصلوات الخمس تدريجيًا — ابدأ بصلاة واحدة تتقنها ثم أضف غيرها.</li>
          <li>تعلّم سورة الفاتحة، فهي ركن في كل صلاة.</li>
          <li>البحث عن مسجد أو مجتمع مسلم قريب للتعارف والدعم، إن رغبت في ذلك.</li>
        </ol>
      </div>

      <div className="dii-contact-cta ui-card" style={{ marginTop: "1.5rem" }}>
        <h2>مستعدّ للخطوة التالية؟</h2>
        <p>يمكنك متابعة مسار المسلم الجديد المُصمَّم ليأخذك خطوة بخطوة، أو التحدث سرًا مع داعية أولًا إن احتجت لذلك.</p>
        <div className="dii-cta-row">
          <Link href="/discover-islam/new-muslim" className="asp-run-btn">ابدأ مسار المسلم الجديد</Link>
          <Link href="/discover-islam/contact" className="asp-add-btn">تواصل سرّي مع داعية</Link>
        </div>
      </div>
    </div>
  );
}
