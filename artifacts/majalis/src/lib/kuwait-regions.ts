/** Region → governorate mapping for Kuwait areas. */
const REGION_TO_GOVERNORATE: Record<string, string> = {
  الفحيحيل: "الأحمدي",
  العقيلة: "الأحمدي",
  الخيران: "الأحمدي",
  الوفرة: "الأحمدي",
  الصديق: "حولي",
  حطين: "حولي",
  الزهراء: "حولي",
  السلام: "حولي",
  الرميثية: "حولي",
  كيفان: "العاصمة",
  العديلية: "العاصمة",
  الخالدية: "العاصمة",
  القادسية: "العاصمة",
  قرطبة: "العاصمة",
  اليرموك: "العاصمة",
  الروضة: "العاصمة",
  الشامية: "العاصمة",
  الفيحاء: "العاصمة",
  القيروان: "العاصمة",
  الفردوس: "العاصمة",
  العارضية: "الفروانية",
  العمرية: "الفروانية",
  الأندلس: "الفروانية",
  "جليب الشيوخ": "الفروانية",
  الفروانية: "الفروانية",
  "صباح الناصر": "الفروانية",
  الجهراء: "الجهراء",
  النعيم: "الجهراء",
  النسيم: "الجهراء",
  العيون: "الجهراء",
  تيماء: "الجهراء",
  "صباح السالم": "مبارك الكبير",
  القرين: "مبارك الكبير",
  القصور: "مبارك الكبير",
  العدان: "مبارك الكبير",
  المسايل: "مبارك الكبير",
  "أبو فطيرة": "مبارك الكبير",
};

const GOVERNORATE_KEYWORDS: [string, string][] = [
  ["الأحمدي", "الأحمدي"],
  ["حولي", "حولي"],
  ["الفروانية", "الفروانية"],
  ["الجهراء", "الجهراء"],
  ["مبارك الكبير", "مبارك الكبير"],
  ["العاصمة", "العاصمة"],
];

function normalizeRegionKey(value: string): string {
  return value
    .replace(/^منطقة\s+/u, "")
    .replace(/\s*[–\-].*$/u, "")
    .replace(/\s*قطعة.*$/u, "")
    .trim();
}

export function resolveRegion(raw: string): string {
  const text = String(raw || "").trim();
  if (!text) return "";
  const fromDistrict = text.match(/منطقة\s+([^\s–\-]+)/u)?.[1];
  if (fromDistrict) return fromDistrict.trim();
  const key = normalizeRegionKey(text);
  if (REGION_TO_GOVERNORATE[key]) return key;
  for (const [region] of Object.entries(REGION_TO_GOVERNORATE)) {
    if (text.includes(region)) return region;
  }
  return key || text;
}

export function resolveGovernorate(regionRaw: string, fallback = "العاصمة"): string {
  const region = resolveRegion(regionRaw);
  if (region && REGION_TO_GOVERNORATE[region]) return REGION_TO_GOVERNORATE[region];

  const text = String(regionRaw || "");
  for (const [keyword, governorate] of GOVERNORATE_KEYWORDS) {
    if (text.includes(keyword)) return governorate;
  }

  return fallback;
}

export function regionsForGovernorate(governorate: string): string[] {
  if (governorate === "كل المحافظات") {
    return Object.keys(REGION_TO_GOVERNORATE).sort((a, b) => a.localeCompare(b, "ar"));
  }
  return Object.entries(REGION_TO_GOVERNORATE)
    .filter(([, gov]) => gov === governorate)
    .map(([region]) => region)
    .sort((a, b) => a.localeCompare(b, "ar"));
}

export const ALL_KUWAIT_REGIONS = Object.keys(REGION_TO_GOVERNORATE).sort((a, b) =>
  a.localeCompare(b, "ar"),
);
