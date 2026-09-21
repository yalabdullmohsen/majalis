import { isLessonsGuideFlagOn } from "./flags";
import type { ScheduledLessonGuideItem, LessonsGuideGeoReport } from "./types";
import { filterMapPins } from "./mapFromLesson";

/**
 * تقرير القدرة الجغرافية — بدون أعمدة lat/lng في المخطط الحالي.
 * الخريطة الكاملة BLOCKED_DATA حتى Migration موافَق عليها + بيانات.
 */
export function assessLessonsGuideGeo(
  items: ScheduledLessonGuideItem[],
): LessonsGuideGeoReport {
  const withCoords = filterMapPins(items).length;
  if (withCoords === 0) {
    return {
      capability: "BLOCKED_DATA",
      hasDedicatedCoordinatesColumn: false,
      itemsWithExplicitCoords: 0,
      note: "لا أعمدة latitude/longitude في مخطط lessons؛ ولا إحداثيات صريحة في maps_url للعينة. واجهة القائمة تعمل دون خريطة.",
    };
  }
  return {
    capability: "partial_url_coords",
    hasDedicatedCoordinatesColumn: false,
    itemsWithExplicitCoords: withCoords,
    note: "إحداثيات جزئية من maps_url الصريحة فقط. الخريطة الكاملة تبقى خلف Migration + موافقة المالك.",
  };
}

/**
 * هل يجوز عرض الخريطة؟ لا عند BLOCKED_DATA ولا بدون علم الخريطة ولا بلا إحداثيات صريحة.
 * لا يخترع إحداثيات بديلة — القائمة فقط عند الحظر.
 */
export function isLessonsGuideMapAllowed(report: LessonsGuideGeoReport): boolean {
  if (report.capability === "BLOCKED_DATA") return false;
  if (!isLessonsGuideFlagOn("lessonsGuideMapEnabled")) return false;
  return report.itemsWithExplicitCoords > 0;
}
