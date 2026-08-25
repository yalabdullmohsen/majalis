import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { ShareButtons } from "@/components/ContentActions";
import {
  NATIONS,
  filterNations,
  getNationFilterOptions,
  getNationsTimeline,
  estimateReadingMinutes,
  type Nation,
  type PunishmentType,
} from "@/lib/nations-seed";
import { PunishmentIcon } from "@/components/nations/PunishmentIcon";
import "@/styles/nations.css";

type Stance = "all" | "believed" | "rejected";
type View = "grid" | "timeline";

export default function NationsPage() {
  const [prophet, setProphet] = useState("الكل");
  const [punishment, setPunishment] = useState<PunishmentType | "الكل">("الكل");
  const [stance, setStance] = useState<Stance>("all");
  const [tag, setTag] = useState("الكل");
  const [view, setView] = useState<View>("grid");

  const options = useMemo(() => getNationFilterOptions(), []);
  const results = useMemo(
    () => filterNations({ search: "", prophet, punishment, stance, tag }),
    [prophet, punishment, stance, tag],
  );
  const timeline = useMemo(() => getNationsTimeline(), []);

  useEffect(() => {
    applyPageSeo({
      path: "/nations",
      title: "الأمم السابقة | المجلس العلمي",
      description:
        "موسوعة الأمم والأقوام المذكورين في القرآن والسنة الصحيحة: النبي المرسل إليهم، وذنبهم، ونوع العقوبة، ومن نجا، والدروس المستفادة — بالآيات",
      keywords: ["الأمم السابقة", "قوم نوح", "عاد", "ثمود", "قوم لوط", "أصحاب الفيل", "قصص القرآن"],
      jsonLd: [
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الأمم السابقة", path: "/nations" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "الأمم السابقة",
          url: "https://majlisilm.com/nations",
          numberOfItems: NATIONS.length,
        },
      ],
    });
  }, []);

  const hasFilters =
    prophet !== "الكل" || punishment !== "الكل" || stance !== "all" || tag !== "الكل";

  const resetFilters = () => {
    setProphet("الكل");
    setPunishment("الكل");
    setStance("all");
    setTag("الكل");
  };

  return (
    <SectionTemplatePage
      route="/nations"
      eyebrow="قصص القرآن"
      title="الأمم السابقة"
      subtitle={`${NATIONS.length} أمة وقوماً — بالآيات والأحاديث الصحيحة، مع تمييز ما ثبت مما لم يثبت`}
      groupTitle="أقسام الأمم السابقة"
    >
    <div className="page-shell nations-page" dir="rtl">
      <div className="nations-toolbar">
        <div className="nations-view-switch" role="tablist" aria-label="طريقة العرض">
          <button
            type="button"
            role="tab"
            aria-selected={view === "grid"}
            className={`nations-view-btn${view === "grid" ? " is-active" : ""}`}
            onClick={() => setView("grid")}
          >
            بطاقات
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "timeline"}
            className={`nations-view-btn${view === "timeline" ? " is-active" : ""}`}
            onClick={() => setView("timeline")}
          >
            تسلسل زمني تقريبي
          </button>
        </div>
      </div>

      {view === "grid" && (
        <div className="nations-filters">
          <select
            className="nations-select"
            value={prophet}
            onChange={(e) => setProphet(e.target.value)}
            aria-label="تصفية حسب النبي"
          >
            <option value="الكل">كل الأنبياء</option>
            {options.prophets.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            className="nations-select"
            value={punishment}
            onChange={(e) => setPunishment(e.target.value as PunishmentType | "الكل")}
            aria-label="تصفية حسب نوع العقوبة"
          >
            <option value="الكل">كل أنواع العقوبة</option>
            {options.punishments.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            className="nations-select"
            value={stance}
            onChange={(e) => setStance(e.target.value as Stance)}
            aria-label="تصفية حسب موقفهم من الدعوة"
          >
            <option value="all">آمنوا وكذّبوا</option>
            <option value="believed">من آمن منهم</option>
            <option value="rejected">من كذّب</option>
          </select>

          <select
            className="nations-select"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label="تصفية حسب الوسم"
          >
            <option value="الكل">كل التصنيفات</option>
            {options.tags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {hasFilters && (
            <button type="button" className="nations-reset" onClick={resetFilters}>
              إعادة الضبط
            </button>
          )}
        </div>
      )}

      {view === "grid" ? (
        results.length === 0 ? (
          <p className="nations-empty">
            لا توجد أمة مطابقة لهذه الفلاتر. جرّب الاسم أو أحد مرادفاته — مثل «قوم هود» بدل «عاد».
          </p>
        ) : (
          <>
            <p className="nations-count">{results.length} من {NATIONS.length}</p>
            <div className="nations-grid">
              {results.map((n) => (
                <NationCard key={n.slug} nation={n} />
              ))}
            </div>
          </>
        )
      ) : (
        <TimelineView dated={timeline.dated} undated={timeline.undated} />
      )}

      <div className="nations-share">
        <ShareButtons title="الأمم السابقة — المجلس العلمي" url="https://majlisilm.com/nations" />
      </div>
    </div>
    </SectionTemplatePage>
  );
}

function NationCard({ nation }: { nation: Nation }) {
  return (
    <Link href={`/nations/${nation.slug}`} className="nation-card">
      <div className="nation-card__head">
        <PunishmentIcon type={nation.punishment.type} className="nation-card__icon" />
        <div className="nation-card__title-wrap">
          <h2 className="nation-card__title">{nation.name}</h2>
          <p className="nation-card__prophet">
            {nation.prophetKnown && nation.prophet ? nation.prophet.name : "لم يُسمَّ نبيّهم في نصّ صحيح"}
          </p>
        </div>
      </div>

      <p className="nation-card__summary">{nation.summary}</p>

      <div className="nation-card__meta">
        <span className="nation-chip nation-chip--punishment">{nation.punishment.type}</span>
        <span className="nation-chip">{nation.place.split("—")[0].trim()}</span>
        <span className="nation-chip nation-chip--time">{estimateReadingMinutes(nation)} دقيقة قراءة</span>
      </div>
    </Link>
  );
}

function TimelineView({ dated, undated }: { dated: Nation[]; undated: Nation[] }) {
  return (
    <div className="nations-timeline">
      <p className="nations-timeline__note">
        الترتيب تقريبي مبني على ما دلّ عليه ظاهر النصوص (مثل ﴿مِن بَعْدِ قَوْمِ نُوحٍ﴾)، ولا يُجزم
        بترتيب زمني كامل للأنبياء والأمم لعدم قيام دليل قاطع عليه.
      </p>
      <ol className="nations-timeline__list">
        {dated.map((n) => (
          <li key={n.slug} className="nations-timeline__item">
            <Link href={`/nations/${n.slug}`} className="nations-timeline__link">
              <span className="nations-timeline__dot" aria-hidden="true" />
              <span className="nations-timeline__name">{n.name}</span>
              <span className="nations-timeline__era">{n.era}</span>
            </Link>
          </li>
        ))}
      </ol>

      {undated.length > 0 && (
        <div className="nations-timeline__undated">
          <h2 className="nations-timeline__undated-title">أممٌ لم يثبت موضعها الزمني</h2>
          <div className="nations-timeline__undated-list">
            {undated.map((n) => (
              <Link key={n.slug} href={`/nations/${n.slug}`} className="nation-chip nation-chip--link">
                {n.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
