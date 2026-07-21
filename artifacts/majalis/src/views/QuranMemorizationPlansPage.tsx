import "@/styles/quran-memorization-plans.css";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, CalendarDays, Check, Mic, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";

const MUSHAF_PAGES = 604;
const STORAGE_KEY = "majalis-quran-memorization-plan-v1";

type Plan = { id: string; title: string; description: string; sessions: number; kind: "memorization" | "review" };

const PLANS: Plan[] = [
  { id: "review-30", title: "مراجعة مكثفة، 30 يومًا", description: "للحافظ الذي يريد المرور على المصحف كاملًا؛ ليست وعدًا بحفظ جديد في شهر.", sessions: 30, kind: "review" },
  { id: "year-1", title: "خطة سنة", description: "ستة أيام أسبوعيًا ويوم مرن للمراجعة أو التعويض.", sessions: 312, kind: "memorization" },
  { id: "year-2", title: "خطة سنتين", description: "وتيرة متوازنة تناسب طالب العلم ومن لديه وقت يومي ثابت.", sessions: 624, kind: "memorization" },
  { id: "year-3", title: "خطة 3 سنوات", description: "مقدار صغير مع مساحة أوسع للتكرار والتثبيت.", sessions: 936, kind: "memorization" },
  { id: "year-5", title: "خطة 5 سنوات", description: "وتيرة هادئة للكبار والموظفين، بلا ضغط عند الانقطاع.", sessions: 1560, kind: "memorization" },
  { id: "children", title: "خطة الأطفال", description: "نصف صفحة في الجلسة مع التلقين والمراجعة بإشراف المعلّم.", sessions: 1208, kind: "memorization" },
  { id: "employee", title: "خطة الموظف", description: "صفحة في الجلسة وخمسة أيام أسبوعيًا، مع يومين مرنين.", sessions: 604, kind: "memorization" },
  { id: "student", title: "خطة طالب العلم", description: "صفحتان تقريبًا في الجلسة مع اختبار أسبوعي وربط بالتسميع.", sessions: 312, kind: "memorization" },
  { id: "stabilize", title: "خطة التثبيت", description: "للحافظ: دورة مراجعة من 120 جلسة مع اختبار أسبوعي للمواضع الضعيفة.", sessions: 120, kind: "review" },
];

type SavedState = { planId: string; completed: number };

function readSaved(): SavedState {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as SavedState | null;
    if (value && PLANS.some((plan) => plan.id === value.planId)) return value;
  } catch { /* تجاهل التخزين التالف وابدأ بحالة سليمة */ }
  return { planId: "year-2", completed: 0 };
}

export default function QuranMemorizationPlansPage() {
  const [saved, setSaved] = useState<SavedState>(readSaved);
  const plan = PLANS.find((item) => item.id === saved.planId) ?? PLANS[2];

  useEffect(() => {
    applyPageSeo({
      path: "/quran/memorization-plans",
      title: "خطط حفظ القرآن ومراجعته | المجلس العلمي",
      description: "خطط مرنة لحفظ القرآن ومراجعته حسب الوقت والعمر، مع متابعة محلية وأيام تعويض واختبار تسميع.",
      keywords: ["خطة حفظ القرآن", "مراجعة القرآن", "تثبيت الحفظ", "مصحف المدينة"],
    });
  }, []);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)), [saved]);

  const assignment = useMemo(() => {
    const index = Math.min(saved.completed, plan.sessions - 1);
    const start = Math.floor((index * MUSHAF_PAGES) / plan.sessions) + 1;
    const end = Math.max(start, Math.floor(((index + 1) * MUSHAF_PAGES) / plan.sessions));
    return { index, start, end };
  }, [plan, saved.completed]);

  const percentage = Math.min(100, Math.round((saved.completed / plan.sessions) * 100));
  const finished = saved.completed >= plan.sessions;

  return (
    <div className="ds-page qmp-page" dir="rtl">
      <PageHeader eyebrow="القرآن الكريم" title="خطط الحفظ والمراجعة" subtitle="اختر وتيرة واقعية، وغيّرها متى احتجت. التقدم يُحفظ على جهازك دون اشتراط حساب." />
      <section className="qmp-principles" aria-label="منهج الخطة">
        <span><Check size={16} aria-hidden="true" /> مصحف المدينة، 604 صفحات</span>
        <span><RotateCcw size={16} aria-hidden="true" /> مراجعة قريبة وبعيدة</span>
        <span><CalendarDays size={16} aria-hidden="true" /> يوم مرن للتعويض أسبوعيًا</span>
      </section>
      <section aria-labelledby="qmp-plans-title">
        <h2 id="qmp-plans-title" className="qmp-section-title">اختر الخطة</h2>
        <div className="qmp-plan-grid">
          {PLANS.map((item) => <button key={item.id} type="button" className={`qmp-plan${item.id === plan.id ? " is-active" : ""}`} aria-pressed={item.id === plan.id} onClick={() => setSaved({ planId: item.id, completed: 0 })}><strong>{item.title}</strong><span>{item.description}</span></button>)}
        </div>
      </section>
      <section className="ds-card qmp-today" aria-live="polite">
        <div className="qmp-today__head"><div><span className="qmp-kicker">{plan.kind === "review" ? "مراجعة" : "حفظ جديد"}</span><h2>{finished ? "أتممت الخطة، بارك الله في جهدك" : `جلسة اليوم ${assignment.index + 1}`}</h2></div><strong>{percentage}٪</strong></div>
        <div className="qmp-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><span style={{ width: `${percentage}%` }} /></div>
        {!finished && <p className="qmp-assignment"><BookOpen size={20} aria-hidden="true" /> من صفحة <strong>{assignment.start}</strong> إلى صفحة <strong>{assignment.end}</strong></p>}
        <p className="qmp-kind-note">كرّر المقطع حتى يستقر، ثم راجع مقدار الأمس وآخر مراجعة أسبوعية. إن فاتك يوم فتابع من هنا؛ لا يتراكم عليك مقدار عقابي.</p>
        <div className="qmp-actions">
          {!finished && <button type="button" className="ds-btn ds-btn--primary" onClick={() => setSaved((state) => ({ ...state, completed: Math.min(plan.sessions, state.completed + 1) }))}><Check size={17} /> أتممت الجلسة</button>}
          <Link href="/quran/recitation-test-ai" className="ds-btn ds-btn--secondary"><Mic size={17} /> اختبر تسميعك</Link>
          {saved.completed > 0 && <button type="button" className="ds-btn ds-btn--ghost" onClick={() => setSaved((state) => ({ ...state, completed: Math.max(0, state.completed - 1) }))}>تراجع عن آخر تسجيل</button>}
        </div>
      </section>
      <section className="ds-card qmp-guidance"><h2>نظام أسبوعي مقترح</h2><ol><li>حفظ المقدار الجديد مع التكرار والاستماع لقارئ متقن.</li><li>مراجعة مقدار اليوم السابق قبل بدء الجديد.</li><li>مراجعة تراكمية في نهاية الأسبوع واختبار مواضع التردد.</li><li>اترك يومًا مرنًا للتعويض أو الراحة، ثم أكمل دون إعادة الخطة من الصفر.</li></ol><p>هذه أداة تنظيمية وليست بديلًا عن المعلّم المتقن، ولا تقيس جودة الحفظ وحدها.</p></section>
    </div>
  );
}
