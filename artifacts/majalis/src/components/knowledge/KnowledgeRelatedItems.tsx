import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  GraduationCap, BookMarked, Lightbulb, HelpCircle, BookOpen,
  ChevronLeft, type LucideProps,
} from "lucide-react";
import {
  getRelatedItems,
  type KnowledgeRelationship,
  type KnowledgeSourceType,
} from "@/lib/supabase";

type LucideIcon = React.ComponentType<Omit<LucideProps, "ref">>;

const TYPE_ICON: Record<KnowledgeSourceType, LucideIcon> = {
  scholar:  GraduationCap,
  lesson:   BookOpen,
  book:     BookMarked,
  fawaid:   Lightbulb,
  question: HelpCircle,
};

const TYPE_LABEL: Record<KnowledgeSourceType, string> = {
  scholar:  "عالم",
  lesson:   "درس",
  book:     "كتاب",
  fawaid:   "فائدة",
  question: "سؤال",
};

// ملاحظة: "fatwa" أُزيل من هذه الخرائط (2026-07-18) مع إزالته من
// KnowledgeSourceType — كان رابطه هنا يشير لمسار /fatwa/:id المحذوف
// بالكامل من التطبيق (يُحوَّل الآن إلى /rulings)، وصفر صف في
// knowledge_relationships استخدم هذا النوع أصلاً فلم يكن ليُعرَض أبداً.
//
// ملاحظة ثانية (2026-07-18): TYPE_HREF.scholar كان يشير إلى
// `/lessons?sheikh=${id}` — لكن صفحة /lessons تفلتر عبر `sheikhName`
// (اسم عربي نصّي من بيانات الدروس الفعلية)، بينما `id` هنا هو مُعرِّف
// scholars-data.ts الإنجليزي (مثل "ibn-baz")، فلا يتطابقان أبداً؛ الرابط
// كان سيُنتج صفحة نتائج فارغة دوماً لا 404 ظاهرة — عطل صامت مطابق تماماً
// لعطل "fatwa" أعلاه، اكتُشف أثناء تعبئة knowledge_relationships لأول
// مرة (كان الجدول فارغاً كلياً 0 صف قبل هذه الجلسة فلم يُختبَر قط).
// المسار الصحيح هو صفحة الملف الشخصي `/scholars/:id` التي تستهلك نفس
// مُعرِّف scholars-data.ts مباشرة (ScholarProfilePage.tsx عبر findScholarById).
// ملاحظة ثالثة (2026-07-18): TYPE_HREF.fawaid كان يتجاهل `id` كلياً
// ويعيد `/fawaid` العامة دوماً — نفس عائلة عطل fatwa/scholar أعلاه (رابط
// يُبنى لكن لا يوصل للعنصر المحدَّد). اكتُشف أثناء إضافة أول علاقات
// fawaid↔book لـknowledge_relationships. الإصلاح: `FaidahCard.tsx` يضع
// `id={item.id}` على جذر كل بطاقة فعلياً (تحقَّقتُ مباشرة)، ولا حدّ/تقسيم
// صفحات يمنع عرض كل العناصر دفعة واحدة في الحالة الافتراضية (بلا فلترة) —
// فرابط hash قياسي (`#seed-fawaid-N`) يعمل عبر تمرير المتصفح الطبيعي
// بلا حاجة لمنطق JS إضافي، بنفس نمط إصلاح ArbaeenNawawiPage سابقاً.
const TYPE_HREF: Record<KnowledgeSourceType, (id: string) => string> = {
  scholar:  (id) => `/scholars/${id}`,
  lesson:   (id) => `/lessons/${id}`,
  book:     (id) => `/library/${id}`,
  fawaid:   (id) => `/fawaid#${id}`,
  question: ()   => `/qa`,
};

const REL_LABEL: Record<string, string> = {
  "شيخ_تلميذ":   "شيخ ← تلميذ",
  "مؤلف_كتاب":   "مؤلف",
  "شرح_لكتاب":   "شرح",
  "فتوى_في_باب": "فتوى في باب",
  "درس_عن_كتاب": "درس عن كتاب",
  "مرتبط":       "مرتبط",
};

type Props = {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  title?: string;
};

export function KnowledgeRelatedItems({
  sourceType,
  sourceId,
  title = "مواد مرتبطة في الرسم البياني المعرفي",
}: Props) {
  const [items,   setItems]   = useState<KnowledgeRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRelatedItems(sourceType, sourceId).then((data) => {
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [sourceType, sourceId]);

  if (loading || items.length === 0) return null;

  return (
    <aside className="kri-aside" aria-label={title}>
      <h3 className="kri-title">{title}</h3>
      <div className="kri-grid">
        {items.map((rel) => {
          const isSource   = rel.source_type === sourceType && rel.source_id === sourceId;
          const linkedType = isSource ? rel.target_type : rel.source_type;
          const linkedId   = isSource ? rel.target_id   : rel.source_id;
          const href       = TYPE_HREF[linkedType]?.(linkedId) ?? "#";
          const Icon       = TYPE_ICON[linkedType] ?? BookOpen;
          const relLabel   = REL_LABEL[rel.relationship_type] ?? rel.relationship_type;

          return (
            <Link key={rel.id} href={href} className="kri-card">
              <div className="kri-card__icon-wrap" aria-hidden="true">
                <Icon size={15} strokeWidth={1.6} />
              </div>
              <div className="kri-card__body">
                <p className="kri-card__name">{rel.label ?? linkedId}</p>
                <span className="kri-card__meta">
                  {TYPE_LABEL[linkedType]}
                  {relLabel && (
                    <span className="kri-card__rel-badge">{relLabel}</span>
                  )}
                </span>
              </div>
              <ChevronLeft size={13} className="kri-card__arrow" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
