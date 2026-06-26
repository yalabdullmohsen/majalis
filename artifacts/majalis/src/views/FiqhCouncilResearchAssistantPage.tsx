import { useState } from "react";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { PageHeader } from "@/components/ui-common";
import { FiqhResearchAssistantView } from "@/components/fiqh-council/FiqhResearchAssistantView";
import {
  FIQH_COUNCIL_CATEGORIES,
  FIQH_ITEM_TYPES,
  FIQH_ITEM_TYPE_LABELS,
  type FiqhItemType,
} from "@/lib/fiqh-council-types";
import { FIQH_RESEARCH_DISCLAIMER } from "@/lib/fiqh-citation";

export default function FiqhCouncilResearchAssistantPage() {
  const [type, setType] = useState("الكل");
  const [category, setCategory] = useState("الكل");
  const [source, setSource] = useState("");
  const [year, setYear] = useState("الكل");

  const years = ["الكل", ...Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - i))];

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page fiqh-research-assistant-page">
      <PageHeader
        eyebrow="أداة الباحث"
        title="مساعد الباحث الفقهي"
        subtitle="يبحث في القرارات والفتاوى والتوصيات المنشورة فقط — ويربط كل جواب بمراجعها دون إصدار فتوى جديدة."
      />

      <FiqhCouncilSubnav />

      <div className="fiqh-research-disclaimer ui-card">
        <strong>تنبيه:</strong> {FIQH_RESEARCH_DISCLAIMER}
      </div>

      <div className="fiqh-research-filters ui-card">
        <div className="fiqh-council-filter-row">
          <label className="fiqh-council-select-label">
            النوع
            <select value={type} onChange={(e) => setType(e.target.value)} className="fiqh-council-select">
              <option value="الكل">الكل</option>
              {FIQH_ITEM_TYPES.map((t) => <option key={t} value={t}>{FIQH_ITEM_TYPE_LABELS[t]}</option>)}
            </select>
          </label>
          <label className="fiqh-council-select-label">
            التصنيف
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="fiqh-council-select">
              <option value="الكل">الكل</option>
              {FIQH_COUNCIL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="fiqh-council-select-label">
            السنة
            <select value={year} onChange={(e) => setYear(e.target.value)} className="fiqh-council-select">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="fiqh-council-select-label">
            المصدر
            <input value={source} onChange={(e) => setSource(e.target.value)} className="fiqh-council-source-input" placeholder="اسم المصدر" />
          </label>
        </div>
      </div>

      <FiqhResearchAssistantView
        filters={{
          type: type !== "الكل" ? type as FiqhItemType : undefined,
          category: category !== "الكل" ? category : undefined,
          source: source || undefined,
          year,
        }}
      />
    </div>
  );
}
