import { useState, useCallback } from "react";
import { ChevronDown, ChevronLeft, ExternalLink, Map } from "lucide-react";
import { Link } from "wouter";

/* ─────────────────────────────────────────────────
   موضوعات فرعية لكل تصنيف
───────────────────────────────────────────────── */
const CATEGORY_SUBTOPICS: Record<string, string[]> = {
  "تفسير":            ["مقدمة السورة", "المقاصد والأهداف", "التفسير التحليلي", "الفوائد والعبر", "الإعجاز البياني"],
  "تفسير القرآن":     ["تلاوة الآيات", "شرح المفردات", "السياق والسبب", "الفوائد التدبرية"],
  "علوم القرآن":      ["الناسخ والمنسوخ", "أسباب النزول", "المكي والمدني", "القراءات"],
  "فقه":              ["تعريف المسألة", "الدليل الشرعي", "الخلاف الفقهي", "الرأي الراجح", "التطبيق العملي"],
  "فقه المعاملات":    ["شروط الصحة", "الأحكام التفصيلية", "الحالات المعاصرة", "الفتاوى المتعلقة"],
  "فقه الأسرة":       ["عقد الزواج", "حقوق الزوجين", "تربية الأبناء", "أحكام الطلاق والفراق"],
  "عقيدة":            ["التعريف اللغوي والاصطلاحي", "الدليل من الكتاب والسنة", "أقوال العلماء", "الترجيح والخلاصة"],
  "توحيد":            ["توحيد الربوبية", "توحيد الألوهية", "توحيد الأسماء والصفات", "نواقض التوحيد"],
  "حديث":             ["نص الحديث", "شرح المفردات", "فوائد الحديث", "الأحاديث المتعلقة", "تطبيقات عملية"],
  "مصطلح الحديث":     ["أقسام الحديث", "علم الرجال", "الجرح والتعديل", "المصطلحات الأساسية"],
  "سيرة":             ["السياق التاريخي", "أبطال الحادثة", "التسلسل الزمني", "العبر والدروس"],
  "تجويد":            ["مخارج الحروف", "الصفات اللازمة", "أحكام التجويد", "التدريب العملي"],
  "أخلاق":            ["تعريف الخلق", "أهميته في الإسلام", "الأدلة الشرعية", "التطبيق والمداومة"],
  "تزكية":            ["أمراض القلوب", "العلاج بالوحيين", "الأذكار والأوراد", "الترقي في المقامات"],
  "رقاق":             ["ذكر الموت", "الزهد في الدنيا", "الترغيب في الآخرة", "علاج قسوة القلب"],
  "لغة عربية":        ["النحو والإعراب", "الصرف والاشتقاق", "البلاغة والبيان", "التطبيق على النصوص"],
  "نحو":              ["أقسام الكلام", "المرفوعات", "المنصوبات والمجرورات", "الجمل والأساليب"],
  "بلاغة":            ["علم المعاني", "علم البيان", "علم البديع", "التطبيق على النصوص"],
  "دعوة":             ["أساليب الدعوة", "أوصاف الداعية", "مراحل الدعوة النبوية", "التدرج في الدعوة"],
  "اقتصاد إسلامي":   ["مبادئ الاقتصاد", "أحكام البيع", "المنهيات المالية", "البدائل الإسلامية"],
  "طب نبوي":          ["الدليل النبوي", "البعد الوقائي", "العلاج الشرعي", "الدراسات الحديثة"],
  "أسرة":             ["مكانة الأسرة", "حقوق أفراد الأسرة", "تربية الأبناء", "حل النزاعات"],
  "تأصيل":            ["الأصول النظرية", "التطبيق المنهجي", "المقارنة والترجيح", "الخلاصة"],
  "السيرة النبوية":   ["المرحلة المكية", "الهجرة النبوية", "المرحلة المدنية", "الفتح وما بعده"],
  "فتوى":             ["المسألة المطروحة", "الدليل الشرعي", "الأقوال الفقهية", "الفتوى الراجحة"],
  "مواريث":           ["أصول الفرائض", "أصحاب الفروض", "العصبات", "مسائل تطبيقية"],
  "طهارة":            ["أنواع الطهارة", "الأحداث ونواقض الطهارة", "صفة الوضوء والغسل", "التيمم"],
  "صلاة":             ["شروط الصلاة وأركانها", "واجباتها وسننها", "مبطلات الصلاة", "صلاة الجماعة"],
  "زكاة":             ["مفهوم الزكاة وحكمها", "أنصبة الزكاة", "مصارف الزكاة", "زكاة عصرية"],
  "صيام":             ["فضل الصيام وأنواعه", "شروط الصحة", "المفطرات", "قضاء الفوائت"],
  "حج":               ["مناسك الحج والعمرة", "ميقات الإحرام", "الشروط والأركان", "أحكام الفدية"],
};

/* فئات الكتب */
const BOOK_SUBTOPICS: Record<string, string[]> = {
  "تفسير":        ["مقدمة المؤلف وعصره", "منهج التفسير", "الآيات المحورية", "الفهارس والتراجم"],
  "حديث":         ["منهج التصنيف", "تراجم الرواة", "شروح الأحاديث", "الفهارس والمعاجم"],
  "فقه":          ["أبواب الكتاب", "المسائل الكبرى", "الخلافات والأدلة", "الفهارس الفقهية"],
  "عقيدة":        ["أبواب العقيدة", "الأدلة النقلية والعقلية", "الردود على المخالفين", "الخلاصة"],
  "سيرة":         ["مصادر السيرة", "المراحل الزمنية", "الشخصيات الرئيسية", "العبر والدروس"],
  "لغة عربية":    ["القواعد الأساسية", "النماذج التطبيقية", "التدريبات", "الفهارس"],
  "تاريخ إسلامي": ["الحقبة الزمنية", "الأحداث الكبرى", "الشخصيات", "المصادر والمراجع"],
  "تزكية":        ["أمراض القلوب", "وسائل التزكية", "المقامات والأحوال", "خلاصة السلوك"],
  "أصول الفقه":   ["مصادر التشريع", "دلالات الألفاظ", "الاجتهاد والتقليد", "قواعد الاستنباط"],
  "بلاغة":        ["علم المعاني", "علم البيان", "علم البديع", "تطبيقات قرآنية"],
};

/* ─────────────────────────────────────────────────
   بناء شجرة الخريطة الذهنية
───────────────────────────────────────────────── */
interface ContentProps {
  title: string;
  category?: string | null;
  keywords?: string[] | null;
  author?: string | null;
  description?: string | null;
  type?: "lesson" | "book" | "article";
}

interface TreeNode { id: string; label: string; href?: string; children?: TreeNode[] }

function buildTree(props: ContentProps): TreeNode {
  const { title, category, keywords, author, type = "lesson" } = props;

  const lookup = type === "book" ? BOOK_SUBTOPICS : CATEGORY_SUBTOPICS;
  const normalised = category?.trim() || "";
  const subtopics = lookup[normalised] ?? lookup[Object.keys(lookup).find(k => normalised.includes(k)) ?? ""] ?? [];

  const branches: TreeNode[] = [];

  /* فرع الموضوع */
  if (normalised) {
    branches.push({
      id: "b-cat",
      label: `الموضوع: ${normalised}`,
      children: subtopics.length > 0
        ? subtopics.map((s, i) => ({ id: `cat-${i}`, label: s }))
        : [{ id: "cat-gen", label: "المحاور الرئيسية" }, { id: "cat-app", label: "التطبيق العملي" }],
    });
  }

  /* فرع الكلمات المفتاحية */
  const kws = (keywords ?? []).filter(Boolean);
  if (kws.length > 0) {
    branches.push({
      id: "b-kw",
      label: "الكلمات المفتاحية",
      children: kws.slice(0, 8).map((k, i) => ({ id: `kw-${i}`, label: k })),
    });
  }

  /* فرع المؤلف / الشيخ */
  if (author) {
    branches.push({
      id: "b-auth",
      label: type === "book" ? `المؤلف: ${author}` : `الشيخ: ${author}`,
      children: type === "book"
        ? [{ id: "auth-1", label: "منهج المؤلف وعصره" }, { id: "auth-2", label: "مؤلفاته الأخرى" }]
        : [{ id: "auth-1", label: "دروس الشيخ" }, { id: "auth-2", label: "تخصصه العلمي" }],
    });
  }

  /* فرع عام إذا لا يوجد شيء */
  if (branches.length === 0) {
    branches.push(
      { id: "b-intro", label: "المقدمة والتمهيد", children: [{ id: "b-intro-1", label: "أهمية الموضوع" }, { id: "b-intro-2", label: "السياق العام" }] },
      { id: "b-body",  label: "المحاور الأساسية",  children: [{ id: "b-body-1",  label: "الأدلة والحجج" },   { id: "b-body-2",  label: "الأقوال والآراء" }] },
      { id: "b-conc",  label: "الخلاصة والتطبيق",  children: [{ id: "b-conc-1",  label: "الفوائد المستخلصة" }, { id: "b-conc-2", label: "التوصيات العملية" }] },
    );
  }

  return { id: "root", label: title, children: branches };
}

/* ─────────────────────────────────────────────────
   مكوّن العقدة
───────────────────────────────────────────────── */
function CMNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (node.children?.length ?? 0) > 0;

  const toggle = useCallback(() => { if (hasChildren) setOpen(o => !o); }, [hasChildren]);

  const cls = `mm-node mm-node--d${Math.min(depth, 4)}`;
  const indent = depth > 0 ? { marginRight: `${Math.min(depth, 3) * 1.1}rem` } : {};

  return (
    <div className={cls} style={indent}>
      <button
        type="button"
        className={`mm-node__label${!hasChildren ? " mm-node__label--leaf" : ""}${open ? " mm-node__label--open" : ""}`}
        onClick={toggle}
        aria-expanded={hasChildren ? open : undefined}
      >
        {hasChildren && (
          <span className="mm-node__icon" aria-hidden="true">
            {open ? <ChevronDown size={13} strokeWidth={2.5} /> : <ChevronLeft size={13} strokeWidth={2.5} />}
          </span>
        )}
        <span className="mm-node__text">{node.label}</span>
        {node.href && (
          <Link href={node.href} className="mm-node__link" onClick={e => e.stopPropagation()}>
            <ExternalLink size={11} strokeWidth={2} />
          </Link>
        )}
      </button>
      {hasChildren && open && (
        <div className="mm-node__children">
          {node.children!.map(child => (
            <CMNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   المكوّن الرئيسي
───────────────────────────────────────────────── */
export function ContentMindMap(props: ContentProps) {
  const [open, setOpen] = useState(false);
  const tree = buildTree(props);

  return (
    <div className="cm-mindmap">
      <button
        type="button"
        className={`cm-mindmap__toggle${open ? " cm-mindmap__toggle--open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="cm-mindmap__icon" aria-hidden="true">
          <Map size={16} strokeWidth={1.8} />
        </span>
        <span>الخريطة الذهنية للمحتوى</span>
        <span className="cm-mindmap__chevron" aria-hidden="true">
          {open ? <ChevronDown size={15} strokeWidth={2.2} /> : <ChevronLeft size={15} strokeWidth={2.2} />}
        </span>
      </button>

      {open && (
        <div className="cm-mindmap__body">
          <CMNode node={tree} depth={0} />
        </div>
      )}
    </div>
  );
}
