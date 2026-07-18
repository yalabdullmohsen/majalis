import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Heart } from "lucide-react";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { fetchPublishedArbaeenLove, type ArbaeenHadith } from "@/lib/arbaeen-love-service";

export default function ArbaeenLovePage() {
  const [items, setItems] = useState<ArbaeenHadith[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/hadith/arbaeen-love-of-allah",
      title: "الأربعون في محبة رب العالمين | المجلس العلمي",
      description: "مجموعة أحاديث نبوية موثقة في محبة الله لعباده ومحبة العبد لربه، من صحيح البخاري ومسلم وغيرهما — مراجَعة علميًا قبل النشر.",
      keywords: ["الأربعون", "محبة الله", "أحاديث محبة الله", "المجلس العلمي"],
    });
  }, []);

  useEffect(() => {
    let active = true;
    fetchPublishedArbaeenLove()
      .then((data) => { if (active) setItems(data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="page-shell" dir="rtl">
      <nav className="hb-breadcrumb" aria-label="مسار التنقل">
        <Link href="/hadith" className="hb-breadcrumb__link">الأحاديث النبوية</Link>
        <ArrowRight size={12} className="hb-breadcrumb__sep" aria-hidden="true" />
        <span>الأربعون في محبة رب العالمين</span>
      </nav>

      <PageHeader
        eyebrow="أحاديث مختارة"
        title="الأربعون في محبة رب العالمين"
        subtitle="مجموعة قيد الاستكمال من الأحاديث النبوية الموثقة في محبة الله لعباده ومحبة العبد لربه — لا يُنشر أي حديث إلا بعد مراجعة عالِم شرعي فعلي."
      />

      <div className="hb-notice" role="note" dir="rtl">
        <Heart size={14} className="inline ml-1" />
        كل نص هنا منقول حرفيًا من مصادره (صحيح البخاري، صحيح مسلم، وغيرها) بلا
        أي توليد بالذكاء الاصطناعي. المجموعة قيد الاستكمال تدريجيًا حتى تبلغ
        أربعين حديثًا مراجَعًا.
      </div>

      {loading ? (
        <SkeletonCardGrid count={4} />
      ) : items.length === 0 ? (
        <Empty text="لا توجد أحاديث منشورة بعد في هذه المجموعة — قيد المراجعة العلمية." />
      ) : (
        <div className="fiqh-review-list">
          {items.map((item) => (
            <article key={item.id} className="fiqh-review-card ui-card">
              <div className="fiqh-review-card-head">
                <h2>{item.order_number ? `${item.order_number}. ` : ""}{item.title}</h2>
              </div>
              <p style={{ lineHeight: 1.9 }}>{item.hadith_text}</p>
              <p className="fiqh-review-meta">
                {item.source}{item.hadith_number ? ` — رقم ${item.hadith_number}` : ""}
                {item.grade ? ` · درجة الحديث: ${item.grade}` : ""}
                {item.verified_by ? ` · راجعه: ${item.verified_by}` : ""}
              </p>
            </article>
          ))}
        </div>
      )}

      <div className="twh-share">
        <ShareButtons title="الأربعون في محبة رب العالمين — المجلس العلمي" url="https://www.majlisilm.com/hadith/arbaeen-love-of-allah" />
      </div>
    </div>
  );
}
