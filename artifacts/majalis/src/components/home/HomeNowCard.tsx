import { Link } from "wouter";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";

type Props = {
  prayerName?: string | null;
  prayerHms?: string | null;
  prayerProgress?: number;
  continueHref: string;
  continueLabel?: string | null;
};

/**
 * بطاقة «الآن» — صلاة قادمة + ورد + متابعة تعلّم في تكوين واحد
 * بدل ثلاث طبقات متنافسة أعلى الصفحة.
 */
export function HomeNowCard({
  prayerName,
  prayerHms,
  prayerProgress = 50,
  continueHref,
  continueLabel,
}: Props) {
  return (
    <section className="hp-now" aria-label="الآن">
      <div className="hp-now__head">
        <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
        <h2 className="hp-now__title">الآن</h2>
      </div>

      <div className="hp-now__grid">
        {prayerName && prayerHms ? (
          <Link
            href="/prayer-times"
            className="hp-now__prayer"
            style={{ ["--p" as string]: String(prayerProgress) }}
            aria-label={`الصلاة القادمة ${prayerName} بعد ${prayerHms}`}
          >
            <div className="hp-now__prayer-ring" aria-hidden="true">
              <span>صلاة</span>
            </div>
            <div className="hp-now__prayer-body">
              <p className="hp-now__prayer-name">{prayerName}</p>
              <p className="hp-now__prayer-time">بعد {toArabicDigits(prayerHms)}</p>
              <span className="hp-now__chip">مواقيت اليوم</span>
            </div>
          </Link>
        ) : (
          <Link href="/prayer-times" className="hp-now__fallback">
            <span>مواقيت الصلاة</span>
          </Link>
        )}

        <div className="hp-now__actions">
          <Link href="/daily-wird" className="hp-now__action">
            <BookOpen size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>
              <strong>ورد القرآن</strong>
              <small>ختم يومي مقترح</small>
            </span>
          </Link>
          <Link href={continueHref} className="hp-now__action">
            <GraduationCap size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>
              <strong>{continueLabel ? "أكمل قراءتك" : "درس مقترح"}</strong>
              <small>{continueLabel ?? "تصفّح الدروس القادمة"}</small>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
