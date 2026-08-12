/** Number of recent calendar years offered in Fiqh Council year filters. */
export const FIQH_YEAR_WINDOW = 8;

/** Year filter options: "الكل" plus the last {@link FIQH_YEAR_WINDOW} years. */
export function fiqhYearFilterOptions(referenceYear = new Date().getFullYear()): string[] {
  return [
    "الكل",
    ...Array.from({ length: FIQH_YEAR_WINDOW }, (_, i) => String(referenceYear - i)),
  ];
}
