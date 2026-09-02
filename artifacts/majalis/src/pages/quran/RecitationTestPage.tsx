/** صفحة رقيقة — المسار المبسّط عبر RecitationModule، المتقدم عبر RecitationTestView */
import { ArrowRight } from "lucide-react";
import { Link, useSearch } from "wouter";
import { goBackOrFallback } from "@/lib/navigation-back";
import {
  AI_TARTEEL_DISABLED_MESSAGE,
  isAiTarteelEnabled,
} from "@/lib/recitation-ai/feature-flag";
import RecitationModule from "@/components/recitation/RecitationModule";
import RecitationTestViewInner from "@/pages/quran/ui/RecitationTestView";
import "@/styles/recitation-ai.css";

export default function RecitationTestPage() {
  const search = useSearch();
  const advanced = new URLSearchParams(search).get("advanced") === "1";

  if (!isAiTarteelEnabled()) {
    return (
      <div className="rai-shell">
        <button
          type="button"
          className="rai-back-btn"
          onClick={() => goBackOrFallback("/quran/recitation-test-ai")}
          aria-label="رجوع"
        >
          <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
          رجوع
        </button>
        <div className="rai-page" role="alert">
          <div className="rai-header">
            <h1 className="rai-header__title">التلاوة</h1>
            <p className="rai-header__sub">{AI_TARTEEL_DISABLED_MESSAGE}</p>
          </div>
          <Link href="/quran-hub" className="rai-start-btn">
            العودة لمركز القرآن الكريم
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rai-shell">
      <button
        type="button"
        className="rai-back-btn"
        onClick={() => goBackOrFallback("/quran/recitation-test-ai")}
        aria-label="رجوع"
      >
        <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
        رجوع
      </button>
      {advanced ? <RecitationTestViewInner /> : <RecitationModule />}
    </div>
  );
}
