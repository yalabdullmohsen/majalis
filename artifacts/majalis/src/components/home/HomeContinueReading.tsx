import { useEffect, useState } from "react";
import { FileText, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { getResumeItems, type ResumeItem } from "@/lib/user-profile-service";

const TYPE_LABEL: Record<string, string> = {
  lesson: "درس",
  book: "كتاب",
  article: "مقال",
  path: "مسار",
  hadith: "حديث",
  fatwa: "فتوى",
};

export function HomeContinueReading() {
  const { user, isLoggedIn } = useAuth();
  const [items, setItems] = useState<ResumeItem[]>([]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    getResumeItems(user.id)
      .then((data) => setItems(data.slice(0, 3)))
      .catch(() => {});
  }, [isLoggedIn, user?.id]);

  if (!isLoggedIn || items.length === 0) return null;

  return (
    <section className="home-resume ds-section" dir="rtl" aria-label="تابع من حيث توقفت">
      <div className="ds-section__head">
        <h2 className="ds-section__title"><MapPin size={16} className="inline ml-1" /> تابع من حيث توقفت</h2>
        <Link href="/profile" className="ds-section__link">ملفك ←</Link>
      </div>
      <div className="home-resume__cards">
        {items.map((item) => (
          <Link
            key={`${item.content_type}-${item.content_id}`}
            href={item.content_url}
            className="home-resume__card"
          >
            <span className="home-resume__card-icon">{item.thumbnail_icon || <FileText size={20} strokeWidth={1.5} />}</span>
            <div className="home-resume__card-body">
              <span className="home-resume__card-type">
                {TYPE_LABEL[item.content_type] ?? item.content_type}
              </span>
              <span className="home-resume__card-title">{item.content_title}</span>
              {item.position?.section && (
                <span className="home-resume__card-section">{item.position.section}</span>
              )}
            </div>
            {typeof item.position?.pct === "number" && (
              <div className="home-resume__card-progress">
                <div className="home-resume__card-track">
                  <div
                    className="home-resume__card-fill"
                    style={{ "--hrc-pct": `${item.position.pct}%` } as React.CSSProperties}
                  />
                </div>
                <span className="home-resume__card-pct">{item.position.pct}٪</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
