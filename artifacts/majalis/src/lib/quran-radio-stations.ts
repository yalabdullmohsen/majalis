/** Verified HTTPS reciter streams (qurango.net — tested 2026-06-27). Each entry = one reciter + one reading style. */
export type QuranRadioStation = {
  id: string;
  reciterName: string;
  readingType: "مرتل" | "مجوّد";
  streamUrl: string;
  quality: string;
  sortOrder: number;
};

export const QURAN_RADIO_STATIONS: QuranRadioStation[] = [
  {
    id: "abdulbasit-murattal",
    reciterName: "عبد الباسط عبد الصمد",
    readingType: "مرتل",
    streamUrl: "https://qurango.net/radio/abdulbasit_abdulsamad_murattal",
    quality: "128 kbps",
    sortOrder: 1,
  },
  {
    id: "abdulbasit-mujawwad",
    reciterName: "عبد الباسط عبد الصمد",
    readingType: "مجوّد",
    streamUrl: "https://qurango.net/radio/abdulbasit_abdulsamad_mujawwad",
    quality: "128 kbps",
    sortOrder: 2,
  },
  {
    id: "minshawi-murattal",
    reciterName: "محمد صديق المنشاوي",
    readingType: "مرتل",
    streamUrl: "https://qurango.net/radio/mohammed_siddiq_alminshawi_murattal",
    quality: "128 kbps",
    sortOrder: 3,
  },
  {
    id: "minshawi-mujawwad",
    reciterName: "محمد صديق المنشاوي",
    readingType: "مجوّد",
    streamUrl: "https://qurango.net/radio/mohammed_siddiq_alminshawi_mujawwad",
    quality: "128 kbps",
    sortOrder: 4,
  },
  {
    id: "huthayfi",
    reciterName: "علي بن عبد الرحمن الحذيفي",
    readingType: "مرتل",
    streamUrl: "https://qurango.net/radio/ali_alhuthaifi",
    quality: "128 kbps",
    sortOrder: 5,
  },
  {
    id: "dosari",
    reciterName: "ياسر الدوسري",
    readingType: "مرتل",
    streamUrl: "https://qurango.net/radio/yasser_aldosari",
    quality: "128 kbps",
    sortOrder: 6,
  },
  {
    id: "ghamdi",
    reciterName: "سعد الغامدي",
    readingType: "مرتل",
    streamUrl: "https://qurango.net/radio/saad_alghamdi",
    quality: "128 kbps",
    sortOrder: 7,
  },
  {
    id: "muaiqly",
    reciterName: "ماهر المعيقلي",
    readingType: "مرتل",
    streamUrl: "https://qurango.net/radio/maher_almuaiqly",
    quality: "128 kbps",
    sortOrder: 8,
  },
  {
    id: "qatami",
    reciterName: "ناصر القطامي",
    readingType: "مرتل",
    streamUrl: "https://qurango.net/radio/nasser_alqatami",
    quality: "128 kbps",
    sortOrder: 9,
  },
].sort((a, b) => a.sortOrder - b.sortOrder) as QuranRadioStation[];

export function getRadioStationById(id: string): QuranRadioStation | undefined {
  return QURAN_RADIO_STATIONS.find((s) => s.id === id);
}
