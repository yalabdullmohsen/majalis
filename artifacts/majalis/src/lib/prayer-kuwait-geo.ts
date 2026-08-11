/**
 * Kuwait governorate geo shortcuts for prayer times (offline).
 */

export type KuwaitGovernorate = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

export const KUWAIT_GOVERNORATES: KuwaitGovernorate[] = [
  { id: "capital", name: "العاصمة", lat: 29.3697, lon: 47.9783 },
  { id: "hawalli", name: "حولي", lat: 29.3339, lon: 48.0668 },
  { id: "farwaniya", name: "الفروانية", lat: 29.28, lon: 47.96 },
  { id: "mubarak", name: "مبارك الكبير", lat: 29.22, lon: 48.08 },
  { id: "jahra", name: "الجهراء", lat: 29.3418, lon: 47.6583 },
  { id: "ahmadi", name: "الأحمدي", lat: 29.0769, lon: 48.0838 },
];

const GOV_STORAGE_KEY = "majalis-governorate-v1";

export function getSelectedGovernorate(): KuwaitGovernorate {
  try {
    const id = localStorage.getItem(GOV_STORAGE_KEY);
    return KUWAIT_GOVERNORATES.find((g) => g.id === id) ?? KUWAIT_GOVERNORATES[0]!;
  } catch {
    return KUWAIT_GOVERNORATES[0]!;
  }
}

export function setSelectedGovernorate(id: string): void {
  try {
    localStorage.setItem(GOV_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
