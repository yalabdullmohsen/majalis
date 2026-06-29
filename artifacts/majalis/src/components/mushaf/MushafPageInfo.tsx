import { getPageInfoSummary } from "@/lib/mushaf/mushaf-page-info";

type Props = {
  page: number;
  ayahCount?: number | null;
};

export function MushafPageInfo({ page, ayahCount }: Props) {
  const info = getPageInfoSummary(page);

  return (
    <aside className="km-page-info" aria-label="معلومات الصفحة">
      <div className="km-page-info__grid">
        <div><span>الصفحة</span><strong>{info.page}</strong></div>
        <div><span>الجزء</span><strong>{info.juz}</strong></div>
        <div><span>الحزب</span><strong>{info.hizb}</strong></div>
        <div><span>الربع</span><strong>{info.quarter}</strong></div>
        {ayahCount != null && (
          <div><span>الآيات</span><strong>{ayahCount}</strong></div>
        )}
      </div>
      {info.surahs.length > 0 && (
        <div className="km-page-info__surahs">
          <span>السور في هذه الصفحة:</span>
          <ul>
            {info.surahs.map((s) => (
              <li key={s.number}>
                {s.name}
                <small> ({s.revelation} · {s.ayahs} آية)</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

export default MushafPageInfo;
