import { Link } from "wouter";
import { isAssistantFeatureEnabled } from "@/lib/assistant-feature-flag";
import AssistantPage from "@/views/AssistantPage";
import "@/styles/pages/assistant.css";

const EXAMPLES = [
  { q: "ما الفرق بين الفرض والسنة؟", href: "/search?q=%D9%81%D8%B1%D8%B6%20%D9%88%D8%B3%D9%86%D8%A9" },
  { q: "أين أجد أحكام الطهارة؟", href: "/fiqh" },
  { q: "كيف أصلّي صلاة الاستخارة؟", href: "/search?q=%D8%A7%D8%B3%D8%AA%D8%AE%D8%A7%D8%B1%D8%A9" },
];

/** بوابة منتج: المساعد خلف علم — لا Route فارغة في الإنتاج. */
export default function AssistantGate() {
  if (isAssistantFeatureEnabled()) {
    return <AssistantPage />;
  }

  return (
    <main className="assistant-gate page-shell narrow" dir="rtl">
      <header className="assistant-gate__head">
        <p className="assistant-gate__brand">سُنّة</p>
        {/* بوابة التباين تثبّت .assistant-title / .assistant-intro على /assistant */}
        <h1 className="assistant-gate__title assistant-title">المساعد العلمي</h1>
        <p className="assistant-gate__lede assistant-intro">
          البحث الموثّق متاح الآن من هذه الصفحة. المساعد التحاوري يُفتح عند تفعيل الميزة.
          يمكنك استخدام البحث الموثّق والأقسام العلمية.
        </p>
      </header>

      <div className="assistant-gate__actions">
        <Link href="/search" className="assistant-gate__cta assistant-gate__cta--primary">
          البحث الموثّق
        </Link>
        <Link href="/sections" className="assistant-gate__cta">
          استكشف الأقسام
        </Link>
      </div>

      <section className="assistant-gate__examples" aria-label="أمثلة للبحث">
        <h2>جرّب البحث عن</h2>
        <ul>
          {EXAMPLES.map((ex) => (
            <li key={ex.href}>
              <Link href={ex.href}>{ex.q}</Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="assistant-gate__note">
        عند التفعيل سيعرض المساعد إجابات مرتبطة بمصادر سُنّة فقط، ولن يفتي أو يكمل آيات أو يحكم على أحاديث بلا توثيق.
      </p>
    </main>
  );
}
