export type WomenAttendanceStatus = "متاح" | "men_only";

export type WomenAttendanceResult = {
  womenAttendance: WomenAttendanceStatus;
  womenAttendanceNote?: string;
};

export {
  classifyWomenAttendance,
  isMenOnlyVenue,
  isWomenFriendlyLesson,
  normalizeArabic,
} from "../../lib/lesson-women-attendance.mjs";
