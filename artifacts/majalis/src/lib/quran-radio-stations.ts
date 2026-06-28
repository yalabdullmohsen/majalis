/**
 * Verified HTTPS reciter streams (qurango.net — dedicated per-reciter channels).
 * reciterKnown=true only when the stream URL is tied to a single named reciter.
 */
export type QuranRadioStation = {
  id: string;
  /** Display name of the station/channel */
  stationName: string;
  country: string;
  streamType: string;
  readingStyle: "مرتل" | "مجوّد";
  /** When false, UI shows «بث مباشر» instead of a reciter name */
  reciterKnown: boolean;
  reciterName?: string;
  streamUrl: string;
  quality: string;
  logo: string;
  sortOrder: number;
};

export const QURAN_RADIO_STATIONS: QuranRadioStation[] = [
  {
    id: "abdulbasit-murattal",
    stationName: "إذاعة القرآن — عبد الباسط (مرتل)",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مرتل",
    reciterKnown: true,
    reciterName: "عبد الباسط عبد الصمد",
    streamUrl: "https://qurango.net/radio/abdulbasit_abdulsamad_murattal",
    quality: "128 kbps",
    logo: "/images/radio/reciter-abdulbasit.svg",
    sortOrder: 1,
  },
  {
    id: "abdulbasit-mujawwad",
    stationName: "إذاعة القرآن — عبد الباسط (مجوّد)",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مجوّد",
    reciterKnown: true,
    reciterName: "عبد الباسط عبد الصمد",
    streamUrl: "https://qurango.net/radio/abdulbasit_abdulsamad_mujawwad",
    quality: "128 kbps",
    logo: "/images/radio/reciter-abdulbasit.svg",
    sortOrder: 2,
  },
  {
    id: "minshawi-murattal",
    stationName: "إذاعة القرآن — المنشawi (مرتل)",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مرتل",
    reciterKnown: true,
    reciterName: "محمد صديق المنشاوي",
    streamUrl: "https://qurango.net/radio/mohammed_siddiq_alminshawi_murattal",
    quality: "128 kbps",
    logo: "/images/radio/reciter-minshawi.svg",
    sortOrder: 3,
  },
  {
    id: "minshawi-mujawwad",
    stationName: "إذاعة القرآن — المنشawi (مجوّد)",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مجوّد",
    reciterKnown: true,
    reciterName: "محمد صديق المنشاوي",
    streamUrl: "https://qurango.net/radio/mohammed_siddiq_alminshawi_mujawwad",
    quality: "128 kbps",
    logo: "/images/radio/reciter-minshawi.svg",
    sortOrder: 4,
  },
  {
    id: "minshawi",
    stationName: "إذاعة القرآن — المنشawi",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مرتل",
    reciterKnown: true,
    reciterName: "محمد صديق المنشاوي",
    streamUrl: "https://qurango.net/radio/mohammed_siddiq_alminshawi",
    quality: "128 kbps",
    logo: "/images/radio/reciter-minshawi.svg",
    sortOrder: 5,
  },
  {
    id: "huthayfi",
    stationName: "إذاعة القرآن — الحذيفي",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مرتل",
    reciterKnown: true,
    reciterName: "علي بن عبد الرحمن الحذيفي",
    streamUrl: "https://qurango.net/radio/ali_alhuthaifi",
    quality: "128 kbps",
    logo: "/images/radio/reciter-generic.svg",
    sortOrder: 6,
  },
  {
    id: "dosari",
    stationName: "إذاعة القرآن — الدوسري",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مرتل",
    reciterKnown: true,
    reciterName: "ياسر الدوسري",
    streamUrl: "https://qurango.net/radio/yasser_aldosari",
    quality: "128 kbps",
    logo: "/images/radio/reciter-generic.svg",
    sortOrder: 7,
  },
  {
    id: "ghamdi",
    stationName: "إذاعة القرآن — الغامدي",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مرتل",
    reciterKnown: true,
    reciterName: "سعد الغامدي",
    streamUrl: "https://qurango.net/radio/saad_alghamdi",
    quality: "128 kbps",
    logo: "/images/radio/reciter-generic.svg",
    sortOrder: 8,
  },
  {
    id: "muaiqly",
    stationName: "إذاعة القرآن — المعيقلي",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مرتل",
    reciterKnown: true,
    reciterName: "ماهر المعيقلي",
    streamUrl: "https://qurango.net/radio/maher_almuaiqly",
    quality: "128 kbps",
    logo: "/images/radio/reciter-generic.svg",
    sortOrder: 9,
  },
  {
    id: "qatami",
    stationName: "إذاعة القرآن — القطامي",
    country: "عبر الإنترنت",
    streamType: "بث قرآن مخصص",
    readingStyle: "مرتل",
    reciterKnown: true,
    reciterName: "ناصر القطامي",
    streamUrl: "https://qurango.net/radio/nasser_alqatami",
    quality: "128 kbps",
    logo: "/images/radio/reciter-generic.svg",
    sortOrder: 10,
  },
].sort((a, b) => a.sortOrder - b.sortOrder) as QuranRadioStation[];

export function getRadioStationById(id: string): QuranRadioStation | undefined {
  return QURAN_RADIO_STATIONS.find((s) => s.id === id);
}

/** Label shown in UI — never invent a reciter name for unknown live feeds */
export function getRadioDisplayLabel(station: QuranRadioStation): string {
  if (station.reciterKnown && station.reciterName) return station.reciterName;
  return "بث مباشر";
}
