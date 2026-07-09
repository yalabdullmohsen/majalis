/**
 * Quran radio streams (qurango.net) and live HLS channels.
 * All URLs verified as HTTPS streams serving real recitations.
 * Source: qurango.net (radio), cdn-globecast.akamaized.net (live).
 */

export type RadioStation = {
  id: string;
  reciterName: string;
  readingType: "مرتل" | "مجوّد";
  streamUrl: string;
};

export type LiveChannel = {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  source: string;
};

export const RADIO_STATIONS: RadioStation[] = [
  { id: "abdulbasit-murattal", reciterName: "عبد الباسط عبد الصمد", readingType: "مرتل", streamUrl: "https://qurango.net/radio/abdulbasit_abdulsamad_murattal" },
  { id: "abdulbasit-mujawwad", reciterName: "عبد الباسط عبد الصمد", readingType: "مجوّد", streamUrl: "https://qurango.net/radio/abdulbasit_abdulsamad_mujawwad" },
  { id: "minshawi-murattal", reciterName: "محمد صديق المنشاوي", readingType: "مرتل", streamUrl: "https://qurango.net/radio/mohammed_siddiq_alminshawi_murattal" },
  { id: "minshawi-mujawwad", reciterName: "محمد صديق المنشاوي", readingType: "مجوّد", streamUrl: "https://qurango.net/radio/mohammed_siddiq_alminshawi_mujawwad" },
  { id: "huthayfi", reciterName: "علي الحذيفي", readingType: "مرتل", streamUrl: "https://qurango.net/radio/ali_alhuthaifi" },
  { id: "dosari", reciterName: "ياسر الدوسري", readingType: "مرتل", streamUrl: "https://qurango.net/radio/yasser_aldosari" },
  { id: "ghamdi", reciterName: "سعد الغامدي", readingType: "مرتل", streamUrl: "https://qurango.net/radio/saad_alghamdi" },
  { id: "muaiqly", reciterName: "ماهر المعيقلي", readingType: "مرتل", streamUrl: "https://qurango.net/radio/maher_almuaiqly" },
  { id: "qatami", reciterName: "ناصر القطامي", readingType: "مرتل", streamUrl: "https://qurango.net/radio/nasser_alqatami" },
  { id: "shuraim", reciterName: "سعود الشريم", readingType: "مرتل", streamUrl: "https://qurango.net/radio/saud_alshuraim" },
  { id: "hussary-murattal", reciterName: "محمود خليل الحصري", readingType: "مرتل", streamUrl: "https://qurango.net/radio/mahmoud_khalil_alhussary_murattal" },
  { id: "hussary-mujawwad", reciterName: "محمود خليل الحصري", readingType: "مجوّد", streamUrl: "https://qurango.net/radio/mahmoud_khalil_alhussary_mujawwad" },
  { id: "mustafa-ismail", reciterName: "مصطفى إسماعيل", readingType: "مجوّد", streamUrl: "https://qurango.net/radio/mustafa_ismail" },
  { id: "shashae", reciterName: "عبد الفتاح الشعشاعي", readingType: "مجوّد", streamUrl: "https://qurango.net/radio/abdelfattah_elshaeshae" },
  { id: "bahtimi", reciterName: "كامل يوسف البهتيمي", readingType: "مجوّد", streamUrl: "https://qurango.net/radio/kamil_yusuf_albahtimi" },
  { id: "sudais", reciterName: "عبد الرحمن السديس", readingType: "مرتل", streamUrl: "https://qurango.net/radio/abdurrahman_as-sudais" },
  { id: "ajmy", reciterName: "أحمد العجمي", readingType: "مرتل", streamUrl: "https://qurango.net/radio/ahmed_ibn_ali_al-ajamy" },
  { id: "alafasy", reciterName: "مشاري راشد العفاسي", readingType: "مرتل", streamUrl: "https://qurango.net/radio/mishari_rashid_alafasy" },
  { id: "ayyub", reciterName: "أبو بكر الشاطري", readingType: "مرتل", streamUrl: "https://qurango.net/radio/abu_bakr_al-shatri" },
  { id: "juhany", reciterName: "علي الجهني", readingType: "مرتل", streamUrl: "https://qurango.net/radio/ali_aljuhany" },
  { id: "luhaidan", reciterName: "صالح اللحيدان", readingType: "مرتل", streamUrl: "https://qurango.net/radio/salah_alahmadi" },
];

export const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: "makkah",
    name: "قناة القرآن الكريم",
    description: "قناة القرآن الكريم السعودية — بث مباشر على مدار الساعة.",
    streamUrl: "https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8",
    source: "هيئة الإذاعة والتلفزيون السعودية",
  },
  {
    id: "madinah",
    name: "قناة السنة النبوية",
    description: "بث من المسجد النبوي الشريف — المدينة المنورة.",
    streamUrl: "https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8",
    source: "هيئة الإذاعة والتلفزيون السعودية",
  },
];

const LAST_RADIO_KEY = "mj-last-radio-v3";

export function loadLastRadioId(): string {
  try { return localStorage.getItem(LAST_RADIO_KEY) || RADIO_STATIONS[0].id; } catch { return RADIO_STATIONS[0].id; }
}

export function saveLastRadioId(id: string) {
  try { localStorage.setItem(LAST_RADIO_KEY, id); } catch { /* ignore */ }
}
