import { Link } from "wouter";
import { isAssistantFeatureEnabled } from "@/lib/assistant-feature-flag";
import AssistantPage from "@/views/AssistantPage";

/** بوابة منتج: المساعد خلف علم حتى اكتمال التوثيق. */
export default function AssistantGate() {
  if (isAssistantFeatureEnabled()) {
    return <AssistantPage />;
  }
  return (
    <main className="page-shell narrow" dir="rtl">
      <p className="assistant-intro">سُنّة</p>
      <h1 className="assistant-title">المساعد العلمي</h1>
      <p className="assistant-intro">
        المساعد قيد المراجعة الداخلية حاليًا لضمان دقة المصادر. يمكنك استخدام البحث الموثّق بدلًا منه.
      </p>
      <Link href="/search" className="assistant-intro">
        الانتقال إلى البحث
      </Link>
    </main>
  );
}
