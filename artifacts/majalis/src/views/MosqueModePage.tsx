import { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { applyPageSeo } from "@/lib/seo";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

const QUICK_LINKS = [
  { href: "/quran", icon: "📖", label: "القرآن الكريم" },
  { href: "/adhkar", icon: "📿", label: "الأذكار" },
  { href: "/qibla", icon: "🧭", label: "القبلة" },
  { href: "/prayer-times", icon: "🕌", label: "مواقيت الصلاة" },
  { href: "/tasbih", icon: "🔮", label: "التسبيح" },
  { href: "/hadith", icon: "📚", label: "حديث يومي" },
];

export default function MosqueModePage() {
  const { countdown } = usePrayerCountdown();
  const [silenceAlerted, setSilenceAlerted] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/mosque-mode",
      title: "وضع المسجد | المجلس العلمي",
      description: "وضع المسجد — عد تنازلي للصلاة مع تذكير بالصمت وإطفاء الصوت داخل المسجد.",
      keywords: ["وضع المسجد", "آداب المسجد", "صمت مسجد", "عد تنازلي صلاة"],
    });
  }, []);

  // Show silence reminder once on mount
  useEffect(() => {
    const shown = sessionStorage.getItem("mosque_silence_shown");
    if (!shown) {
      setSilenceAlerted(true);
      sessionStorage.setItem("mosque_silence_shown", "1");
    }
  }, []);

  const next = countdown?.next;
  const secondsLeft = Math.floor((countdown?.remainingMs ?? 0) / 1000);

  return (
    <div className="mosque-mode" dir="rtl">
      {/* Silence alert */}
      {silenceAlerted && (
        <div className="mosque-mode__silence-alert">
          <span>🔕</span>
          <span>تذكّر إيقاف صوت هاتفك داخل المسجد</span>
          <button
            type="button"
            className="mosque-mode__silence-dismiss"
            onClick={() => setSilenceAlerted(false)}
          >
            ✓
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mosque-mode__header">
        <Link href="/" className="mosque-mode__exit">✕</Link>
        <span className="mosque-mode__label">🕌 وضع المسجد</span>
      </div>

      {/* Prayer countdown */}
      <div className="mosque-mode__prayer-box">
        {next ? (
          <>
            <p className="mosque-mode__prayer-label">الصلاة القادمة</p>
            <h2 className="mosque-mode__prayer-name">{next.name}</h2>
            <div className="mosque-mode__countdown">
              {secondsLeft > 0 ? formatCountdown(secondsLeft) : "حان الآن"}
            </div>
            <p className="mosque-mode__prayer-time">{next.time}</p>
          </>
        ) : (
          <p className="mosque-mode__prayer-label">جارٍ تحميل مواقيت الصلاة…</p>
        )}
      </div>

      {/* Quick access grid */}
      <div className="mosque-mode__grid">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="mosque-mode__link">
            <span className="mosque-mode__link-icon">{item.icon}</span>
            <span className="mosque-mode__link-label">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* PWA install hint */}
      <p className="mosque-mode__pwa-hint">
        💡 أضف المنصة لشاشتك الرئيسية لوصول أسرع
      </p>
    </div>
  );
}
